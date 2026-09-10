import { describe, expect, test } from 'vitest'

import {
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  SLUG_MAX_LENGTH,
} from './constants'
import {
  feedbackSubmissionSchema,
  parseFeedbackSubmission,
  toFieldErrors,
} from './validation'

function submission(overrides: Record<string, unknown> = {}) {
  return {
    contentType: 'word',
    feedbackType: 'wrong-cefr',
    locale: 'en',
    message: 'This word is listed as A1 but feels more like B1.',
    slug: 'das-brot',
    ...overrides,
  }
}

function fieldErrors(input: unknown) {
  const result = parseFeedbackSubmission(input)
  if (result.success) throw new Error('expected the submission to be rejected')
  return result.fieldErrors
}

describe('feedbackSubmissionSchema', () => {
  test('accepts a minimal valid submission', () => {
    const result = parseFeedbackSubmission(submission())

    expect(result).toEqual({ data: submission(), success: true })
  })

  test('treats a missing and an empty email as equivalent', () => {
    expect(parseFeedbackSubmission(submission({ email: '' })).success).toBe(true)
    expect(parseFeedbackSubmission(submission()).success).toBe(true)
  })

  test.each(['', '   ', '\t'])(
    'treats the whitespace-only email %j as left blank',
    (email) => {
      const result = parseFeedbackSubmission(submission({ email }))

      expect(result.success && result.data.email).toBe('')
    },
  )

  test('trims a padded email before storing it', () => {
    const result = parseFeedbackSubmission(
      submission({ email: '  learner@example.com  ' }),
    )

    expect(result.success && result.data.email).toBe('learner@example.com')
  })

  test('accepts a well-formed email', () => {
    const result = parseFeedbackSubmission(
      submission({ email: 'learner@example.com' }),
    )

    expect(result.success && result.data.email).toBe('learner@example.com')
  })

  test('trims the message before measuring it', () => {
    const result = parseFeedbackSubmission(
      submission({ message: `   ${'a'.repeat(MESSAGE_MIN_LENGTH)}   ` }),
    )

    expect(result.success && result.data.message).toBe(
      'a'.repeat(MESSAGE_MIN_LENGTH),
    )
  })

  test('rejects a message that is only whitespace padding', () => {
    expect(
      fieldErrors(submission({ message: `  ${'a'.repeat(MESSAGE_MIN_LENGTH - 1)}  ` })),
    ).toEqual({ message: 'errorMessageTooShort' })
  })

  test.each([
    ['exactly at the minimum', 'a'.repeat(MESSAGE_MIN_LENGTH), true],
    ['one below the minimum', 'a'.repeat(MESSAGE_MIN_LENGTH - 1), false],
    ['exactly at the maximum', 'a'.repeat(MESSAGE_MAX_LENGTH), true],
    ['one above the maximum', 'a'.repeat(MESSAGE_MAX_LENGTH + 1), false],
  ])('message %s', (_label, message, expected) => {
    expect(parseFeedbackSubmission(submission({ message })).success).toBe(expected)
  })

  test('reports distinct keys for a short and a long message', () => {
    expect(fieldErrors(submission({ message: 'too short' }))).toEqual({
      message: 'errorMessageTooShort',
    })
    expect(
      fieldErrors(submission({ message: 'a'.repeat(MESSAGE_MAX_LENGTH + 1) })),
    ).toEqual({ message: 'errorMessageTooLong' })
  })

  test('rejects an email over the length cap', () => {
    const local = 'a'.repeat(EMAIL_MAX_LENGTH)

    expect(fieldErrors(submission({ email: `${local}@example.com` }))).toEqual({
      email: 'errorEmailInvalid',
    })
  })

  test.each([
    'not-an-email',
    'missing@tld',
    '@example.com',
    'spaces in@example.com',
  ])('rejects the malformed email %s', (email) => {
    expect(fieldErrors(submission({ email }))).toEqual({
      email: 'errorEmailInvalid',
    })
  })

  test('rejects a slug over the length cap', () => {
    expect(
      fieldErrors(submission({ slug: 'a'.repeat(SLUG_MAX_LENGTH + 1) })),
    ).toEqual({ slug: 'errorSubmissionInvalid' })
  })

  test.each([
    ['contentType', 'poem', 'contentType', 'errorSubmissionInvalid'],
    ['feedbackType', 'not-a-problem', 'feedbackType', 'errorFeedbackTypeInvalid'],
    ['locale', 'de', 'locale', 'errorSubmissionInvalid'],
  ])('rejects an out-of-enum %s', (field, value, key, expected) => {
    expect(fieldErrors(submission({ [field]: value }))).toEqual({
      [key]: expected,
    })
  })

  test.each(['word', 'grammar-topic', 'scenario'])(
    'accepts the %s content type',
    (contentType) => {
      expect(parseFeedbackSubmission(submission({ contentType })).success).toBe(true)
    },
  )

  test('reports every offending field at once', () => {
    expect(
      fieldErrors(submission({ email: 'nope', feedbackType: 'x', message: 'short' })),
    ).toEqual({
      email: 'errorEmailInvalid',
      feedbackType: 'errorFeedbackTypeInvalid',
      message: 'errorMessageTooShort',
    })
  })

  test('strips unknown keys so moderation fields cannot ride along', () => {
    const result = parseFeedbackSubmission(
      submission({ adminNotes: 'approved', handledBy: 1, status: 'resolved' }),
    )

    expect(result.success).toBe(true)
    expect(result.success && result.data).not.toHaveProperty('status')
    expect(result.success && result.data).not.toHaveProperty('adminNotes')
    expect(result.success && result.data).not.toHaveProperty('handledBy')
  })

  test('the honeypot is not part of a submission', () => {
    const result = parseFeedbackSubmission(submission({ website: 'spam' }))

    expect(result.success && result.data).not.toHaveProperty('website')
  })

  test.each([null, undefined, 'a string', 42, []])(
    'rejects the non-object input %s',
    (input) => {
      expect(parseFeedbackSubmission(input).success).toBe(false)
    },
  )

  test('toFieldErrors ignores issues outside the known fields', () => {
    const error = feedbackSubmissionSchema.safeParse(submission({ message: 'x' }))

    expect(error.success).toBe(false)
    expect(Object.keys(toFieldErrors(error.error!))).toEqual(['message'])
  })
})
