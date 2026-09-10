import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  assertRelatedMatchesType,
  createFeedbackRateLimitHook,
  positiveIntFromEnv,
  enforceFeedbackSubmission,
  forceNewFeedbackStatus,
  recordFeedbackModeration,
} from '../../../collections/hooks/feedback'
import type { AccountStatus, UserRole } from './access'

function createUser(
  role: UserRole,
  accountStatus: AccountStatus = 'active',
): { accountStatus: AccountStatus; collection: 'users'; id: number; role: UserRole } {
  return { accountStatus, collection: 'users', id: 7, role }
}

function request(
  user: unknown = null,
  headers: Record<string, string> = {},
): PayloadRequest {
  return {
    context: {},
    headers: new Headers(headers),
    t: vi.fn(),
    user,
  } as unknown as PayloadRequest
}

function operationArgs(
  user: unknown = null,
  headers: Record<string, string> = {},
  operation = 'create',
) {
  return {
    args: {},
    operation,
    req: request(user, headers),
  } as unknown as Parameters<CollectionBeforeOperationHook>[0]
}

function validateArgs(
  data: Record<string, unknown>,
  {
    operation = 'create',
    originalDoc,
    user = null,
  }: {
    operation?: string
    originalDoc?: Record<string, unknown>
    user?: unknown
  } = {},
) {
  return {
    data,
    operation,
    originalDoc,
    req: request(user),
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]
}

function changeArgs(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
  {
    operation = 'update',
    user = createUser('editor') as unknown,
  }: { operation?: string; user?: unknown } = {},
) {
  return {
    data,
    operation,
    originalDoc,
    req: request(user),
  } as unknown as Parameters<CollectionBeforeChangeHook>[0]
}

function submissionData(overrides: Record<string, unknown> = {}) {
  return {
    contentType: 'word',
    feedbackType: 'wrong-cefr',
    message: 'This word is listed as A1 but feels more like B1.',
    related: { relationTo: 'words', value: 7 },
    relatedSlug: 'das-brot',
    submitterLocale: 'en',
    ...overrides,
  }
}

describe('enforceFeedbackRateLimit', () => {
  function hook(limit: number) {
    let current = 1_000_000
    const consume = createFeedbackRateLimitHook(
      new (class {
        private hits = 0
        consume() {
          this.hits += 1
          return {
            allowed: this.hits <= limit,
            retryAfterMs: 5_000,
          }
        }
      })(),
    )
    return { advance: () => (current += 1), hook: consume }
  }

  test('allows anonymous submissions under the limit', () => {
    const { hook: guard } = hook(2)

    expect(() => guard(operationArgs())).not.toThrow()
    expect(() => guard(operationArgs())).not.toThrow()
  })

  test('refuses the submission that exceeds the limit with a 429', () => {
    const { hook: guard } = hook(1)

    guard(operationArgs())

    try {
      guard(operationArgs())
      throw new Error('expected the hook to refuse the submission')
    } catch (error) {
      expect((error as { status?: number }).status).toBe(429)
      expect((error as { isPublic?: boolean }).isPublic).toBe(true)
    }
  })

  test('exempts authenticated editorial users', () => {
    const { hook: guard } = hook(0)

    expect(() => guard(operationArgs(createUser('admin')))).not.toThrow()
    expect(() => guard(operationArgs(createUser('editor')))).not.toThrow()
  })

  test('does not exempt a suspended admin', () => {
    const { hook: guard } = hook(0)

    expect(() => guard(operationArgs(createUser('admin', 'suspended')))).toThrow()
  })

  test('only limits creates', () => {
    const { hook: guard } = hook(0)

    expect(() => guard(operationArgs(null, {}, 'update'))).not.toThrow()
    expect(() => guard(operationArgs(null, {}, 'read'))).not.toThrow()
  })

  test('separates clients by forwarded address', () => {
    const guard = createFeedbackRateLimitHook(
      new (class {
        private seen: string[] = []
        consume(key: string) {
          this.seen.push(key)
          return {
            allowed: this.seen.filter((entry) => entry === key).length <= 1,
            retryAfterMs: 0,
          }
        }
      })(),
    )

    expect(() =>
      guard(operationArgs(null, { 'x-forwarded-for': '203.0.113.1' })),
    ).not.toThrow()
    expect(() =>
      guard(operationArgs(null, { 'x-forwarded-for': '203.0.113.2' })),
    ).not.toThrow()
    expect(() =>
      guard(operationArgs(null, { 'x-forwarded-for': '203.0.113.1' })),
    ).toThrow()
  })
})

describe('enforceFeedbackSubmission', () => {
  test('accepts a well-formed anonymous submission', () => {
    expect(() => enforceFeedbackSubmission(validateArgs(submissionData()))).not.toThrow()
  })

  test('rejects a short report from a direct REST call', () => {
    try {
      enforceFeedbackSubmission(validateArgs(submissionData({ message: 'bad' })))
      throw new Error('expected the hook to reject the submission')
    } catch (error) {
      const errors = (error as { data?: { errors?: { path: string }[] } }).data
        ?.errors
      expect(errors?.map((entry) => entry.path)).toEqual(['message'])
    }
  })

  test('reports stored field paths rather than schema keys', () => {
    try {
      enforceFeedbackSubmission(
        validateArgs(submissionData({ relatedSlug: '', submitterLocale: 'de' })),
      )
      throw new Error('expected the hook to reject the submission')
    } catch (error) {
      const paths = (error as { data?: { errors?: { path: string }[] } }).data
        ?.errors?.map((entry) => entry.path)

      expect(paths).toContain('relatedSlug')
      expect(paths).toContain('submitterLocale')
    }
  })

  test.each([
    ['a malformed email', { email: 'nope' }],
    ['an unknown problem type', { feedbackType: 'nonsense' }],
    ['an unknown content type', { contentType: 'poem' }],
    ['a missing report', { message: undefined }],
  ])('rejects %s', (_label, overrides) => {
    expect(() =>
      enforceFeedbackSubmission(validateArgs(submissionData(overrides))),
    ).toThrow()
  })

  test('treats a missing email as blank rather than invalid', () => {
    expect(() =>
      enforceFeedbackSubmission(validateArgs(submissionData({ email: undefined }))),
    ).not.toThrow()
  })

  test('leaves editorial writes to the admin form rules', () => {
    expect(() =>
      enforceFeedbackSubmission(
        validateArgs({ message: 'x' }, { user: createUser('editor') }),
      ),
    ).not.toThrow()
  })

  test('does not re-validate updates', () => {
    expect(() =>
      enforceFeedbackSubmission(
        validateArgs({ message: 'x' }, { operation: 'update' }),
      ),
    ).not.toThrow()
  })
})

describe('forceNewFeedbackStatus', () => {
  test('pins a new submission to the new status', () => {
    const result = forceNewFeedbackStatus(
      validateArgs(submissionData()),
    ) as Record<string, unknown>

    expect(result.status).toBe('new')
  })

  test('overrides an injected status and clears the moderation trail', () => {
    const result = forceNewFeedbackStatus(
      validateArgs(
        submissionData({
          adminNotes: 'looks fine',
          handledAt: '2026-01-01T00:00:00.000Z',
          handledBy: 3,
          status: 'resolved',
        }),
      ),
    ) as Record<string, unknown>

    expect(result.status).toBe('new')
    expect(result.adminNotes).toBeNull()
    expect(result.handledBy).toBeNull()
    expect(result.handledAt).toBeNull()
  })

  test('preserves the reporter-supplied content', () => {
    const result = forceNewFeedbackStatus(
      validateArgs(submissionData()),
    ) as Record<string, unknown>

    expect(result.message).toBe(submissionData().message)
    expect(result.relatedSlug).toBe('das-brot')
  })

  test('leaves an update alone so moderators can change status', () => {
    const result = forceNewFeedbackStatus(
      validateArgs({ status: 'resolved' }, { operation: 'update' }),
    ) as Record<string, unknown>

    expect(result.status).toBe('resolved')
  })
})

describe('assertRelatedMatchesType', () => {
  test.each([
    ['word', 'words'],
    ['grammar-topic', 'grammar-topics'],
    ['scenario', 'scenarios'],
  ])('accepts a %s pointing at %s', (contentType, relationTo) => {
    expect(() =>
      assertRelatedMatchesType(
        validateArgs(
          submissionData({ contentType, related: { relationTo, value: 1 } }),
        ),
      ),
    ).not.toThrow()
  })

  test('rejects a relationship that disagrees with the content type', () => {
    try {
      assertRelatedMatchesType(
        validateArgs(
          submissionData({
            contentType: 'word',
            related: { relationTo: 'scenarios', value: 1 },
          }),
        ),
      )
      throw new Error('expected the hook to reject the mismatch')
    } catch (error) {
      const errors = (error as { data?: { errors?: { message: string; path: string }[] } })
        .data?.errors

      expect(errors?.[0]?.path).toBe('related')
      expect(errors?.[0]?.message).toMatch(/must be a words document/)
    }
  })

  test('uses the stored content type when an update omits it', () => {
    expect(() =>
      assertRelatedMatchesType(
        validateArgs(
          { related: { relationTo: 'scenarios', value: 1 } },
          { operation: 'update', originalDoc: { contentType: 'word' } },
        ),
      ),
    ).toThrow()
  })

  test('ignores an update that does not touch the relationship', () => {
    expect(() =>
      assertRelatedMatchesType(
        validateArgs(
          { status: 'resolved' },
          { operation: 'update', originalDoc: { contentType: 'word' } },
        ),
      ),
    ).not.toThrow()
  })
})

describe('recordFeedbackModeration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('stamps who changed the status and when', () => {
    const result = recordFeedbackModeration(
      changeArgs({ status: 'resolved' }, { status: 'new' }),
    ) as Record<string, unknown>

    expect(result.handledBy).toBe(7)
    expect(result.handledAt).toBe('2026-09-10T12:00:00.000Z')
  })

  test('leaves the trail alone when the status is unchanged', () => {
    const result = recordFeedbackModeration(
      changeArgs({ adminNotes: 'still looking', status: 'new' }, { status: 'new' }),
    ) as Record<string, unknown>

    expect(result).not.toHaveProperty('handledAt')
  })

  test('ignores an update that does not include a status', () => {
    const result = recordFeedbackModeration(
      changeArgs({ adminNotes: 'note only' }, { status: 'new' }),
    ) as Record<string, unknown>

    expect(result).not.toHaveProperty('handledBy')
  })

  test('does not stamp a create', () => {
    const result = recordFeedbackModeration(
      changeArgs({ status: 'new' }, {}, { operation: 'create' }),
    ) as Record<string, unknown>

    expect(result).not.toHaveProperty('handledAt')
  })

  test('records no owner when the actor is not an active user', () => {
    const result = recordFeedbackModeration(
      changeArgs({ status: 'resolved' }, { status: 'new' }, { user: null }),
    ) as Record<string, unknown>

    expect(result.handledBy).toBeNull()
    expect(result.handledAt).toBe('2026-09-10T12:00:00.000Z')
  })
})

describe('positiveIntFromEnv', () => {
  test.each([
    ['a plain integer', '25', 25],
    ['zero', '0', 0],
  ])('reads %s', (_label, value, expected) => {
    expect(positiveIntFromEnv(value, 10)).toBe(expected)
  })

  test.each([
    ['an unset variable', undefined],
    // `Number('')` is 0, which would silently block every submission.
    ['an empty variable', ''],
    ['a whitespace-only variable', '   '],
    ['a non-numeric value', 'lots'],
    ['a negative value', '-5'],
    ['a fractional value', '2.5'],
  ])('falls back for %s', (_label, value) => {
    expect(positiveIntFromEnv(value, 10)).toBe(10)
  })
})
