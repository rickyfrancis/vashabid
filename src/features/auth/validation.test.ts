import { describe, expect, test } from 'vitest'

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from './constants'
import { parseLogin, parseOnboarding, parseSignup } from './validation'

const signup = {
  displayName: 'Rifat',
  email: 'rifat@example.com',
  password: 'a-long-enough-password',
  uiLocale: 'en',
}

const onboarding = {
  dailyStudyTarget: '20',
  germanLevel: 'A2',
  learningGoal: 'travel',
  practiceStyle: 'mixed',
  primarySupportLanguage: 'bn',
  uiLocale: 'bn',
}

describe('parseSignup', () => {
  test('accepts a well-formed submission', () => {
    const result = parseSignup(signup)

    expect(result.success).toBe(true)
  })

  test('lowercases and trims the email so accounts cannot be duplicated by case', () => {
    const result = parseSignup({ ...signup, email: '  Rifat@Example.COM ' })

    if (!result.success) throw new Error('expected success')
    expect(result.data.email).toBe('rifat@example.com')
  })

  test('trims the display name before measuring it', () => {
    const result = parseSignup({ ...signup, displayName: '  Rifat  ' })

    if (!result.success) throw new Error('expected success')
    expect(result.data.displayName).toBe('Rifat')
  })

  test('accepts a password of exactly the minimum length', () => {
    const result = parseSignup({
      ...signup,
      password: 'x'.repeat(PASSWORD_MIN_LENGTH),
    })

    expect(result.success).toBe(true)
  })

  test.each([
    ['one character below the minimum', 'x'.repeat(PASSWORD_MIN_LENGTH - 1), 'errorPasswordTooShort'],
    ['one character above the maximum', 'x'.repeat(PASSWORD_MAX_LENGTH + 1), 'errorPasswordTooLong'],
  ])('refuses a password %s with a distinct key', (_label, password, key) => {
    const result = parseSignup({ ...signup, password })

    if (result.success) throw new Error('expected failure')
    expect(result.fieldErrors.password).toBe(key)
  })

  test('distinguishes a too-short from a too-long display name', () => {
    const short = parseSignup({ ...signup, displayName: 'a' })
    const long = parseSignup({
      ...signup,
      displayName: 'a'.repeat(DISPLAY_NAME_MAX_LENGTH + 1),
    })

    if (short.success || long.success) throw new Error('expected failure')
    expect(short.fieldErrors.displayName).toBe('errorDisplayNameTooShort')
    expect(long.fieldErrors.displayName).toBe('errorDisplayNameTooLong')
  })

  test('treats a whitespace-only display name as blank', () => {
    const result = parseSignup({ ...signup, displayName: '   ' })

    if (result.success) throw new Error('expected failure')
    expect(result.fieldErrors.displayName).toBe('errorDisplayNameTooShort')
  })

  test('refuses an address the browser would accept but we should not', () => {
    // `learner@localhost` passes Chrome's own check, which is why the server
    // has to be the authority rather than the input type.
    const result = parseSignup({ ...signup, email: 'learner@localhost' })

    if (result.success) throw new Error('expected failure')
    expect(result.fieldErrors.email).toBe('errorEmailInvalid')
  })

  test('drops an injected role instead of storing it', () => {
    const result = parseSignup({
      ...signup,
      accountStatus: 'active',
      role: 'admin',
    })

    if (!result.success) throw new Error('expected success')
    expect(result.data).not.toHaveProperty('role')
    expect(result.data).not.toHaveProperty('accountStatus')
  })

  test('rejects an unknown ui locale as a tampered payload', () => {
    const result = parseSignup({ ...signup, uiLocale: 'de' })

    if (result.success) throw new Error('expected failure')
    expect(result.fieldErrors.uiLocale).toBe('errorSubmissionInvalid')
  })
})

describe('parseLogin', () => {
  test('accepts any present password so old accounts can still sign in', () => {
    // Raising the signup minimum must not lock out somebody who registered
    // under the old rule.
    const result = parseLogin({ email: 'rifat@example.com', password: 'x' })

    expect(result.success).toBe(true)
  })

  test('normalises the email the same way signup does', () => {
    const result = parseLogin({
      email: ' Rifat@Example.com ',
      password: 'secret',
    })

    if (!result.success) throw new Error('expected success')
    expect(result.data.email).toBe('rifat@example.com')
  })

  test('refuses an empty password', () => {
    const result = parseLogin({ email: 'rifat@example.com', password: '' })

    expect(result.success).toBe(false)
  })
})

describe('parseOnboarding', () => {
  test('accepts answers without a second language', () => {
    const result = parseOnboarding(onboarding)

    if (!result.success) throw new Error('expected success')
    expect(result.data.secondarySupportLanguage).toBeUndefined()
  })

  test('treats an unselected radio group as absent, not invalid', () => {
    const result = parseOnboarding({
      ...onboarding,
      secondarySupportLanguage: '',
    })

    if (!result.success) throw new Error('expected success')
    expect(result.data.secondarySupportLanguage).toBeUndefined()
  })

  test('accepts a genuinely different second language', () => {
    const result = parseOnboarding({
      ...onboarding,
      secondarySupportLanguage: 'en',
    })

    if (!result.success) throw new Error('expected success')
    expect(result.data.secondarySupportLanguage).toBe('en')
  })

  test('refuses the same language twice', () => {
    const result = parseOnboarding({
      ...onboarding,
      secondarySupportLanguage: 'bn',
    })

    if (result.success) throw new Error('expected failure')
    expect(result.fieldErrors.secondarySupportLanguage).toBe(
      'errorSecondaryLanguageDuplicate',
    )
  })

  test.each([
    'dailyStudyTarget',
    'germanLevel',
    'learningGoal',
    'practiceStyle',
    'primarySupportLanguage',
  ])('requires %s', (field) => {
    const rest = { ...(onboarding as Record<string, unknown>) }
    delete rest[field]

    expect(parseOnboarding(rest).success).toBe(false)
  })

  test.each([
    ['dailyStudyTarget', '7'],
    ['germanLevel', 'D1'],
    ['learningGoal', 'gaming'],
    ['practiceStyle', 'osmosis'],
  ])('refuses an off-list %s', (field, value) => {
    const result = parseOnboarding({ ...onboarding, [field]: value })

    expect(result.success).toBe(false)
  })

  test('drops unknown keys so onboarding cannot write elsewhere', () => {
    const result = parseOnboarding({
      ...onboarding,
      onboardingCompletedAt: '1999-01-01',
      user: 99,
    })

    if (!result.success) throw new Error('expected success')
    expect(result.data).not.toHaveProperty('user')
    expect(result.data).not.toHaveProperty('onboardingCompletedAt')
  })
})
