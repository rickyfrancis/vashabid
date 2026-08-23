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

export function resolveSupportMode(
  cookieValue: string | null | undefined,
  locale: Locale,
): SupportMode {
  return parseSupportMode(cookieValue) ?? locale
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
