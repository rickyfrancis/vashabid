import type {
  AccessArgs,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  Field,
  PayloadRequest,
} from 'payload'
import { Forbidden, ValidationError } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { GrammarTopics } from '../../../collections/GrammarTopics'
import { enforceEditorDrafts } from '../../../collections/hooks/content'
import {
  enforceGrammarTopicPublication,
  markGrammarTopicPublicationIntent,
  mergeGrammarTopicPublicationInput,
  validateGrammarTopicForPublication,
} from '../../../collections/hooks/grammarTopics'
import { richTextParagraphs } from './fields'
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
  return { accountStatus, collection: 'users', id: 7, role }
}

function createAccessArgs(user: unknown): AccessArgs {
  return { req: { user } as PayloadRequest }
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

  const field = find(GrammarTopics.fields)

  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

function groupField(groupName: string, fieldName: string) {
  const group = namedField(groupName)
  if (group.type !== 'group') throw new Error(`${groupName} must be a group`)

  const field = group.fields.find(
    (candidate) => 'name' in candidate && candidate.name === fieldName,
  )
  if (!field) throw new Error(`Missing ${groupName}.${fieldName}`)
  return field
}

function operationArgs(
  draft: boolean,
  operation: 'create' | 'restoreVersion' | 'update',
  role: UserRole = 'admin',
  overrideAccess = false,
) {
  return {
    args: { draft },
    collection: GrammarTopics,
    context: {},
    operation,
    overrideAccess,
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
    collection: GrammarTopics,
    context,
    data,
    operation: originalDoc ? 'update' : 'create',
    originalDoc,
    req: { context } as PayloadRequest,
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]
}

const validPublication = {
  cefrLevel: 'A2',
  english: { explanation: richTextParagraphs('Use haben for most verbs.') },
  name: 'Perfekt mit haben und sein',
  shortRule: 'Das Perfekt bildet man mit haben oder sein plus Partizip II.',
}

describe('grammar topics collection schema', () => {
  test('enables drafts and useful admin defaults', () => {
    expect(GrammarTopics.slug).toBe('grammar-topics')
    expect(GrammarTopics.versions).toEqual({
      drafts: { autosave: false, validate: false },
      maxPerDoc: 50,
    })
    expect(GrammarTopics.admin).toMatchObject({
      defaultColumns: ['name', 'cefrLevel', '_status'],
      useAsTitle: 'name',
    })
  })

  test('organizes editing into stable workflow sections', () => {
    const tabs = GrammarTopics.fields.find((field) => field.type === 'tabs')

    if (!tabs || tabs.type !== 'tabs') throw new Error('Missing workflow tabs')

    expect(tabs.tabs.map((tab) => tab.label)).toEqual([
      'German identity',
      'English support',
      'Bangla support',
      'Examples',
      'Relationships',
    ])
  })

  test('indexes the German identity fields used for browsing', () => {
    const name = namedField('name')
    const cefrLevel = namedField('cefrLevel')
    const shortRule = namedField('shortRule')

    expect(name).toMatchObject({ type: 'text', index: true, required: true })
    expect(cefrLevel).toMatchObject({ type: 'select', index: true, required: true })
    expect(shortRule).toMatchObject({ type: 'textarea', required: true })
  })

  test('requires an English explanation but keeps Bangla optional', () => {
    const english = groupField('english', 'explanation')
    const bangla = groupField('bangla', 'explanation')

    expect(english).toMatchObject({ type: 'richText', required: true })
    expect(bangla).toMatchObject({ type: 'richText' })
    expect('required' in bangla ? bangla.required : undefined).toBeUndefined()
  })

  test('keeps examples aligned with a required English explanation', () => {
    const examples = namedField('examples')
    if (examples.type !== 'array') throw new Error('examples must be an array')

    expect(examples.fields).toMatchObject([
      { name: 'germanSentence', required: true },
      { name: 'englishExplanation', required: true },
      { name: 'banglaExplanation' },
    ])
    expect(
      'required' in examples.fields[2] ? examples.fields[2].required : undefined,
    ).toBeUndefined()
  })

  test('bounds relationships to topics and words', () => {
    const topicTags = namedField('topicTags')
    const relatedWords = namedField('relatedWords')

    expect(topicTags).toMatchObject({
      type: 'relationship',
      hasMany: true,
      maxDepth: 1,
      relationTo: 'topic-tags',
    })
    expect(relatedWords).toMatchObject({
      type: 'relationship',
      hasMany: true,
      maxDepth: 0,
      relationTo: 'words',
    })
  })

  test('tracks only review targets that have real content', () => {
    const review = namedField('review')
    if (review.type !== 'group') throw new Error('review must be a group')

    expect(
      review.fields.map((field) => ('name' in field ? field.name : null)),
    ).toEqual(['germanReviewed', 'englishReviewed', 'banglaReviewed'])
  })
})

describe('grammar topics access', () => {
  test('allows only active editorial users to write', async () => {
    const create = GrammarTopics.access?.create
    const update = GrammarTopics.access?.update
    const deleteAccess = GrammarTopics.access?.delete

    if (!create || !update || !deleteAccess) {
      throw new Error('Missing grammar topic write access')
    }

    expect(await create(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await create(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await create(createAccessArgs(createUser('learner')))).toBe(false)
    expect(await create(createAccessArgs(null))).toBe(false)
    expect(
      await update(createAccessArgs(createUser('editor', 'suspended'))),
    ).toBe(false)
    expect(await deleteAccess(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await deleteAccess(createAccessArgs(createUser('editor')))).toBe(
      false,
    )
  })

  test('shows drafts only to active editorial users', async () => {
    const read = GrammarTopics.access?.read
    const readVersions = GrammarTopics.access?.readVersions
    const published = { _status: { equals: 'published' } }

    if (!read || !readVersions) throw new Error('Missing read access')

    expect(await read(createAccessArgs(createUser('admin')))).toBe(true)
    expect(await read(createAccessArgs(createUser('editor')))).toBe(true)
    expect(await read(createAccessArgs(createUser('learner')))).toEqual(
      published,
    )
    expect(await read(createAccessArgs(null))).toEqual(published)
    expect(await readVersions(createAccessArgs(createUser('learner')))).toBe(
      false,
    )
  })

  test('hides unreviewed Bangla from the group and from examples', async () => {
    const bangla = namedField('bangla')
    if (bangla.type !== 'group') throw new Error('bangla must be a group')

    const examples = namedField('examples')
    if (examples.type !== 'array') throw new Error('examples must be an array')

    const groupRead = bangla.access?.read
    const exampleRead =
      'access' in examples.fields[2]
        ? examples.fields[2].access?.read
        : undefined

    if (!groupRead || !exampleRead) throw new Error('Missing Bangla gating')

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
    expect(() =>
      enforceEditorDrafts(operationArgs(false, 'update', 'editor', true)),
    ).not.toThrow()
  })
})

describe('grammar topic publication validation', () => {
  test('reports each publication blocker with a stable field path', () => {
    expect(validateGrammarTopicForPublication({})).toEqual([
      {
        message:
          'Enter the German grammar topic name in German identity before publishing.',
        path: 'name',
      },
      {
        message: 'Choose a CEFR level in German identity before publishing.',
        path: 'cefrLevel',
      },
      {
        message:
          'Summarise the rule in one German sentence in German identity before publishing.',
        path: 'shortRule',
      },
      {
        message:
          'Write a non-empty explanation in English support before publishing.',
        path: 'english.explanation',
      },
    ])
  })

  test('accepts a complete topic and rejects whitespace-only German text', () => {
    expect(validateGrammarTopicForPublication(validPublication)).toEqual([])
    expect(
      validateGrammarTopicForPublication({
        ...validPublication,
        shortRule: '   ',
      }).map((error) => error.path),
    ).toEqual(['shortRule'])
  })

  test('rejects a structurally valid but empty English explanation', () => {
    expect(
      validateGrammarTopicForPublication({
        ...validPublication,
        english: { explanation: richTextParagraphs('   ') },
      }).map((error) => error.path),
    ).toEqual(['english.explanation'])
  })

  test('keeps stored values when an update omits them', () => {
    expect(
      mergeGrammarTopicPublicationInput({ name: 'Relativsätze' }, validPublication),
    ).toMatchObject({
      cefrLevel: 'A2',
      name: 'Relativsätze',
      shortRule: validPublication.shortRule,
    })
    expect(
      mergeGrammarTopicPublicationInput({ english: {} }, validPublication)
        .english?.explanation,
    ).toEqual(validPublication.english.explanation)
    expect(
      mergeGrammarTopicPublicationInput({ english: null }, validPublication)
        .english?.explanation,
    ).toBeUndefined()
  })

  test('validates publishes and skips drafts', () => {
    const publishContext = { validateGrammarTopicPublication: true }
    const draftContext = { validateGrammarTopicPublication: false }

    expect(() =>
      enforceGrammarTopicPublication(changeArgs({}, undefined, draftContext)),
    ).not.toThrow()
    expect(() =>
      enforceGrammarTopicPublication(changeArgs({}, undefined, publishContext)),
    ).toThrow(ValidationError)
    expect(() =>
      enforceGrammarTopicPublication(
        changeArgs(validPublication, undefined, publishContext),
      ),
    ).not.toThrow()
  })

  test('marks publish intent for writes but not for drafts', () => {
    const publish = operationArgs(false, 'update')
    const draft = operationArgs(true, 'update')

    markGrammarTopicPublicationIntent(publish as never)
    markGrammarTopicPublicationIntent(draft as never)

    expect(publish.req.context.validateGrammarTopicPublication).toBe(true)
    expect(draft.req.context.validateGrammarTopicPublication).toBe(false)
  })
})
