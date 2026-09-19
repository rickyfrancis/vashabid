import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from 'payload'
import { APIError } from 'payload'

import { getActivePayloadUser } from '../../src/lib/payload/access/values'

/**
 * Forces a new profile to belong to whoever is making the request.
 *
 * `user` is the ownership key every access policy on this collection reads, so
 * letting a caller choose it would let one learner file a profile against
 * another account. Admins are exempt because they legitimately create profiles
 * on someone else's behalf from the admin panel.
 *
 * This is the `forceNewFeedbackStatus` pattern: field access has already run by
 * the time a collection `beforeValidate` fires, so the hook sets the trusted
 * value rather than racing an injected one.
 */
export const forceProfileOwner: CollectionBeforeValidateHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const user = getActivePayloadUser(req.user)

  if (!user) return data
  if (user.role === 'admin' && (data ?? {}).user) return data

  return {
    ...(data ?? {}),
    user: user.id,
  }
}

/**
 * Refuses a second profile for the same user.
 *
 * The `user` field is also `unique`, which is the real guarantee; this hook
 * exists so the failure arrives as a clear API error instead of a database
 * constraint violation, and so the rule is visible where the other create rules
 * live.
 */
export const preventDuplicateProfile: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const owner = (data ?? {}).user

  if (owner === undefined || owner === null) return data

  const { totalDocs } = await req.payload.count({
    collection: 'learner-profiles',
    overrideAccess: true,
    req,
    where: {
      user: {
        equals: owner,
      },
    },
  })

  if (totalDocs > 0) {
    throw new APIError(
      'This account already has a learner profile.',
      409,
      undefined,
      true,
    )
  }

  return data
}

/**
 * Stamps the moment onboarding was first completed.
 *
 * Written once and then left alone: the value marks when the learner finished
 * onboarding, not when they last edited a preference, so a later change to the
 * same profile must not move it.
 */
export const stampOnboardingCompletion: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  if (originalDoc?.onboardingCompletedAt) return data

  const candidate = (data ?? {}) as Record<string, unknown>
  const complete =
    Boolean(candidate.primarySupportLanguage) &&
    Boolean(candidate.germanLevel) &&
    Boolean(candidate.learningGoal) &&
    Boolean(candidate.practiceStyle) &&
    Boolean(candidate.dailyStudyTarget)

  if (!complete) return data

  return {
    ...candidate,
    onboardingCompletedAt: new Date().toISOString(),
  }
}
