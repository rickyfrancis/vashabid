import type {
  AccessArgs,
  Field,
  FieldAccessArgs,
  PayloadRequest,
} from 'payload'
import { describe, expect, test } from 'vitest'

import { Feedback } from '../../../collections/Feedback'
import {
  feedbackContentTypes,
  feedbackStatuses,
  feedbackTypes,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
} from '../../features/feedback/constants'
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

function createFieldAccessArgs(user: unknown): FieldAccessArgs {
  return { req: { user } as PayloadRequest } as FieldAccessArgs
}

function namedField(name: string): Field {
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

  const field = find(Feedback.fields)

  if (!field) throw new Error(`Missing field: ${name}`)
  return field
}

function optionValues(name: string): string[] {
  const field = namedField(name)
  if (field.type !== 'select') throw new Error(`${name} must be a select`)

  return field.options.map((option) =>
    typeof option === 'string' ? option : option.value,
  )
}

function fieldAccess(name: string) {
  const field = namedField(name)
  return (field as { access?: Record<string, unknown> }).access
}

const malformedIdentities = [
  ['no user', null],
  ['undefined', undefined],
  ['an empty object', {}],
  ['an unknown role', { collection: 'users', id: 1, role: 'ghost' }],
  ['a foreign collection', { collection: 'other', id: 1, role: 'admin' }],
  ['a missing id', { accountStatus: 'active', collection: 'users', role: 'admin' }],
] as const

describe('feedback collection', () => {
  test('is registered under a stable slug', () => {
    expect(Feedback.slug).toBe('feedback')
  })

  test('is not versioned, because a submission has no publication lifecycle', () => {
    expect(Feedback.versions).toBeUndefined()
  })

  test('shows the moderation queue at a glance', () => {
    expect(Feedback.admin?.useAsTitle).toBe('relatedSlug')
    expect(Feedback.admin?.group).toBe('Moderation')
    expect(Feedback.admin?.defaultColumns).toContain('status')
    expect(Feedback.admin?.defaultColumns).toContain('feedbackType')
  })
})

describe('feedback access', () => {
  test('anyone may submit, including anonymous visitors', async () => {
    expect(await Feedback.access?.create?.(createAccessArgs(null))).toBe(true)
    expect(
      await Feedback.access?.create?.(createAccessArgs(createUser('learner'))),
    ).toBe(true)
  })

  test.each([
    ['admin', true],
    ['editor', true],
  ] as const)('an active %s can read the queue', async (role, expected) => {
    expect(
      await Feedback.access?.read?.(createAccessArgs(createUser(role))),
    ).toBe(expected)
  })

  test.each([
    ['an anonymous visitor', null],
    ['a learner', createUser('learner')],
    ['a suspended admin', createUser('admin', 'suspended')],
    ['a suspended editor', createUser('editor', 'suspended')],
  ])('%s cannot read the queue', async (_label, user) => {
    expect(await Feedback.access?.read?.(createAccessArgs(user))).toBe(false)
  })

  test.each([
    ['admin', true],
    ['editor', true],
  ] as const)('an active %s can update a submission', async (role, expected) => {
    expect(
      await Feedback.access?.update?.(createAccessArgs(createUser(role))),
    ).toBe(expected)
  })

  test.each([
    ['an anonymous visitor', null],
    ['a learner', createUser('learner')],
  ])('%s cannot update a submission', async (_label, user) => {
    expect(await Feedback.access?.update?.(createAccessArgs(user))).toBe(false)
  })

  test('only an admin may delete a submission', async () => {
    expect(
      await Feedback.access?.delete?.(createAccessArgs(createUser('admin'))),
    ).toBe(true)
    expect(
      await Feedback.access?.delete?.(createAccessArgs(createUser('editor'))),
    ).toBe(false)
  })

  test('editorial users reach the admin panel; learners do not', async () => {
    expect(
      await Feedback.access?.admin?.({ req: { user: createUser('editor') } as PayloadRequest }),
    ).toBe(true)
    expect(
      await Feedback.access?.admin?.({ req: { user: createUser('learner') } as PayloadRequest }),
    ).toBe(false)
  })

  test.each(malformedIdentities)(
    'read and update fail closed for %s',
    async (_label, user) => {
      expect(await Feedback.access?.read?.(createAccessArgs(user))).toBe(false)
      expect(await Feedback.access?.update?.(createAccessArgs(user))).toBe(false)
      expect(await Feedback.access?.delete?.(createAccessArgs(user))).toBe(false)
    },
  )
})

describe('feedback field access', () => {
  test('the reply email is readable by admins only', async () => {
    const access = fieldAccess('email')

    expect(
      await (access?.read as (args: FieldAccessArgs) => unknown)?.(
        createFieldAccessArgs(createUser('admin')),
      ),
    ).toBe(true)
    expect(
      await (access?.read as (args: FieldAccessArgs) => unknown)?.(
        createFieldAccessArgs(createUser('editor')),
      ),
    ).toBe(false)
    expect(
      await (access?.read as (args: FieldAccessArgs) => unknown)?.(
        createFieldAccessArgs(null),
      ),
    ).toBe(false)
  })

  test.each(['status', 'adminNotes', 'handledBy', 'handledAt'])(
    'the moderation field %s cannot be set by a public submission',
    async (name) => {
      const access = fieldAccess(name)

      for (const operation of ['create', 'update'] as const) {
        const guard = access?.[operation] as
          | ((args: FieldAccessArgs) => unknown)
          | undefined

        expect(guard, `${name}.${operation} must be guarded`).toBeDefined()
        expect(await guard?.(createFieldAccessArgs(null))).toBe(false)
        expect(
          await guard?.(createFieldAccessArgs(createUser('learner'))),
        ).toBe(false)
        expect(await guard?.(createFieldAccessArgs(createUser('editor')))).toBe(
          true,
        )
        expect(await guard?.(createFieldAccessArgs(createUser('admin')))).toBe(
          true,
        )
      }
    },
  )

  test('moderation notes are hidden from the public too', async () => {
    const guard = fieldAccess('adminNotes')?.read as
      | ((args: FieldAccessArgs) => unknown)
      | undefined

    expect(await guard?.(createFieldAccessArgs(null))).toBe(false)
    expect(await guard?.(createFieldAccessArgs(createUser('editor')))).toBe(true)
  })

  test('the reporter-facing fields are not access-gated', () => {
    for (const name of ['contentType', 'feedbackType', 'message', 'relatedSlug']) {
      expect(fieldAccess(name)).toBeUndefined()
    }
  })
})

describe('feedback fields', () => {
  test('offers exactly the documented content types', () => {
    expect(optionValues('contentType')).toEqual([...feedbackContentTypes])
  })

  test('offers exactly the documented problem types', () => {
    expect(optionValues('feedbackType')).toEqual([...feedbackTypes])
  })

  test('offers exactly the documented statuses and defaults to new', () => {
    const status = namedField('status')

    expect(optionValues('status')).toEqual([...feedbackStatuses])
    expect((status as { defaultValue?: unknown }).defaultValue).toBe('new')
  })

  test('bounds the report length in the database as well as the schema', () => {
    const message = namedField('message')

    expect(message.type).toBe('textarea')
    expect((message as { maxLength?: number }).maxLength).toBe(MESSAGE_MAX_LENGTH)
    expect((message as { minLength?: number }).minLength).toBe(MESSAGE_MIN_LENGTH)
  })

  test('relates to each reportable collection without populating it', () => {
    const related = namedField('related')

    expect(related.type).toBe('relationship')
    expect((related as { relationTo?: unknown }).relationTo).toEqual([
      'words',
      'grammar-topics',
      'scenarios',
    ])
    expect((related as { maxDepth?: number }).maxDepth).toBe(0)
  })

  test.each(['contentType', 'related', 'relatedSlug', 'message', 'feedbackType'])(
    'requires %s',
    (name) => {
      expect((namedField(name) as { required?: boolean }).required).toBe(true)
    },
  )

  test('keeps the optional reply email optional', () => {
    const email = namedField('email')

    expect(email.type).toBe('email')
    expect((email as { required?: boolean }).required).toBeFalsy()
  })

  test.each(['contentType', 'feedbackType', 'relatedSlug', 'status'])(
    'indexes %s for the moderation queue',
    (name) => {
      expect((namedField(name) as { index?: boolean }).index).toBe(true)
    },
  )

  test('records which language the report was written in', () => {
    expect(optionValues('submitterLocale')).toEqual(['en', 'bn'])
  })

  test('marks the moderation trail read-only in the admin form', () => {
    for (const name of ['handledBy', 'handledAt']) {
      const field = namedField(name) as { admin?: { readOnly?: boolean } }
      expect(field.admin?.readOnly).toBe(true)
    }
  })
})

describe('feedback hooks are wired', () => {
  test('rate limiting runs before any field work', () => {
    expect(Feedback.hooks?.beforeOperation).toHaveLength(1)
  })

  test('validation runs before the forced status and the relationship check', () => {
    const names = (Feedback.hooks?.beforeValidate ?? []).map((hook) => hook.name)

    expect(names).toEqual([
      'enforceFeedbackSubmission',
      'forceNewFeedbackStatus',
      'assertRelatedMatchesType',
    ])
  })

  test('the moderation trail is stamped on change', () => {
    expect(Feedback.hooks?.beforeChange).toHaveLength(1)
  })
})
