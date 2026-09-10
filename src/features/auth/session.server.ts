import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { locales, type Locale } from '@/features/i18n/types'
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

  const uiLocale = user.uiLocale
  const supportMode = user.supportMode

  return {
    displayName:
      typeof user.displayName === 'string' && user.displayName.trim() !== ''
        ? user.displayName
        : String(user.email ?? ''),
    email: String(user.email ?? ''),
    id: active.id,
    role: active.role,
    supportMode: isSupportMode(
      typeof supportMode === 'string' ? supportMode : undefined,
    )
      ? supportMode
      : 'en',
    uiLocale: locales.includes(uiLocale as Locale)
      ? (uiLocale as Locale)
      : 'en',
  }
}

function toSessionProfile(
  document: Record<string, unknown> | null,
): SessionProfile | null {
  if (!document) return null

  return {
    dailyStudyTarget: document.dailyStudyTarget as SessionProfile['dailyStudyTarget'],
    germanLevel: String(document.germanLevel ?? ''),
    learningGoal: document.learningGoal as SessionProfile['learningGoal'],
    onboardingCompletedAt:
      typeof document.onboardingCompletedAt === 'string'
        ? document.onboardingCompletedAt
        : null,
    practiceStyle: document.practiceStyle as SessionProfile['practiceStyle'],
    primarySupportLanguage:
      document.primarySupportLanguage as SessionProfile['primarySupportLanguage'],
    secondarySupportLanguage:
      (document.secondarySupportLanguage as SessionProfile['secondarySupportLanguage']) ??
      null,
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
  )) as Record<string, unknown> | null

  return { profile: toSessionProfile(profile), user: sessionUser }
})
