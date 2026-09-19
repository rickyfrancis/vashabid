import type { PayloadRequest } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import {
  forceProfileOwner,
  preventDuplicateProfile,
  stampOnboardingCompletion,
} from '../../../collections/hooks/learner-profiles'

function createRequest(
  user: unknown,
  count = vi.fn().mockResolvedValue({ totalDocs: 0 }),
): PayloadRequest {
  return { payload: { count }, user } as unknown as PayloadRequest
}

const learner = {
  accountStatus: 'active',
  collection: 'users',
  id: 7,
  role: 'learner',
}

const completeProfile = {
  dailyStudyTarget: '20',
  germanLevel: 'A2',
  learningGoal: 'travel',
  practiceStyle: 'mixed',
  primarySupportLanguage: 'en',
}

describe('forceProfileOwner', () => {
  test('stamps the authenticated learner onto a new profile', async () => {
    const data = await forceProfileOwner({
      data: { ...completeProfile },
      operation: 'create',
      req: createRequest(learner),
    } as never)

    expect((data as { user?: unknown }).user).toBe(7)
  })

  test('ignores an attacker-supplied owner', async () => {
    // The whole access model keys on `user`, so accepting this value would let
    // one learner file a profile against somebody else's account.
    const data = await forceProfileOwner({
      data: { ...completeProfile, user: 99 },
      operation: 'create',
      req: createRequest(learner),
    } as never)

    expect((data as { user?: unknown }).user).toBe(7)
  })

  test('lets an admin create a profile on behalf of another account', async () => {
    const data = await forceProfileOwner({
      data: { ...completeProfile, user: 99 },
      operation: 'create',
      req: createRequest({ ...learner, role: 'admin' }),
    } as never)

    expect((data as { user?: unknown }).user).toBe(99)
  })

  test('falls back to the admin themselves when no owner is named', async () => {
    const data = await forceProfileOwner({
      data: { ...completeProfile },
      operation: 'create',
      req: createRequest({ ...learner, id: 3, role: 'admin' }),
    } as never)

    expect((data as { user?: unknown }).user).toBe(3)
  })

  test('leaves updates alone so ownership cannot be silently rewritten', async () => {
    const data = await forceProfileOwner({
      data: { germanLevel: 'B1' },
      operation: 'update',
      req: createRequest(learner),
    } as never)

    expect((data as { user?: unknown }).user).toBeUndefined()
  })

  test.each([
    ['anonymous', null],
    ['suspended', { ...learner, accountStatus: 'suspended' }],
    ['malformed', { id: 7, collection: 'users' }],
  ])('does not invent an owner for a %s request', async (_label, user) => {
    const data = await forceProfileOwner({
      data: { ...completeProfile },
      operation: 'create',
      req: createRequest(user),
    } as never)

    // No owner is added, so the required-field check refuses the write rather
    // than the hook quietly attaching it to somebody.
    expect((data as { user?: unknown }).user).toBeUndefined()
  })
})

describe('preventDuplicateProfile', () => {
  test('allows the first profile for an account', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 })

    await expect(
      preventDuplicateProfile({
        data: { ...completeProfile, user: 7 },
        operation: 'create',
        req: createRequest(learner, count),
      } as never),
    ).resolves.toBeDefined()

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'learner-profiles',
        where: { user: { equals: 7 } },
      }),
    )
  })

  test('refuses a second profile with a 409 rather than a constraint error', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 1 })

    await expect(
      preventDuplicateProfile({
        data: { ...completeProfile, user: 7 },
        operation: 'create',
        req: createRequest(learner, count),
      } as never),
    ).rejects.toMatchObject({ status: 409 })
  })

  test('counts past access control so an existing profile is never invisible', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 })

    await preventDuplicateProfile({
      data: { ...completeProfile, user: 7 },
      operation: 'create',
      req: createRequest(learner, count),
    } as never)

    // Without `overrideAccess`, a learner's own scope would hide somebody
    // else's row and the duplicate check would pass when it should not.
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: true }),
    )
  })

  test('does not query when there is no owner to check', async () => {
    const count = vi.fn()

    await preventDuplicateProfile({
      data: { ...completeProfile },
      operation: 'create',
      req: createRequest(null, count),
    } as never)

    expect(count).not.toHaveBeenCalled()
  })
})

describe('stampOnboardingCompletion', () => {
  test('stamps once every answer is present', () => {
    const data = stampOnboardingCompletion({
      data: { ...completeProfile, user: 7 },
    } as never) as { onboardingCompletedAt?: string }

    expect(data.onboardingCompletedAt).toEqual(expect.any(String))
  })

  test('does not stamp a half-finished profile', () => {
    const data = stampOnboardingCompletion({
      data: { primarySupportLanguage: 'en', user: 7 },
    } as never) as { onboardingCompletedAt?: string }

    expect(data.onboardingCompletedAt).toBeUndefined()
  })

  test('leaves an existing stamp where it was', () => {
    // The value marks when onboarding finished, not when a preference was last
    // edited, so a later change must not move it.
    const data = stampOnboardingCompletion({
      data: { ...completeProfile, germanLevel: 'C1' },
      originalDoc: { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' },
    } as never) as { onboardingCompletedAt?: string }

    expect(data.onboardingCompletedAt).toBeUndefined()
  })
})
