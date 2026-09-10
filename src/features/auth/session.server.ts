import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import type { LearnerProfile } from '@payload-types'
import { isLocale } from '@/features/i18n/types'
import { isSupportMode } from '@/features/i18n/support-mode'
import { findOneAs, getPayloadClient } from '@/lib/payload'
import { getActivePayloadUser } from '@/lib/payload/access/values'
import type { Session, SessionProfile, SessionUser } from './types'

function toSessionUser(user: Record<string, unknown>): SessionUser | null {
  const active = getActivePayloadUser(user)

  // Everything downstream treats a session as proof of an active account, so a
  // suspended or malformed identity resolves to no session at all rather than
  // to a user the access policies would then refuse.
  if (!active) return null

  const uiLocale = typeof user.uiLocale === 'string' ? user.uiLocale : undefined
  const supportMode =
    typeof user.supportMode === 'string' ? user.supportMode : undefined

  return {
    displayName:
      typeof user.displayName === 'string' && user.displayName.trim() !== ''
        ? user.displayName
        : String(user.email ?? ''),
    email: String(user.email ?? ''),
    id: active.id,
    role: active.role,
    supportMode: isSupportMode(supportMode) ? supportMode : 'en',
    uiLocale: isLocale(uiLocale) ? uiLocale : 'en',
  }
}

function toSessionProfile(
  document: LearnerProfile | null,
): SessionProfile | null {
  if (!document) return null

  return {
    dailyStudyTarget: document.dailyStudyTarget,
    germanLevel: document.germanLevel,
    learningGoal: document.learningGoal,
    onboardingCompletedAt: document.onboardingCompletedAt ?? null,
    practiceStyle: document.practiceStyle,
    primarySupportLanguage: document.primarySupportLanguage,
    secondarySupportLanguage: document.secondarySupportLanguage ?? null,
  }
}

/**
 * Resolves the current session once per request.
 *
 * Wrapped in React `cache()` for the same reason `getWordDetail` is: the layout,
 * the header, and a page all want the signed-in user, and without it each would
 * verify the token and re-read the profile separately.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) return null

  const sessionUser = toSessionUser(user as unknown as Record<string, unknown>)

  if (!sessionUser) return null

  const profile = (await findOneAs(
    'learner-profiles',
    { user: { equals: sessionUser.id } },
    { user: user as never },
  )) as LearnerProfile | null

  return { profile: toSessionProfile(profile), user: sessionUser }
})
