import type { Locale } from './types'

export const supportModes = ['en', 'bn', 'both'] as const
export type SupportMode = (typeof supportModes)[number]

export const SUPPORT_MODE_COOKIE = 'vashabid_support_mode'
export const SUPPORT_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isSupportMode(
  value: string | null | undefined,
): value is SupportMode {
  return supportModes.some((mode) => mode === value)
}

export function parseSupportMode(
  value: string | null | undefined,
): SupportMode | undefined {
  return isSupportMode(value) ? value : undefined
}

/**
 * Decides which support mode a request should render with.
 *
 * Precedence is account, then cookie, then the current UI locale. A signed-in
 * learner's stored preference wins because it follows them between devices,
 * where the cookie only describes this browser; an anonymous visitor is
 * unaffected, since they have no stored preference to consult.
 */
export function resolveSupportMode(
  cookieValue: string | null | undefined,
  locale: Locale,
  accountValue?: string | null,
): SupportMode {
  return (
    parseSupportMode(accountValue) ?? parseSupportMode(cookieValue) ?? locale
  )
}

export function serializeSupportModeCookie(
  mode: SupportMode,
  secure = false,
): string {
  const attributes = [
    `${SUPPORT_MODE_COOKIE}=${mode}`,
    `Max-Age=${SUPPORT_MODE_COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
  ]

  if (secure) attributes.push('Secure')

  return attributes.join('; ')
}
