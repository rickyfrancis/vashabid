import type {
  AccessArgs,
  FieldAccessArgs,
  PayloadRequest,
} from 'payload'
import { describe, expect, test } from 'vitest'

import {
  canAccessAdminPanel,
  canCreateUsers,
  canDeleteUsers,
  canManageUserSecurityFields,
  canReadUsers,
  canUnlockUsers,
  canUpdateOwnEmail,
  canUpdateUsers,
} from '.'
import type { AccountStatus, UserRole } from './values'

interface TestUser {
  id: number
  collection: 'users'
  role: UserRole
  accountStatus: AccountStatus
}

function createUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 7,
    collection: 'users',
    role: 'learner',
    accountStatus: 'active',
    ...overrides,
  }
}

function createRequest(user: unknown): PayloadRequest {
  return { user } as PayloadRequest
}

function createAccessArgs(
  user: unknown,
  data?: Record<string, unknown>,
): AccessArgs {
  return {
    data,
    req: createRequest(user),
  }
}

function createFieldAccessArgs(
  user: unknown,
  id?: number,
): FieldAccessArgs {
  return {
    id,
    req: createRequest(user),
  }
}

const selfScope = { id: { equals: 7 } }
const editorScope = {
  or: [selfScope, { role: { equals: 'learner' } }],
}

describe('users collection access', () => {
  test('gives active admins full user management', async () => {
    const admin = createUser({ role: 'admin' })
    const args = createAccessArgs(admin)

    expect(canAccessAdminPanel({ req: createRequest(admin) })).toBe(true)
    expect(await canCreateUsers(args)).toBe(true)
    expect(await canReadUsers(args)).toBe(true)
    expect(await canUpdateUsers(args)).toBe(true)
    expect(await canDeleteUsers(args)).toBe(true)
    expect(await canUnlockUsers(args)).toBe(true)
  })

  test('scopes editors to themselves and learner profiles', async () => {
    const editor = createUser({ role: 'editor' })
    const args = createAccessArgs(editor)

    expect(canAccessAdminPanel({ req: createRequest(editor) })).toBe(true)
    expect(await canCreateUsers(args)).toBe(false)
    expect(await canReadUsers(args)).toEqual(editorScope)
    expect(await canUpdateUsers(args)).toEqual(editorScope)
    expect(await canDeleteUsers(args)).toBe(false)
    expect(await canUnlockUsers(args)).toBe(false)
  })

  test('limits editor password updates to their own document', async () => {
    const editor = createUser({ role: 'editor' })

    expect(
      await canUpdateUsers(createAccessArgs(editor, { password: 'new-value' })),
    ).toEqual(selfScope)
  })

  test('scopes learners to their own document and keeps them out of admin', async () => {
    const learner = createUser()
    const args = createAccessArgs(learner)

    expect(canAccessAdminPanel({ req: createRequest(learner) })).toBe(false)
    expect(await canCreateUsers(args)).toBe(false)
    expect(await canReadUsers(args)).toEqual(selfScope)
    expect(await canUpdateUsers(args)).toEqual(selfScope)
    expect(await canDeleteUsers(args)).toBe(false)
    expect(await canUnlockUsers(args)).toBe(false)
  })

  test.each([
    null,
    createUser({ role: 'admin', accountStatus: 'suspended' }),
    { id: 7, collection: 'users', role: 'admin' },
  ])('denies anonymous, suspended, and malformed identities', async (user) => {
    const args = createAccessArgs(user)

    expect(canAccessAdminPanel({ req: createRequest(user) })).toBe(false)
    expect(await canCreateUsers(args)).toBe(false)
    expect(await canReadUsers(args)).toBe(false)
    expect(await canUpdateUsers(args)).toBe(false)
    expect(await canDeleteUsers(args)).toBe(false)
    expect(await canUnlockUsers(args)).toBe(false)
  })
})

describe('users field access', () => {
  test('reserves role and account status changes for admins', async () => {
    expect(
      await canManageUserSecurityFields(
        createFieldAccessArgs(createUser({ role: 'admin' })),
      ),
    ).toBe(true)
    expect(
      await canManageUserSecurityFields(
        createFieldAccessArgs(createUser({ role: 'editor' })),
      ),
    ).toBe(false)
    expect(
      await canManageUserSecurityFields(
        createFieldAccessArgs(createUser()),
      ),
    ).toBe(false)
  })

  test('allows admins and the account owner to change email', async () => {
    expect(
      await canUpdateOwnEmail(
        createFieldAccessArgs(createUser({ role: 'admin' }), 99),
      ),
    ).toBe(true)
    expect(
      await canUpdateOwnEmail(createFieldAccessArgs(createUser(), 7)),
    ).toBe(true)
  })

  test('prevents editors from changing learner email and suspended users from changing their own', async () => {
    expect(
      await canUpdateOwnEmail(
        createFieldAccessArgs(createUser({ role: 'editor' }), 99),
      ),
    ).toBe(false)
    expect(
      await canUpdateOwnEmail(
        createFieldAccessArgs(
          createUser({ accountStatus: 'suspended' }),
          7,
        ),
      ),
    ).toBe(false)
  })
})
