import type { AccessArgs, PayloadRequest } from 'payload'
import { describe, expect, test } from 'vitest'

import {
  isAdmin,
  isAdminOrEditor,
  isEditor,
  isLearner,
  isSelf,
  publishedOrAuthenticated,
  publishedOrEditorial,
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

function createAccessArgs(user: unknown): AccessArgs {
  return {
    req: {
      user,
    } as PayloadRequest,
  }
}

describe('role access policies', () => {
  test.each([
    ['admin', isAdmin],
    ['editor', isEditor],
    ['learner', isLearner],
  ] as const)('matches only an active %s', async (role, policy) => {
    expect(await policy(createAccessArgs(createUser({ role })))).toBe(true)
    expect(
      await policy(
        createAccessArgs(createUser({ role, accountStatus: 'suspended' })),
      ),
    ).toBe(false)
  })

  test('matches active admins and editors', async () => {
    expect(
      await isAdminOrEditor(
        createAccessArgs(createUser({ role: 'admin' })),
      ),
    ).toBe(true)
    expect(
      await isAdminOrEditor(
        createAccessArgs(createUser({ role: 'editor' })),
      ),
    ).toBe(true)
    expect(
      await isAdminOrEditor(
        createAccessArgs(createUser({ role: 'learner' })),
      ),
    ).toBe(false)
  })

  test.each([
    null,
    undefined,
    {},
    { id: 7, collection: 'users', role: 'unknown', accountStatus: 'active' },
    { id: 7, collection: 'other', role: 'admin', accountStatus: 'active' },
    { collection: 'users', role: 'admin', accountStatus: 'active' },
  ])('fails closed for anonymous or malformed users', async (user) => {
    expect(await isAdmin(createAccessArgs(user))).toBe(false)
    expect(await isEditor(createAccessArgs(user))).toBe(false)
    expect(await isLearner(createAccessArgs(user))).toBe(false)
  })
})

describe('row-level access policies', () => {
  test('scopes an active user to their own document', async () => {
    expect(await isSelf(createAccessArgs(createUser({ id: 42 })))).toEqual({
      id: { equals: 42 },
    })
  })

  test('denies self access to suspended and anonymous users', async () => {
    expect(
      await isSelf(
        createAccessArgs(createUser({ accountStatus: 'suspended' })),
      ),
    ).toBe(false)
    expect(await isSelf(createAccessArgs(null))).toBe(false)
  })

  test('allows active authenticated users to read all content', async () => {
    expect(
      await publishedOrAuthenticated(createAccessArgs(createUser())),
    ).toBe(true)
  })

  test('limits anonymous, malformed, and suspended users to published content', async () => {
    const publishedConstraint = {
      _status: { equals: 'published' },
    }

    expect(await publishedOrAuthenticated(createAccessArgs(null))).toEqual(
      publishedConstraint,
    )
    expect(
      await publishedOrAuthenticated(
        createAccessArgs(createUser({ accountStatus: 'suspended' })),
      ),
    ).toEqual(publishedConstraint)
    expect(
      await publishedOrAuthenticated(
        createAccessArgs({ id: 1, role: 'admin' }),
      ),
    ).toEqual(publishedConstraint)
  })

  test('limits learners and anonymous users to published editorial content', async () => {
    const publishedConstraint = {
      _status: { equals: 'published' },
    }

    expect(
      await publishedOrEditorial(
        createAccessArgs(createUser({ role: 'admin' })),
      ),
    ).toBe(true)
    expect(
      await publishedOrEditorial(
        createAccessArgs(createUser({ role: 'editor' })),
      ),
    ).toBe(true)
    expect(
      await publishedOrEditorial(
        createAccessArgs(createUser({ role: 'learner' })),
      ),
    ).toEqual(publishedConstraint)
    expect(await publishedOrEditorial(createAccessArgs(null))).toEqual(
      publishedConstraint,
    )
  })
})
