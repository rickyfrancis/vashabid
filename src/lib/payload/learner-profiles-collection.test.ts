import type { AccessArgs, Field, FieldAccessArgs, PayloadRequest } from 'payload'
import { describe, expect, test } from 'vitest'

import { LearnerProfiles } from '../../../collections/LearnerProfiles'
import {
  dailyStudyTargets,
  learningGoals,
  practiceStyles,
  supportLanguages,
} from '../../features/auth/constants'
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

  const field = find(LearnerProfiles.fields)

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

describe('learner profiles collection', () => {
  test('is registered under a stable slug with no draft lifecycle', () => {
    expect(LearnerProfiles.slug).toBe('learner-profiles')
    // Current state, not editorial content: no `_status`, so none of the
    // publish-gated read policies apply to it.
    expect(LearnerProfiles.versions).toBeUndefined()
  })

  test('owns its data through a unique, indexed user relationship', () => {
    const user = namedField('user')

    if (user.type !== 'relationship') throw new Error('user must relate')
    expect(user.relationTo).toBe('users')
    expect(user.hasMany).toBe(false)
    expect(user.required).toBe(true)
    // The unique constraint is the real guarantee behind one-profile-per-user;
    // the duplicate hook only turns the failure into a readable error.
    expect(user.unique).toBe(true)
    expect(user.index).toBe(true)
  })

  test('lets only an admin repoint an existing profile at another account', async () => {
    const access = (namedField('user') as { access?: Record<string, unknown> })
      .access
    const update = access?.update as (args: FieldAccessArgs) => boolean

    expect(update(createFieldAccessArgs(createUser('admin')))).toBe(true)
    expect(update(createFieldAccessArgs(createUser('editor')))).toBe(false)
    expect(update(createFieldAccessArgs(createUser('learner')))).toBe(false)
    expect(update(createFieldAccessArgs(null))).toBe(false)
  })

  test('stores every onboarding answer the plan calls for', () => {
    expect(optionValues('primarySupportLanguage')).toEqual([
      ...supportLanguages,
    ])
    expect(optionValues('secondarySupportLanguage')).toEqual([
      ...supportLanguages,
    ])
    expect(optionValues('learningGoal')).toEqual([...learningGoals])
    expect(optionValues('practiceStyle')).toEqual([...practiceStyles])
    expect(optionValues('dailyStudyTarget')).toEqual([...dailyStudyTargets])
    expect(optionValues('germanLevel')).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2',
    ])
  })

  test('requires everything except the optional second language', () => {
    const required = (name: string) =>
      (namedField(name) as { required?: boolean }).required

    expect(required('primarySupportLanguage')).toBe(true)
    expect(required('learningGoal')).toBe(true)
    expect(required('practiceStyle')).toBe(true)
    expect(required('dailyStudyTarget')).toBe(true)
    expect(required('germanLevel')).toBe(true)
    // Optional by design: a learner who wants one language should not be forced
    // into `both`.
    expect(required('secondarySupportLanguage')).toBeUndefined()
  })

  test('keeps the completion stamp out of editorial hands', () => {
    const stamp = namedField('onboardingCompletedAt')

    expect(stamp.type).toBe('date')
    expect(stamp.admin?.readOnly).toBe(true)
  })

  test('wires the ownership and completion hooks in a deliberate order', () => {
    const names = (LearnerProfiles.hooks?.beforeValidate ?? []).map(
      (hook) => hook.name,
    )

    // Ownership must settle before the duplicate check, or the check would run
    // against a caller-supplied user.
    expect(names).toEqual(['forceProfileOwner', 'preventDuplicateProfile'])
    expect(
      (LearnerProfiles.hooks?.beforeChange ?? []).map((hook) => hook.name),
    ).toEqual(['stampOnboardingCompletion'])
  })

  test('keeps the collection out of anonymous reach entirely', async () => {
    const access = LearnerProfiles.access ?? {}
    const anonymous = createAccessArgs(null)

    expect(await access.read?.(anonymous)).toBe(false)
    expect(await access.create?.(anonymous)).toBe(false)
    expect(await access.update?.(anonymous)).toBe(false)
    expect(await access.delete?.(anonymous)).toBe(false)
  })

  test('keeps learners out of the admin panel', () => {
    const admin = LearnerProfiles.access?.admin

    expect(admin?.({ req: { user: createUser('learner') } as PayloadRequest }))
      .toBe(false)
    expect(admin?.({ req: { user: createUser('editor') } as PayloadRequest }))
      .toBe(true)
  })
})
