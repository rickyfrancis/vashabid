import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  ValidationFieldError,
} from 'payload'
import { APIError, ValidationError } from 'payload'

import { getActivePayloadUser } from '../../src/lib/payload/access/values'
import {
  FEEDBACK_RATE_LIMIT,
  FEEDBACK_RATE_LIMIT_WINDOW_MS,
  feedbackCollectionSlugs,
  type FeedbackContentType,
} from '../../src/features/feedback/constants'
import {
  parseFeedbackSubmission,
  type FeedbackFieldErrors,
} from '../../src/features/feedback/validation'
import {
  SlidingWindowRateLimiter,
  resolveClientKey,
} from '../../src/lib/rate-limit'

/**
 * Reads a non-negative integer override, falling back on anything unusable.
 *
 * The blank check matters: `Number('')` is `0`, so an env var that is present but
 * empty would otherwise set the limit to zero and refuse every submission.
 */
export function positiveIntFromEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') return fallback

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Process-wide limiter for anonymous submissions. Exported as a factory so
 * tests can build an isolated instance with an injected clock rather than
 * depending on this shared one.
 */
export function createFeedbackRateLimiter(
  now?: () => number,
): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(
    {
      limit: positiveIntFromEnv(
        process.env.FEEDBACK_RATE_LIMIT,
        FEEDBACK_RATE_LIMIT,
      ),
      windowMs: positiveIntFromEnv(
        process.env.FEEDBACK_RATE_LIMIT_WINDOW_MS,
        FEEDBACK_RATE_LIMIT_WINDOW_MS,
      ),
    },
    now,
  )
}

const sharedLimiter = createFeedbackRateLimiter()

/**
 * Rate-limits anonymous creates.
 *
 * This lives in `beforeOperation` so an abusive request is refused before any
 * field work happens, and it is a *collection* hook rather than server-action
 * code so that Payload's public REST endpoint is covered by the same limit.
 * Authenticated editorial users are exempt: they write through the admin panel.
 */
export function createFeedbackRateLimitHook(
  limiter: Pick<SlidingWindowRateLimiter, 'consume'> = sharedLimiter,
): CollectionBeforeOperationHook {
  return ({ args, operation, req }) => {
    if (operation !== 'create') return args
    if (getActivePayloadUser(req.user)) return args

    const { allowed, retryAfterMs } = limiter.consume(
      resolveClientKey(req.headers),
    )

    if (!allowed) {
      throw new APIError(
        'Too many feedback submissions. Please try again later.',
        429,
        { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) },
        true,
      )
    }

    return args
  }
}

export const enforceFeedbackRateLimit = createFeedbackRateLimitHook()

/**
 * Re-validates an anonymous create against the shared submission schema.
 *
 * The public form already validates, but a direct `POST /api/feedback` does
 * not, and Payload has no way to close that endpoint per collection. Running
 * the same schema here is what makes the two paths equivalent.
 */
export const enforceFeedbackSubmission: CollectionBeforeValidateHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  // Collection `beforeValidate` args carry no `overrideAccess`, and they do not
  // need to: an authenticated editorial user is writing through the admin panel,
  // and anything without an active user is a public submission.
  if (getActivePayloadUser(req.user)) return data

  const candidate = (data ?? {}) as Record<string, unknown>
  const result = parseFeedbackSubmission({
    contentType: candidate.contentType,
    email: candidate.email ?? '',
    feedbackType: candidate.feedbackType,
    locale: candidate.submitterLocale,
    message: candidate.message,
    slug: candidate.relatedSlug,
  })

  if (!result.success) {
    throw new ValidationError({
      collection: 'feedback',
      errors: toValidationErrors(result.fieldErrors),
      req,
    })
  }

  return data
}

/** Maps the shared schema's field keys onto the stored field paths. */
const storedPaths: Record<string, string> = {
  contentType: 'contentType',
  email: 'email',
  feedbackType: 'feedbackType',
  locale: 'submitterLocale',
  message: 'message',
  slug: 'relatedSlug',
}

function toValidationErrors(
  fieldErrors: FeedbackFieldErrors,
): ValidationFieldError[] {
  return Object.entries(fieldErrors).map(([field, key]) => ({
    message: validationMessages[key as string] ?? 'This value is not valid.',
    path: storedPaths[field] ?? field,
  }))
}

const validationMessages: Record<string, string> = {
  errorEmailInvalid: 'Enter a valid email address, or leave it blank.',
  errorFeedbackTypeInvalid: 'Choose one of the listed problem types.',
  errorMessageRequired: 'Describe the problem before submitting.',
  errorMessageTooLong: 'Shorten the description before submitting.',
  errorMessageTooShort: 'Describe the problem in a little more detail.',
  errorSubmissionInvalid: 'This value is not valid.',
}

/**
 * Forces every new submission to start at `new` with no moderation trail.
 *
 * Field access already strips an injected `status` for an anonymous caller —
 * and because collection `beforeValidate` runs *after* field access, this hook
 * is setting the trusted value rather than racing the attacker's.
 */
export const forceNewFeedbackStatus: CollectionBeforeValidateHook = ({
  data,
  operation,
}) => {
  if (operation !== 'create') return data

  return {
    ...(data ?? {}),
    adminNotes: null,
    handledAt: null,
    handledBy: null,
    status: 'new',
  }
}

/**
 * Rejects a submission whose relationship points at a different collection
 * than its declared content type, so the two representations cannot drift.
 */
export const assertRelatedMatchesType: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'create' && operation !== 'update') return data

  const candidate = (data ?? {}) as Record<string, unknown>
  const contentType = (candidate.contentType ??
    (originalDoc as Record<string, unknown> | undefined)?.contentType) as
    | FeedbackContentType
    | undefined
  const related = candidate.related as { relationTo?: unknown } | undefined

  if (!contentType || !related || typeof related !== 'object') return data
  if (typeof related.relationTo !== 'string') return data

  const expected = feedbackCollectionSlugs[contentType]

  if (expected && related.relationTo !== expected) {
    throw new ValidationError({
      collection: 'feedback',
      errors: [
        {
          message: `Related content must be a ${expected} document for the ${contentType} content type.`,
          path: 'related',
        },
      ],
      req,
    })
  }

  return data
}

/** Stamps who moved a submission out of its previous status, and when. */
export const recordFeedbackModeration: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update') return data

  const next = (data ?? {}) as Record<string, unknown>
  const previous = (originalDoc ?? {}) as Record<string, unknown>

  if (next.status === undefined || next.status === previous.status) return data

  const user = getActivePayloadUser(req.user)

  return {
    ...next,
    handledAt: new Date().toISOString(),
    handledBy: user?.id ?? null,
  }
}
