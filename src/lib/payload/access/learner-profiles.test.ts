import type { AccessArgs, PayloadRequest } from 'payload'
import { describe, expect, test } from 'vitest'

import {
  canCreateLearnerProfiles,
  canDeleteLearnerProfiles,
  canReadLearnerProfiles,
  canUpdateLearnerProfiles,
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

function createAccessArgs(user: unknown): AccessArgs {
  return { req: createRequest(user) }
}

const ownerScope = { user: { equals: 7 } }
const learnerOwnedScope = { 'user.role': { equals: 'learner' } }

describe('learner profile access', () => {
  test('gives active admins unrestricted reach', async () => {
    const args = createAccessArgs(createUser({ role: 'admin' }))

    expect(await canReadLearnerProfiles(args)).toBe(true)
    expect(await canCreateLearnerProfiles(args)).toBe(true)
    expect(await canUpdateLearnerProfiles(args)).toBe(true)
    expect(await canDeleteLearnerProfiles(args)).toBe(true)
  })

  test('scopes a learner to the profile they own', async () => {
    const args = createAccessArgs(createUser())

    // A query, not `true`: Payload filters the row set rather than handing the
    // learner every profile.
    expect(await canReadLearnerProfiles(args)).toEqual(ownerScope)
    expect(await canUpdateLearnerProfiles(args)).toEqual(ownerScope)
  })

  test('never lets one learner reach another learner by id', async () => {
    const other = createAccessArgs(createUser({ id: 99 }))

    expect(await canReadLearnerProfiles(other)).toEqual({
      user: { equals: 99 },
    })
    expect(await canReadLearnerProfiles(other)).not.toEqual(ownerScope)
  })

  test('lets editors reach learner profiles but not editorial ones', async () => {
    const args = createAccessArgs(createUser({ role: 'editor' }))

    expect(await canReadLearnerProfiles(args)).toEqual(learnerOwnedScope)
    expect(await canUpdateLearnerProfiles(args)).toEqual(learnerOwnedScope)
  })

  test('reserves deletion for admins', async () => {
    expect(
      await canDeleteLearnerProfiles(createAccessArgs(createUser())),
    ).toBe(false)
    expect(
      await canDeleteLearnerProfiles(
        createAccessArgs(createUser({ role: 'editor' })),
      ),
    ).toBe(false)
  })

  test('lets any active signed-in account create a profile, ownership forced later', async () => {
    expect(
      await canCreateLearnerProfiles(createAccessArgs(createUser())),
    ).toBe(true)
    expect(
      await canCreateLearnerProfiles(
        createAccessArgs(createUser({ role: 'editor' })),
      ),
    ).toBe(true)
  })

  test.each([
    null,
    createUser({ accountStatus: 'suspended' }),
    createUser({ role: 'admin', accountStatus: 'suspended' }),
    { id: 7, collection: 'users', role: 'learner' },
    { id: 7, collection: 'other', role: 'learner', accountStatus: 'active' },
  ])('denies anonymous, suspended, and malformed identities', async (user) => {
    const args = createAccessArgs(user)

    expect(await canReadLearnerProfiles(args)).toBe(false)
    expect(await canCreateLearnerProfiles(args)).toBe(false)
    expect(await canUpdateLearnerProfiles(args)).toBe(false)
    expect(await canDeleteLearnerProfiles(args)).toBe(false)
  })
})
