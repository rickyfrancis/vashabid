import {
  AuthenticationError,
  type CollectionAfterDeleteHook,
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

/**
 * Marks a write as coming from the seed script rather than from a request.
 * See `forceLearnerDefaults` for why this cannot be forged over HTTP.
 */
export const SEED_CONTEXT_FLAG = 'vashabidSeed'

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
  context,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  // Trusted local tooling — the seeder — declares itself through `req.context`,
  // which `createPayloadRequest` hardcodes to `{}` for every REST request. A
  // network client therefore cannot set this flag, which is what makes it a safe
  // way to let the seeder mint the admin that nothing else may.
  if (context?.[SEED_CONTEXT_FLAG] === true) return data

  const actor = getActivePayloadUser(req.user)

  if (actor?.role === 'admin') return data

  return {
    ...(data ?? {}),
    accountStatus: 'active',
    role: 'learner',
  }
}

/**
 * Removes a learner's profile when their account is deleted.
 *
 * The generated foreign key is `ON DELETE set null` against a `NOT NULL`
 * column, so without this a delete would fail on the constraint rather than
 * cascade. Doing it in a hook rather than by hand-editing the migration means
 * the behaviour is identical on the schema-push path used in development and
 * the migration path used in production.
 *
 * The nested delete is passed `req` so it shares the outer transaction: if the
 * user delete is rolled back, the profile comes back with it.
 */
export const removeLearnerProfile: CollectionAfterDeleteHook = async ({
  id,
  req,
}) => {
  await req.payload.delete({
    collection: 'learner-profiles',
    overrideAccess: true,
    req,
    where: { user: { equals: id } },
  })
}

export const rejectSuspendedLogin: CollectionBeforeLoginHook<
  UserHookData
> = ({ req, user }) => {
  if (user.accountStatus !== 'active') {
    throw new AuthenticationError(req.t)
  }

  return user
}
