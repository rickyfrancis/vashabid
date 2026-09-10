import {
  AuthenticationError,
  type CollectionBeforeLoginHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type ValidationFieldError,
} from 'payload'
import { APIError, ValidationError } from 'payload'

import {
  SIGNUP_RATE_LIMIT,
  SIGNUP_RATE_LIMIT_WINDOW_MS,
} from '../../src/features/auth/constants'
import {
  parseSignup,
  type AuthFieldErrors,
} from '../../src/features/auth/validation'
import { getActivePayloadUser } from '../../src/lib/payload/access/values'
import { positiveIntFromEnv } from './feedback'
import {
  SlidingWindowRateLimiter,
  resolveClientKey,
} from '../../src/lib/rate-limit'

interface UserHookData {
  id: number | string
  role?: 'admin' | 'editor' | 'learner' | null
  accountStatus?: 'active' | 'suspended' | null
}

/**
 * Process-wide limiter for anonymous signups. Exported as a factory so tests
 * can build an isolated instance with an injected clock rather than depending
 * on this shared one.
 */
export function createSignupRateLimiter(
  now?: () => number,
): SlidingWindowRateLimiter {
  return new SlidingWindowRateLimiter(
    {
      limit: positiveIntFromEnv(
        process.env.SIGNUP_RATE_LIMIT,
        SIGNUP_RATE_LIMIT,
      ),
      windowMs: positiveIntFromEnv(
        process.env.SIGNUP_RATE_LIMIT_WINDOW_MS,
        SIGNUP_RATE_LIMIT_WINDOW_MS,
      ),
    },
    now,
  )
}

const sharedSignupLimiter = createSignupRateLimiter()

/**
 * Rate-limits anonymous account creation.
 *
 * Lives in `beforeOperation` so an abusive request is refused before any field
 * work or password hashing happens, and is a *collection* hook rather than
 * server-action code so Payload's public `POST /api/users` is covered by the
 * same limit. Editorial users are exempt: they create accounts from the admin
 * panel.
 */
export function createSignupRateLimitHook(
  limiter: Pick<SlidingWindowRateLimiter, 'consume'> = sharedSignupLimiter,
): CollectionBeforeOperationHook {
  return ({ args, operation, req }) => {
    if (operation !== 'create') return args
    if (getActivePayloadUser(req.user)) return args

    const { allowed, retryAfterMs } = limiter.consume(
      resolveClientKey(req.headers),
    )

    if (!allowed) {
      throw new APIError(
        'Too many signup attempts. Please try again later.',
        429,
        { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) },
        true,
      )
    }

    return args
  }
}

export const enforceSignupRateLimit = createSignupRateLimitHook()

/** Maps the shared schema's field keys onto the stored field paths. */
const storedPaths: Record<string, string> = {
  displayName: 'displayName',
  email: 'email',
  password: 'password',
  uiLocale: 'uiLocale',
}

const validationMessages: Record<string, string> = {
  errorDisplayNameTooLong: 'Choose a shorter display name.',
  errorDisplayNameTooShort: 'Enter a display name.',
  errorEmailInvalid: 'Enter a valid email address.',
  errorPasswordTooLong: 'Choose a shorter password.',
  errorPasswordTooShort: 'Choose a longer password.',
  errorSubmissionInvalid: 'This value is not valid.',
}

function toValidationErrors(
  fieldErrors: AuthFieldErrors,
): ValidationFieldError[] {
  return Object.entries(fieldErrors).map(([field, key]) => ({
    message: validationMessages[key] ?? 'This value is not valid.',
    path: storedPaths[field] ?? field,
  }))
}

/**
 * Re-validates an anonymous signup against the shared schema.
 *
 * The public form already validates, but a direct `POST /api/users` does not,
 * and Payload has no way to close that endpoint per collection. Running the
 * same schema here is what makes the two paths equivalent — in particular the
 * password minimum, which Payload does not enforce on its own.
 */
export const enforceSignupSubmission: CollectionBeforeValidateHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  // An authenticated editorial user is creating an account through the admin
  // panel, where the admin form's own rules apply.
  if (getActivePayloadUser(req.user)) return data

  const candidate = (data ?? {}) as Record<string, unknown>
  const result = parseSignup({
    displayName: candidate.displayName,
    email: candidate.email,
    password: candidate.password,
    uiLocale: candidate.uiLocale ?? 'en',
  })

  if (!result.success) {
    throw new ValidationError({
      collection: 'users',
      errors: toValidationErrors(result.fieldErrors),
      req,
    })
  }

  return data
}

/**
 * Forces every self-registered account to be an ordinary active learner.
 *
 * Field access already strips an injected `role` or `accountStatus` for an
 * anonymous caller — and because collection `beforeValidate` runs *after* the
 * field pass, this hook sets the trusted value rather than racing the
 * attacker's. It is the belt to field access's braces.
 *
 * This is also what replaces the old `promoteFirstUser`. That hook made the
 * first account created on an empty database an admin, which was harmless while
 * `create` was admin-only and an privilege-escalation hazard the moment signup
 * became public. Admins are now provisioned explicitly by `pnpm seed`.
 */
export const forceLearnerDefaults: CollectionBeforeValidateHook = ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const actor = getActivePayloadUser(req.user)

  if (actor?.role === 'admin') return data

  return {
    ...(data ?? {}),
    accountStatus: 'active',
    role: 'learner',
  }
}

export const rejectSuspendedLogin: CollectionBeforeLoginHook<
  UserHookData
> = ({ req, user }) => {
  if (user.accountStatus !== 'active') {
    throw new AuthenticationError(req.t)
  }

  return user
}
