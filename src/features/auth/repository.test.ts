import { describe, expect, test, vi } from 'vitest'

import {
  LearnerProfileRepository,
  UserRepository,
} from './repository'

const signup = {
  displayName: 'Rifat',
  email: 'rifat@example.com',
  password: 'a-long-enough-password',
  supportMode: 'en' as const,
  uiLocale: 'en' as const,
}

const profile = {
  dailyStudyTarget: '20' as const,
  germanLevel: 'A2' as const,
  learningGoal: 'travel' as const,
  practiceStyle: 'mixed' as const,
  primarySupportLanguage: 'bn' as const,
}

const actor = { collection: 'users', id: 7 }

describe('UserRepository', () => {
  test('creates a learner through the access-controlled write path', async () => {
    const create = vi.fn().mockResolvedValue({})
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.4' })

    await new UserRepository(create).createLearner(signup, headers)

    expect(create).toHaveBeenCalledWith('users', signup, { headers })
  })

  test('forwards headers so the rate-limit hook sees the real client', async () => {
    const create = vi.fn().mockResolvedValue({})

    await new UserRepository(create).createLearner(signup)

    // Payload substitutes an empty `Headers` only when none was supplied, so an
    // absent value here must stay absent rather than becoming an empty object.
    expect(create).toHaveBeenCalledWith('users', signup, { headers: undefined })
  })

  test('never sends role or account status', async () => {
    const create = vi.fn().mockResolvedValue({})

    await new UserRepository(create).createLearner(signup)

    const [, data] = create.mock.calls[0]
    expect(data).not.toHaveProperty('role')
    expect(data).not.toHaveProperty('accountStatus')
  })

  test('updates preferences as the user, under their own permissions', async () => {
    const updateAs = vi.fn().mockResolvedValue({})

    await new UserRepository(vi.fn(), updateAs).updatePreferences(
      7,
      { supportMode: 'both' },
      { user: actor },
    )

    expect(updateAs).toHaveBeenCalledWith(
      'users',
      7,
      { supportMode: 'both' },
      expect.objectContaining({ user: actor }),
    )
  })
})

describe('LearnerProfileRepository', () => {
  test('creates a profile without naming its owner', async () => {
    const createAs = vi.fn().mockResolvedValue({})

    await new LearnerProfileRepository(createAs).createForUser(profile, {
      user: actor,
    })

    const [collection, data] = createAs.mock.calls[0]
    expect(collection).toBe('learner-profiles')
    // Ownership is stamped by `forceProfileOwner` from the authenticated
    // request; sending it would be offering the caller a say in it.
    expect(data).not.toHaveProperty('user')
  })

  test('scopes the lookup to the owner', async () => {
    const findAs = vi.fn().mockResolvedValue({ id: 3 })

    const found = await new LearnerProfileRepository(
      vi.fn(),
      vi.fn(),
      findAs,
    ).findByUser(7, { user: actor })

    expect(findAs).toHaveBeenCalledWith(
      'learner-profiles',
      { user: { equals: 7 } },
      expect.objectContaining({ user: actor }),
    )
    expect(found).toEqual({ id: 3 })
  })

  test('reports no profile rather than throwing when none exists', async () => {
    const findAs = vi.fn().mockResolvedValue(null)

    await expect(
      new LearnerProfileRepository(vi.fn(), vi.fn(), findAs).findByUser(7, {
        user: actor,
      }),
    ).resolves.toBeNull()
  })

  test('updates an existing profile by id as the owner', async () => {
    const updateAs = vi.fn().mockResolvedValue({})

    await new LearnerProfileRepository(vi.fn(), updateAs).updateForUser(
      3,
      profile,
      { user: actor },
    )

    expect(updateAs).toHaveBeenCalledWith(
      'learner-profiles',
      3,
      profile,
      expect.objectContaining({ user: actor }),
    )
  })
})
