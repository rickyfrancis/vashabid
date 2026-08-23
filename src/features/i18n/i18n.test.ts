import { describe, expect, test } from 'vitest'
import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import {
  isSupportMode,
  parseSupportMode,
  resolveSupportMode,
  serializeSupportModeCookie,
  SUPPORT_MODE_COOKIE,
  SUPPORT_MODE_COOKIE_MAX_AGE,
} from './support-mode'
import { isLocale } from './types'

function messageKeys(
  value: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const path = prefix ? `${prefix}.${key}` : key

    if (typeof nestedValue === 'object' && nestedValue !== null) {
      return messageKeys(nestedValue as Record<string, unknown>, path)
    }

    return path
  })
}

describe('locale configuration', () => {
  test('accepts only public UI locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('bn')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  test('keeps English and Bangla message catalogs structurally identical', () => {
    expect(messageKeys(bnMessages).sort()).toEqual(messageKeys(enMessages).sort())
  })
})

describe('support mode', () => {
  test('validates and parses the three supported values', () => {
    expect(isSupportMode('en')).toBe(true)
    expect(isSupportMode('bn')).toBe(true)
    expect(isSupportMode('both')).toBe(true)
    expect(isSupportMode('de')).toBe(false)
    expect(parseSupportMode('both')).toBe('both')
    expect(parseSupportMode('invalid')).toBeUndefined()
  })

  test('falls back to the current UI locale for missing or invalid cookies', () => {
    expect(resolveSupportMode(undefined, 'en')).toBe('en')
    expect(resolveSupportMode(null, 'bn')).toBe('bn')
    expect(resolveSupportMode('invalid', 'bn')).toBe('bn')
    expect(resolveSupportMode('both', 'bn')).toBe('both')
  })

  test('serializes a one-year, site-wide SameSite cookie', () => {
    expect(serializeSupportModeCookie('bn')).toBe(
      `${SUPPORT_MODE_COOKIE}=bn; Max-Age=${SUPPORT_MODE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`,
    )
    expect(serializeSupportModeCookie('both', true)).toContain('; Secure')
  })
})
