import { createLocalReq, logoutOperation } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { deriveSupportMode } from './support-mode'
import {
  LearnerProfileRepository,
  UserRepository,
} from './repository'
import type { LoginResult, OnboardingResult, SignupResult } from './types'
import { parseLogin, parseOnboarding, parseSignup } from './validation'

/**
 * Reads the HTTP status off a thrown Payload error.
 *
 * Matched by status rather than `instanceof`, because errors lose their
 * prototype across module boundaries — the same reason `FeedbackService` does
 * it this way.
 */
function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status

  return typeof status === 'number' ? status : undefined
}

/** A duplicate email surfaces as a 400 validation error from Payload. */
function isDuplicateEmail(error: unknown): boolean {
  if (statusOf(error) !== 400) return false

  const message = JSON.stringify(
    (error as { data?: unknown } | null)?.data ?? '',
  )

  return /email/i.test(message) || /duplicate/i.test(String(error))
}

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly getPayload = getPayloadClient,
  ) {}

  async signup(input: unknown, headers?: Headers): Promise<SignupResult> {
    const parsed = parseSignup(input)

    if (!parsed.success) {
      return { fieldErrors: parsed.fieldErrors, kind: 'invalid' }
    }

    try {
      await this.users.createLearner(
        {
          ...parsed.data,
          // A learner who picked a UI language has implicitly picked the
          // language they want explanations in; onboarding can widen it later.
          supportMode: parsed.data.uiLocale,
        },
        headers,
      )
    } catch (error) {
      if (isDuplicateEmail(error)) {
        return {
          fieldErrors: { email: 'errorEmailTaken' },
          kind: 'invalid',
        }
      }

      if (statusOf(error) === 429) return { kind: 'rate-limited' }
      if (statusOf(error) === 400) {
        return { fieldErrors: {}, kind: 'invalid' }
      }

      throw error
    }

    return { kind: 'success' }
  }

  /**
   * Verifies credentials and returns the token to be stored in the cookie.
   *
   * `payload.login()` issues a token but sets no cookie, so the caller pairs
   * this with `setAuthCookie`. Bad credentials and a suspended account both
   * arrive here as the same `AuthenticationError` — `rejectSuspendedLogin`
   * raises the generic error deliberately — and this method keeps them
   * indistinguishable rather than reporting why.
   */
  async login(
    input: unknown,
    headers?: Headers,
  ): Promise<LoginResult & { token?: string }> {
    const parsed = parseLogin(input)

    if (!parsed.success) {
      return { fieldErrors: parsed.fieldErrors, kind: 'invalid' }
    }

    const payload = await this.getPayload()

    try {
      const { token } = await payload.login({
        collection: 'users',
        data: {
          email: parsed.data.email,
          password: parsed.data.password,
        },
        ...(headers ? { req: { headers } as never } : {}),
      })

      if (!token) return { kind: 'invalid-credentials' }

      return { kind: 'success', token }
    } catch (error) {
      if (statusOf(error) === 429) return { kind: 'rate-limited' }

      // 401 for bad credentials, 403 once Payload has locked the account after
      // too many attempts. Both are reported the same way.
      return { kind: 'invalid-credentials' }
    }
  }

  /**
   * Ends the session on the server, not just in the browser.
   *
   * Sessions are enabled by default on an `auth` collection, so a token stays
   * valid for its full lifetime and its `users_sessions` row stays live even
   * after the cookie is deleted. `logoutOperation` revokes the session matching
   * `req.user._sid`; clearing the cookie afterwards is what the browser sees.
   */
  async logout(headers: Headers): Promise<void> {
    const payload = await this.getPayload()
    const { user } = await payload.auth({ headers })

    if (!user) return

    const req = await createLocalReq({ user }, payload)

    await logoutOperation({
      collection: payload.collections.users,
      req,
    })
  }
}

export class OnboardingService {
  constructor(
    private readonly profiles = new LearnerProfileRepository(),
    private readonly users = new UserRepository(),
  ) {}

  /**
   * Stores onboarding answers across both collections.
   *
   * `uiLocale` and the derived `supportMode` belong to the account, because
   * every role has them; the study answers belong to the learner profile. The
   * split is the point of the phase, so it is made here once rather than in the
   * form.
   */
  async submit(
    input: unknown,
    options: { headers?: Headers; user: unknown; userId: number | string },
  ): Promise<OnboardingResult> {
    if (!options.user) return { kind: 'unauthenticated' }

    const parsed = parseOnboarding(input)

    if (!parsed.success) {
      return { fieldErrors: parsed.fieldErrors, kind: 'invalid' }
    }

    const { uiLocale, ...profile } = parsed.data

    await this.users.updatePreferences(
      options.userId,
      {
        supportMode: deriveSupportMode(
          profile.primarySupportLanguage,
          profile.secondarySupportLanguage,
        ),
        uiLocale,
      },
      { headers: options.headers, user: options.user },
    )

    const existing = await this.profiles.findByUser(options.userId, {
      user: options.user,
    })

    if (existing) {
      await this.profiles.updateForUser(existing.id, profile, {
        headers: options.headers,
        user: options.user,
      })
    } else {
      await this.profiles.createForUser(profile, {
        headers: options.headers,
        user: options.user,
      })
    }

    return { kind: 'success' }
  }
}
