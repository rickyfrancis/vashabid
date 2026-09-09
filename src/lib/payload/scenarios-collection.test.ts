import type {
  AccessArgs,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  Field,
  PayloadRequest,
} from 'payload'
import { Forbidden, ValidationError } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { Scenarios } from '../../../collections/Scenarios'
import { enforceEditorDrafts } from '../../../collections/hooks/content'
import {
  enforceScenarioPublication,
  markScenarioPublicationIntent,
  mergeScenarioPublicationInput,
  validateScenarioForPublication,
} from '../../../collections/hooks/scenarios'
import { situationTypes } from '../../features/scenarios/constants'
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

  const field = find(Scenarios.fields)

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
    collection: Scenarios,
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
    collection: Scenarios,
    context,
    data,
    operation: originalDoc ? 'update' : 'create',
    originalDoc,
    req: { context } as PayloadRequest,
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]
}

const validPublication = {
  cefrLevel: 'A1',
  dialogue: [
    {
      englishExplanation: 'A polite way to order.',
      germanLine: 'Ich hätte gern einen Kaffee.',
      speaker: 'Kundin',
    },
  ],
  english: { explanation: richTextParagraphs('Greet, then order politely.') },
  learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
  situationType: 'everyday',
  title: 'Im Café bestellen',
}

describe('scenarios collection schema', () => {
  test('enables drafts and useful admin defaults', () => {
    expect(Scenarios.slug).toBe('scenarios')
    expect(Scenarios.versions).toEqual({
      drafts: { autosave: false, validate: false },
      maxPerDoc: 50,
    })
    expect(Scenarios.admin).toMatchObject({
      defaultColumns: ['title', 'situationType', 'cefrLevel', '_status'],
      useAsTitle: 'title',
    })
  })

  test('organizes editing into stable workflow sections', () => {
    const tabs = Scenarios.fields.find((field) => field.type === 'tabs')

    if (!tabs || tabs.type !== 'tabs') throw new Error('Missing workflow tabs')

    expect(tabs.tabs.map((tab) => tab.label)).toEqual([
      'German identity',
      'English support',
      'Bangla support',
      'Dialogue',
      'Relationships',
    ])
  })

  test('indexes the German identity fields used for browsing', () => {
    expect(namedField('title')).toMatchObject({
      type: 'text',
      index: true,
      required: true,
    })
    expect(namedField('cefrLevel')).toMatchObject({
      type: 'select',
      index: true,
      required: true,
    })
    expect(namedField('situationType')).toMatchObject({
      type: 'select',
      index: true,
      required: true,
    })
    expect(namedField('learnerGoal')).toMatchObject({
      type: 'textarea',
      required: true,
    })
  })

  test('offers exactly the supported situation types as options', () => {
    const situationType = namedField('situationType')
    if (situationType.type !== 'select') {
      throw new Error('situationType must be a select')
    }

    expect(
      situationType.options.map((option) =>
        typeof option === 'string' ? option : option.value,
      ),
    ).toEqual([...situationTypes])
  })

  test('requires an English explanation but keeps Bangla optional', () => {
    const english = groupField('english', 'explanation')
    const bangla = groupField('bangla', 'explanation')

    expect(english).toMatchObject({ type: 'richText', required: true })
    expect(bangla).toMatchObject({ type: 'richText' })
    expect('required' in bangla ? bangla.required : undefined).toBeUndefined()
  })

  test('keeps dialogue lines aligned with a required English explanation', () => {
    const dialogue = namedField('dialogue')
    if (dialogue.type !== 'array') throw new Error('dialogue must be an array')

    expect(dialogue.fields).toMatchObject([
      { name: 'speaker', required: true },
      { name: 'germanLine', required: true },
      { name: 'englishExplanation', required: true },
      { name: 'banglaExplanation' },
    ])
    expect(
      'required' in dialogue.fields[3] ? dialogue.fields[3].required : undefined,
    ).toBeUndefined()
  })

  test('bounds relationships to topics, words, and grammar', () => {
    expect(namedField('topicTags')).toMatchObject({
      type: 'relationship',
      hasMany: true,
      maxDepth: 1,
      relationTo: 'topic-tags',
    })
    expect(namedField('keyVocabulary')).toMatchObject({
      type: 'relationship',
      hasMany: true,
      maxDepth: 0,
      relationTo: 'words',
    })
    expect(namedField('relatedGrammarTopics')).toMatchObject({
      type: 'relationship',
      hasMany: true,
      maxDepth: 0,
      relationTo: 'grammar-topics',
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

describe('scenarios access', () => {
  test('allows only active editorial users to write', async () => {
    const create = Scenarios.access?.create
    const update = Scenarios.access?.update
    const deleteAccess = Scenarios.access?.delete

    if (!create || !update || !deleteAccess) {
      throw new Error('Missing scenario write access')
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
    const read = Scenarios.access?.read
    const readVersions = Scenarios.access?.readVersions
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

  test('hides unreviewed Bangla from the group and from dialogue lines', async () => {
    const bangla = namedField('bangla')
    if (bangla.type !== 'group') throw new Error('bangla must be a group')

    const dialogue = namedField('dialogue')
    if (dialogue.type !== 'array') throw new Error('dialogue must be an array')

    const groupRead = bangla.access?.read
    const lineRead =
      'access' in dialogue.fields[3]
        ? dialogue.fields[3].access?.read
        : undefined

    if (!groupRead || !lineRead) throw new Error('Missing Bangla gating')

    const pending = {
      doc: { review: { banglaReviewed: false } },
      req: { user: null } as PayloadRequest,
    }
    const approved = {
      doc: { review: { banglaReviewed: true } },
      req: { user: null } as PayloadRequest,
    }

    expect(await groupRead(pending as never)).toBe(false)
    expect(await lineRead(pending as never)).toBe(false)
    expect(await groupRead(approved as never)).toBe(true)
    expect(await lineRead(approved as never)).toBe(true)
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

describe('scenario publication validation', () => {
  test('reports each publication blocker with a stable field path', () => {
    expect(validateScenarioForPublication({})).toEqual([
      {
        message:
          'Enter the German scenario title in German identity before publishing.',
        path: 'title',
      },
      {
        message: 'Choose a CEFR level in German identity before publishing.',
        path: 'cefrLevel',
      },
      {
        message:
          'Choose a situation type in German identity before publishing.',
        path: 'situationType',
      },
      {
        message:
          'State the learner goal in one German sentence in German identity before publishing.',
        path: 'learnerGoal',
      },
      {
        message:
          'Write a non-empty explanation in English support before publishing.',
        path: 'english.explanation',
      },
      {
        message:
          'Add at least one dialogue line with a German line and an English explanation before publishing.',
        path: 'dialogue',
      },
    ])
  })

  test('accepts a complete scenario and rejects whitespace-only German text', () => {
    expect(validateScenarioForPublication(validPublication)).toEqual([])
    expect(
      validateScenarioForPublication({
        ...validPublication,
        learnerGoal: '   ',
      }).map((error) => error.path),
    ).toEqual(['learnerGoal'])
  })

  test('rejects a structurally valid but empty English explanation', () => {
    expect(
      validateScenarioForPublication({
        ...validPublication,
        english: { explanation: richTextParagraphs('   ') },
      }).map((error) => error.path),
    ).toEqual(['english.explanation'])
  })

  test('rejects a dialogue whose lines are empty or half-written', () => {
    const paths = (dialogue: unknown) =>
      validateScenarioForPublication({ ...validPublication, dialogue }).map(
        (error) => error.path,
      )

    expect(paths([])).toEqual(['dialogue'])
    expect(paths(undefined)).toEqual(['dialogue'])
    expect(paths('not-an-array')).toEqual(['dialogue'])
    expect(paths([{ germanLine: 'Guten Tag.', speaker: 'Kellner' }])).toEqual([
      'dialogue',
    ])
    expect(paths([{ englishExplanation: 'A greeting.' }])).toEqual(['dialogue'])
    expect(
      paths([{ englishExplanation: '  ', germanLine: '  ', speaker: 'x' }]),
    ).toEqual(['dialogue'])
  })

  test('accepts a dialogue where only one line is complete', () => {
    expect(
      validateScenarioForPublication({
        ...validPublication,
        dialogue: [
          { germanLine: 'Guten Tag.', speaker: 'Kellner' },
          {
            englishExplanation: 'A polite order.',
            germanLine: 'Ich hätte gern einen Kaffee.',
            speaker: 'Kundin',
          },
        ],
      }),
    ).toEqual([])
  })

  test('keeps stored values when an update omits them', () => {
    expect(
      mergeScenarioPublicationInput(
        { title: 'Am Bahnhof fragen' },
        validPublication,
      ),
    ).toMatchObject({
      cefrLevel: 'A1',
      learnerGoal: validPublication.learnerGoal,
      situationType: 'everyday',
      title: 'Am Bahnhof fragen',
    })
    expect(
      mergeScenarioPublicationInput({ english: {} }, validPublication).english
        ?.explanation,
    ).toEqual(validPublication.english.explanation)
    expect(
      mergeScenarioPublicationInput({ english: null }, validPublication).english
        ?.explanation,
    ).toBeUndefined()
    expect(
      mergeScenarioPublicationInput({}, validPublication).dialogue,
    ).toEqual(validPublication.dialogue)
  })

  test('validates publishes and skips drafts', () => {
    const publishContext = { validateScenarioPublication: true }
    const draftContext = { validateScenarioPublication: false }

    expect(() =>
      enforceScenarioPublication(changeArgs({}, undefined, draftContext)),
    ).not.toThrow()
    expect(() =>
      enforceScenarioPublication(changeArgs({}, undefined, publishContext)),
    ).toThrow(ValidationError)
    expect(() =>
      enforceScenarioPublication(
        changeArgs(validPublication, undefined, publishContext),
      ),
    ).not.toThrow()
  })

  test('marks publish intent for writes but not for drafts', () => {
    const publish = operationArgs(false, 'update')
    const draft = operationArgs(true, 'update')

    markScenarioPublicationIntent(publish as never)
    markScenarioPublicationIntent(draft as never)

    expect(publish.req.context.validateScenarioPublication).toBe(true)
    expect(draft.req.context.validateScenarioPublication).toBe(false)
  })
})
