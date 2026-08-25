import type {
  AccessArgs,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  Field,
  PayloadRequest,
} from 'payload'
import { Forbidden, ValidationError } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import {
  canManageWordLifecycle,
  validateUsefulnessScore,
  Words,
  wordLifecycleStatuses,
  wordRegisters,
  wordTypes,
} from '../../../collections/Words'
import { enforceEditorDrafts } from '../../../collections/hooks/content'
import {
  enforceWordPublication,
  markWordPublicationIntent,
  mergeWordPublicationInput,
  validateWordForPublication,
} from '../../../collections/hooks/words'
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
  function find(fields: Field[]): Field | undefined {
    for (const field of fields) {
      if ('name' in field && field.name === name) return field

      if (field.type === 'tabs') {
        const nested = find(field.tabs.flatMap((tab) => tab.fields))
        if (nested) return nested
      }

      if (
        field.type === 'array' ||
        field.type === 'collapsible' ||
        field.type === 'group' ||
        field.type === 'row'
      ) {
        const nested = find(field.fields)
        if (nested) return nested
      }
    }

    return undefined
  }

  const field = find(Words.fields)

  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

function operationArgs(
  draft: boolean,
  operation: 'create' | 'restoreVersion' | 'update',
  role: UserRole = 'admin',
) {
  return {
    args: { draft },
    collection: Words,
    context: {},
    operation,
    overrideAccess: false,
    req: {
      context: {},
      t: vi.fn(),
      user: createUser(role),
    } as unknown as PayloadRequest,
  } as unknown as Parameters<CollectionBeforeOperationHook>[0]
}

function changeArgs(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  context: Record<string, unknown>,
) {
  return {
    collection: Words,
    context,
    data,
    operation: originalDoc ? 'update' : 'create',
    originalDoc,
    req: {
      context,
    } as PayloadRequest,
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]
}

const validPublication = {
  cefrLevel: 'A1',
  english: {
    meanings: [{ meaning: 'appointment' }],
  },
  lemma: 'der Termin',
  wordType: 'noun',
}

describe('words collection schema', () => {
  test('organizes editing into stable workflow sections', () => {
    const tabs = Words.fields.find((field) => field.type === 'tabs')
    const publishing = Words.fields.find(
      (field) => field.type === 'collapsible',
    )

    if (!tabs || tabs.type !== 'tabs') throw new Error('Missing workflow tabs')
    if (!publishing || publishing.type !== 'collapsible') {
      throw new Error('Missing publishing sidebar')
    }

    expect(tabs.tabs.map((tab) => tab.label)).toEqual([
      'German identity',
      'English support',
      'Bangla support',
      'Examples',
      'Relationships',
    ])
    expect(tabs.tabs.every((tab) => !('name' in tab))).toBe(true)
    expect(publishing).toMatchObject({
      admin: { initCollapsed: false, position: 'sidebar' },
      label: 'Review and publishing',
    })
    expect(namedField('duplicateWordWarning')).toMatchObject({
      type: 'ui',
      admin: {
        components: {
          Field:
            '/src/components/admin/words/duplicate-word-warning#DuplicateWordWarning',
        },
      },
    })
    expect(namedField('localizedPreviewLinks')).toMatchObject({
      type: 'ui',
      admin: {
        components: {
          Field:
            '/src/components/admin/words/localized-preview-links#LocalizedPreviewLinks',
        },
      },
    })
  })

  test('enables drafts and useful admin defaults', () => {
    expect(Words.slug).toBe('words')
    expect(Words.versions).toEqual({
      drafts: { autosave: false, validate: false },
      maxPerDoc: 50,
    })
    expect(Words.admin).toMatchObject({
      defaultColumns: [
        'lemma',
        'wordType',
        'cefrLevel',
        'lifecycleStatus',
        '_status',
      ],
      useAsTitle: 'lemma',
    })
  })

  test('defines the canonical word type, register, and lifecycle options', () => {
    expect(wordTypes).toEqual([
      'noun',
      'verb',
      'adjective',
      'adverb',
      'preposition',
      'conjunction',
      'phrase',
      'idiom',
    ])
    expect(wordRegisters).toEqual([
      'neutral',
      'formal',
      'informal',
      'slang',
      'academic',
      'official',
      'rude',
      'poetic',
      'archaic',
    ])
    expect(wordLifecycleStatuses).toEqual(['active', 'archived'])

    const lemma = namedField('lemma')
    const wordType = namedField('wordType')
    const register = namedField('register')
    const lifecycle = namedField('lifecycleStatus')

    expect(lemma).toMatchObject({ index: true, required: true, type: 'text' })
    expect(wordType).toMatchObject({ required: true, type: 'select' })
    expect(wordType).toMatchObject({ index: true })
    expect(register).toMatchObject({
      defaultValue: 'neutral',
      required: true,
      type: 'select',
    })
    expect(lifecycle).toMatchObject({
      defaultValue: 'active',
      index: true,
      label: 'Public lifecycle',
      required: true,
      type: 'select',
    })
    expect(lifecycle.admin?.description).toContain('Archive instead of deleting')
  })

  test('models noun-only fields, usefulness, and topic relationships', async () => {
    const gender = namedField('gender')
    const pluralForm = namedField('pluralForm')
    const usefulness = namedField('usefulnessScore')
    const topicTags = namedField('topicTags')

    if (gender.type !== 'select' || pluralForm.type !== 'text') {
      throw new Error('Unexpected noun field type')
    }
    if (usefulness.type !== 'number') {
      throw new Error('Usefulness must be numeric')
    }
    if (topicTags.type !== 'relationship') {
      throw new Error('Topic tags must be a relationship')
    }

    expect(
      gender.admin?.condition?.(
        { wordType: 'noun' },
        {} as never,
        {} as never,
      ),
    ).toBe(true)
    expect(
      pluralForm.admin?.condition?.(
        { wordType: 'verb' },
        {} as never,
        {} as never,
      ),
    ).toBe(false)
    expect(await validateUsefulnessScore(1, {} as never)).toBe(true)
    expect(await validateUsefulnessScore(5, {} as never)).toBe(true)
    expect(await validateUsefulnessScore(0, {} as never)).toBe(
      'Usefulness score must be an integer from 1 to 5.',
    )
    expect(await validateUsefulnessScore(2.5, {} as never)).toBe(
      'Usefulness score must be an integer from 1 to 5.',
    )
    expect(topicTags).toMatchObject({
      hasMany: true,
      maxDepth: 1,
      relationTo: 'topic-tags',
    })
  })

  test('requires English meanings and keeps Bangla and examples optional', () => {
    const english = namedField('english')
    const bangla = namedField('bangla')
    const examples = namedField('examples')
    const review = namedField('review')

    if (english.type !== 'group' || bangla.type !== 'group') {
      throw new Error('Learner support must use groups')
    }
    if (examples.type !== 'array' || review.type !== 'group') {
      throw new Error('Unexpected examples or review type')
    }

    const englishMeanings = english.fields.find(
      (field) => 'name' in field && field.name === 'meanings',
    )
    const banglaMeanings = bangla.fields.find(
      (field) => 'name' in field && field.name === 'meanings',
    )
    const banglaExample = examples.fields.find(
      (field) => 'name' in field && field.name === 'banglaExplanation',
    )

    expect(englishMeanings).toMatchObject({
      minRows: 1,
      required: true,
      type: 'array',
    })
    expect(banglaMeanings).toMatchObject({ type: 'array' })
    expect(
      banglaMeanings && 'required' in banglaMeanings
        ? banglaMeanings.required
        : undefined,
    ).toBeUndefined()
    expect(bangla.access?.read).toBeTypeOf('function')
    expect(banglaExample?.access?.read).toBeTypeOf('function')
    expect(
      review.fields.map((field) => ('name' in field ? field.name : null)),
    ).toEqual([
      'germanReviewed',
      'englishReviewed',
      'banglaReviewed',
      'audioReviewed',
      'quizReviewed',
    ])
  })
})

describe('words access and workflow', () => {
  test('allows editorial writes while reserving deletion for admins', async () => {
    const create = Words.access?.create
    const update = Words.access?.update
    const deleteAccess = Words.access?.delete

    if (!create || !update || !deleteAccess) {
      throw new Error('Missing word write access')
    }

    for (const access of [create, update]) {
      expect(await access(createAccessArgs(createUser('admin')))).toBe(true)
      expect(await access(createAccessArgs(createUser('editor')))).toBe(true)
      expect(await access(createAccessArgs(createUser('learner')))).toBe(false)
      expect(await access(createAccessArgs(null))).toBe(false)
    }

    expect(await deleteAccess(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await deleteAccess(createAccessArgs(createUser('editor')))).toBe(
      false,
    )
  })

  test('limits non-editorial reads to active published words', async () => {
    const read = Words.access?.read
    if (!read) throw new Error('Missing word read access')

    const publicConstraint = {
      and: [
        { _status: { equals: 'published' } },
        { lifecycleStatus: { equals: 'active' } },
      ],
    }

    expect(await read(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await read(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await read(createAccessArgs(createUser('learner')))).toEqual(
      publicConstraint,
    )
    expect(await read(createAccessArgs(null))).toEqual(publicConstraint)
    expect(
      await read(
        createAccessArgs(
          createUser('admin', 'suspended'),
        ),
      ),
    ).toEqual(publicConstraint)
  })

  test('reserves lifecycle changes for active admins', async () => {
    expect(
      await canManageWordLifecycle(
        createAccessArgs(createUser('admin')) as never,
      ),
    ).toBe(true)
    expect(
      await canManageWordLifecycle(
        createAccessArgs(createUser('editor')) as never,
      ),
    ).toBe(false)
    expect(
      await canManageWordLifecycle(
        createAccessArgs(createUser('admin', 'suspended')) as never,
      ),
    ).toBe(false)
  })

  test('hides pending Bangla support in groups and examples', async () => {
    const bangla = namedField('bangla')
    const examples = namedField('examples')

    if (bangla.type !== 'group' || examples.type !== 'array') {
      throw new Error('Unexpected learner content fields')
    }

    const banglaExample = examples.fields.find(
      (field) => 'name' in field && field.name === 'banglaExplanation',
    )
    const groupRead = bangla.access?.read
    const exampleRead = banglaExample?.access?.read

    if (!groupRead || !exampleRead) {
      throw new Error('Missing Bangla read access')
    }

    const pending = {
      doc: { review: { banglaReviewed: false } },
      req: { user: null } as PayloadRequest,
    }
    const approved = {
      doc: { review: { banglaReviewed: true } },
      req: { user: null } as PayloadRequest,
    }

    expect(await groupRead(pending as never)).toBe(false)
    expect(await exampleRead(pending as never)).toBe(false)
    expect(await groupRead(approved as never)).toBe(true)
    expect(await exampleRead(approved as never)).toBe(true)
  })

  test('allows editors to save drafts but rejects publish and restore attempts', () => {
    expect(() =>
      enforceEditorDrafts(operationArgs(true, 'create', 'editor')),
    ).not.toThrow()
    expect(() =>
      enforceEditorDrafts(operationArgs(false, 'create', 'editor')),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(operationArgs(false, 'update', 'editor')),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(operationArgs(false, 'restoreVersion', 'editor')),
    ).toThrow(Forbidden)
    expect(() =>
      enforceEditorDrafts(operationArgs(false, 'update', 'admin')),
    ).not.toThrow()
  })
})

describe('word publication validation', () => {
  test('reports each publication blocker with a stable field path', () => {
    expect(validateWordForPublication({})).toEqual([
      {
        message:
          'Enter the German headword in German identity before publishing.',
        path: 'lemma',
      },
      {
        message: 'Choose a word type in German identity before publishing.',
        path: 'wordType',
      },
      {
        message: 'Choose a CEFR level in German identity before publishing.',
        path: 'cefrLevel',
      },
      {
        message:
          'Add at least one non-empty meaning in English support before publishing.',
        path: 'english.meanings',
      },
    ])
  })

  test.each([
    ['lemma', { ...validPublication, lemma: ' ' }],
    ['wordType', { ...validPublication, wordType: undefined }],
    ['cefrLevel', { ...validPublication, cefrLevel: undefined }],
    [
      'english.meanings',
      { ...validPublication, english: { meanings: [] } },
    ],
  ])('isolates the %s publish blocker', (path, input) => {
    expect(validateWordForPublication(input)).toEqual([
      expect.objectContaining({ path }),
    ])
  })

  test('rejects whitespace-only meanings and accepts a valid word', () => {
    expect(
      validateWordForPublication({
        ...validPublication,
        english: { meanings: [{ meaning: '   ' }] },
      }),
    ).toEqual([expect.objectContaining({ path: 'english.meanings' })])
    expect(validateWordForPublication(validPublication)).toEqual([])
  })

  test('merges partial updates without discarding stored meanings', () => {
    expect(
      mergeWordPublicationInput(
        { lemma: 'der neue Termin' },
        validPublication,
      ),
    ).toEqual({
      ...validPublication,
      lemma: 'der neue Termin',
    })

    expect(
      mergeWordPublicationInput(
        { english: { meanings: [] } },
        validPublication,
      ).english?.meanings,
    ).toEqual([])
  })

  test('allows incomplete drafts but validates published creates and updates', () => {
    const draftOperation = operationArgs(true, 'create')
    markWordPublicationIntent(draftOperation)
    expect(() =>
      enforceWordPublication(
        changeArgs({}, undefined, draftOperation.req.context),
      ),
    ).not.toThrow()

    const publishOperation = operationArgs(false, 'create')
    markWordPublicationIntent(publishOperation)
    expect(() =>
      enforceWordPublication(
        changeArgs({}, undefined, publishOperation.req.context),
      ),
    ).toThrow(ValidationError)
    expect(() =>
      enforceWordPublication(
        changeArgs(validPublication, undefined, publishOperation.req.context),
      ),
    ).not.toThrow()
  })

  test('applies the same publication intent to restored versions', () => {
    const draftRestore = operationArgs(true, 'restoreVersion')
    markWordPublicationIntent(draftRestore)
    expect(draftRestore.req.context.validateWordPublication).toBe(false)

    const publishedRestore = operationArgs(false, 'restoreVersion')
    markWordPublicationIntent(publishedRestore)
    expect(publishedRestore.req.context.validateWordPublication).toBe(true)
  })
})
