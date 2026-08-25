import type {
  AccessArgs,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'
import { Forbidden } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { TopicTags, validateSortOrder } from '../../../collections/TopicTags'
import {
  validateTopicTagParent,
} from '../../../collections/hooks/topicTags'
import { enforceEditorDrafts } from '../../../collections/hooks/content'
import type { AccountStatus, UserRole } from './access'

interface TestUser {
  accountStatus: AccountStatus
  collection: 'users'
  id: number
  role: UserRole
}

function createUser(
  role: UserRole,
  accountStatus: AccountStatus = 'active',
): TestUser {
  return {
    accountStatus,
    collection: 'users',
    id: 7,
    role,
  }
}

function createAccessArgs(user: unknown): AccessArgs {
  return {
    req: { user } as PayloadRequest,
  }
}

function namedField(name: string) {
  const field = TopicTags.fields.find(
    (candidate) => 'name' in candidate && candidate.name === name,
  )

  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

function editorOperationArgs(
  role: UserRole,
  draft: boolean,
  operation: 'create' | 'restoreVersion' | 'update',
  overrideAccess = false,
) {
  return {
    args: { draft },
    collection: TopicTags,
    context: {},
    operation,
    overrideAccess,
    req: {
      t: vi.fn(),
      user: createUser(role),
    } as unknown as PayloadRequest,
  } as unknown as Parameters<CollectionBeforeOperationHook>[0]
}

describe('topic tags collection schema', () => {
  test('enables drafts and useful admin defaults', () => {
    expect(TopicTags.slug).toBe('topic-tags')
    expect(TopicTags.versions).toEqual({
      drafts: { autosave: false, validate: false },
      maxPerDoc: 50,
    })
    expect(TopicTags.admin).toMatchObject({
      defaultColumns: ['name', 'parent', 'sortOrder', '_status'],
      useAsTitle: 'name',
    })
  })

  test('requires German name and English description but keeps Bangla optional', () => {
    const name = namedField('name')
    const english = namedField('english')
    const bangla = namedField('bangla')

    if (name.type !== 'text') throw new Error('name must be text')
    if (english.type !== 'group') throw new Error('english must be a group')
    if (bangla.type !== 'group') throw new Error('bangla must be a group')

    const englishDescription = english.fields[0]
    const banglaDescription = bangla.fields[0]

    expect(name.required).toBe(true)
    expect(englishDescription).toMatchObject({
      name: 'description',
      type: 'textarea',
      required: true,
    })
    expect(banglaDescription).toMatchObject({
      name: 'description',
      type: 'textarea',
    })
    expect(
      'required' in banglaDescription ? banglaDescription.required : undefined,
    ).toBeUndefined()
  })

  test('configures a bounded self-relationship and validated sort order', async () => {
    const parent = namedField('parent')
    const sortOrder = namedField('sortOrder')

    if (parent.type !== 'relationship') {
      throw new Error('parent must be a relationship')
    }
    if (sortOrder.type !== 'number') {
      throw new Error('sortOrder must be a number')
    }

    expect(parent.relationTo).toBe('topic-tags')
    expect(parent.maxDepth).toBe(1)
    expect(parent.validate).toBe(validateTopicTagParent)
    expect(sortOrder.defaultValue).toBe(0)
    expect(sortOrder.required).toBe(true)
    expect(await validateSortOrder(0, {} as never)).toBe(true)
    expect(await validateSortOrder(4, {} as never)).toBe(true)
    expect(await validateSortOrder(-1, {} as never)).toBe(
      'Sort order must be a non-negative integer.',
    )
    expect(await validateSortOrder(1.5, {} as never)).toBe(
      'Sort order must be a non-negative integer.',
    )
  })
})

describe('topic tags access', () => {
  test('allows only active editorial users to write', async () => {
    const create = TopicTags.access?.create
    const update = TopicTags.access?.update
    const deleteAccess = TopicTags.access?.delete

    if (!create || !update || !deleteAccess) {
      throw new Error('Missing topic tag write access')
    }

    expect(await create(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await create(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await create(createAccessArgs(createUser('learner')))).toBe(false)
    expect(await create(createAccessArgs(null))).toBe(false)
    expect(
      await update(
        createAccessArgs(createUser('editor', 'suspended')),
      ),
    ).toBe(false)
    expect(await deleteAccess(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await deleteAccess(createAccessArgs(createUser('editor')))).toBe(false)
  })

  test('shows drafts only to active editorial users', async () => {
    const read = TopicTags.access?.read
    const readVersions = TopicTags.access?.readVersions
    const published = { _status: { equals: 'published' } }

    if (!read || !readVersions) throw new Error('Missing topic tag read access')

    expect(await read(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await read(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await read(createAccessArgs(createUser('learner')))).toEqual(published)
    expect(await read(createAccessArgs(null))).toEqual(published)
    expect(await readVersions(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await readVersions(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await readVersions(createAccessArgs(createUser('learner')))).toBe(false)
  })

  test('allows editors to save drafts but not publish or unpublish', () => {
    expect(() =>
      enforceEditorDrafts(editorOperationArgs('editor', true, 'create')),
    ).not.toThrow()
    expect(() =>
      enforceEditorDrafts(editorOperationArgs('editor', true, 'update')),
    ).not.toThrow()
    expect(() =>
      enforceEditorDrafts(editorOperationArgs('editor', false, 'create')),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(editorOperationArgs('editor', false, 'update')),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(
        editorOperationArgs('editor', false, 'restoreVersion'),
      ),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(
        editorOperationArgs('editor', true, 'restoreVersion'),
      ),
    ).not.toThrow()
    expect(() =>
      enforceEditorDrafts(editorOperationArgs('admin', false, 'update')),
    ).not.toThrow()
    expect(() =>
      enforceEditorDrafts(
        editorOperationArgs('editor', false, 'update', true),
      ),
    ).not.toThrow()
  })
})

describe('topic tag parent validation', () => {
  test('rejects a tag as its own parent without querying', async () => {
    const findByID = vi.fn()
    const req = { payload: { findByID } } as unknown as PayloadRequest

    expect(
      await validateTopicTagParent(4, { id: 4, req } as never),
    ).toBe('A topic tag cannot be its own parent or descendant.')
    expect(findByID).not.toHaveBeenCalled()
  })

  test('rejects an indirect descendant as a parent', async () => {
    const findByID = vi.fn(async ({ id }: { id: number }) => {
      if (id === 2) return { id: 2, parent: 3 }
      return { id: 3, parent: 1 }
    })
    const req = { payload: { findByID } } as unknown as PayloadRequest

    expect(
      await validateTopicTagParent(2, { id: 1, req } as never),
    ).toBe('A topic tag cannot be its own parent or descendant.')
    expect(findByID).toHaveBeenCalledTimes(2)
  })

  test('accepts a valid root and valid parent chain', async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({ id: 2, parent: 3 })
      .mockResolvedValueOnce({ id: 3, parent: null })
    const req = { payload: { findByID } } as unknown as PayloadRequest

    expect(await validateTopicTagParent(null, { id: 1, req } as never)).toBe(
      true,
    )
    expect(await validateTopicTagParent(2, { id: 1, req } as never)).toBe(true)
    expect(findByID).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'topic-tags',
        depth: 0,
        draft: true,
        overrideAccess: true,
        req,
      }),
    )
  })
})
