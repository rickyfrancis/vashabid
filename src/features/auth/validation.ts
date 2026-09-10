import { z } from 'zod'

import { locales } from '@/features/i18n/types'
import { supportModes } from '@/features/i18n/support-mode'
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  dailyStudyTargets,
  learningGoals,
  practiceStyles,
  supportLanguages,
} from './constants'

/** Emails are compared case-insensitively, so they are stored lowercased. */
const emailField = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.email().max(EMAIL_MAX_LENGTH),
)

/**
 * The single description of an acceptable signup.
 *
 * Shared by the server action, the Payload `beforeValidate` hook guarding the
 * public REST endpoint, and the tests — the same arrangement Phase 15 used for
 * feedback, and for the same reason: `POST /api/users` cannot be switched off
 * per collection, so a rule that lives only in the action guards the polite
 * path and leaves the other one open.
 *
 * `role` and `accountStatus` are absent on purpose. Zod drops unknown keys, so
 * an injected privilege cannot even reach the hook that would overwrite it.
 */
export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(DISPLAY_NAME_MIN_LENGTH)
    .max(DISPLAY_NAME_MAX_LENGTH),
  email: emailField,
  // Payload enforces no minimum password length of its own, so this bound is
  // the only thing between a public signup and a one-character password.
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  uiLocale: z.enum(locales),
})

export type SignupSubmission = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: emailField,
  // Deliberately only "present": an existing account whose password predates a
  // rule change must still be able to sign in.
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
})

export type LoginSubmission = z.infer<typeof loginSchema>

/**
 * Onboarding answers.
 *
 * `secondarySupportLanguage` accepts an empty string because an unselected
 * radio group posts one; it is normalised away rather than treated as invalid.
 */
export const onboardingSchema = z
  .object({
    dailyStudyTarget: z.enum(dailyStudyTargets),
    germanLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    learningGoal: z.enum(learningGoals),
    practiceStyle: z.enum(practiceStyles),
    primarySupportLanguage: z.enum(supportLanguages),
    secondarySupportLanguage: z
      .preprocess(
        (value) => (value === '' || value === null ? undefined : value),
        z.enum(supportLanguages).optional(),
      )
      .optional(),
    uiLocale: z.enum(locales),
  })
  .refine(
    (value) =>
      value.secondarySupportLanguage === undefined ||
      value.secondarySupportLanguage !== value.primarySupportLanguage,
    {
      // Choosing the same language twice would derive `both` from one language,
      // which renders the same text side by side.
      path: ['secondarySupportLanguage'],
      message: 'duplicate',
    },
  )

export type OnboardingSubmission = z.infer<typeof onboardingSchema>

/**
 * Every message key the parsers below can produce.
 *
 * Declared as a union rather than `string` so a form can pass one straight to
 * `t()`, and so adding an error without adding its wording to
 * `messages/{en,bn}.json` fails to compile.
 */
export type AuthErrorMessageKey =
  | 'errorDisplayNameTooLong'
  | 'errorDisplayNameTooShort'
  | 'errorEmailInvalid'
  | 'errorEmailTaken'
  | 'errorInvalidCredentials'
  | 'errorPasswordTooLong'
  | 'errorPasswordTooShort'
  | 'errorRateLimited'
  | 'errorSecondaryLanguageDuplicate'
  | 'errorSubmissionInvalid'

export type AuthFieldErrors = Record<string, AuthErrorMessageKey>

function signupMessageKey(field: string, code: string): AuthErrorMessageKey {
  if (field === 'password') {
    return code === 'too_big' ? 'errorPasswordTooLong' : 'errorPasswordTooShort'
  }

  if (field === 'displayName') {
    return code === 'too_big'
      ? 'errorDisplayNameTooLong'
      : 'errorDisplayNameTooShort'
  }

  if (field === 'email') return 'errorEmailInvalid'

  // uiLocale travels in a hidden input, so an error here means the payload was
  // tampered with rather than mistyped.
  return 'errorSubmissionInvalid'
}

function toFieldErrors(
  error: z.ZodError,
  messageKey: (field: string, code: string) => AuthErrorMessageKey,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {}

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '')

    // Keep the first issue per field: later ones are usually consequences of
    // the first and would overwrite the most specific message.
    if (field === '' || errors[field]) continue

    errors[field] = messageKey(field, issue.code)
  }

  return errors
}

export function parseSignup(
  input: unknown,
): { fieldErrors: AuthFieldErrors; success: false } | { data: SignupSubmission; success: true } {
  const result = signupSchema.safeParse(input)

  return result.success
    ? { data: result.data, success: true }
    : { fieldErrors: toFieldErrors(result.error, signupMessageKey), success: false }
}

export function parseLogin(
  input: unknown,
): { fieldErrors: AuthFieldErrors; success: false } | { data: LoginSubmission; success: true } {
  const result = loginSchema.safeParse(input)

  return result.success
    ? { data: result.data, success: true }
    : {
        fieldErrors: toFieldErrors(result.error, (field) =>
          field === 'email' ? 'errorEmailInvalid' : 'errorInvalidCredentials',
        ),
        success: false,
      }
}

export function parseOnboarding(
  input: unknown,
):
  | { fieldErrors: AuthFieldErrors; success: false }
  | { data: OnboardingSubmission; success: true } {
  const result = onboardingSchema.safeParse(input)

  return result.success
    ? { data: result.data, success: true }
    : {
        fieldErrors: toFieldErrors(result.error, (field, code) =>
          field === 'secondarySupportLanguage' && code === 'custom'
            ? 'errorSecondaryLanguageDuplicate'
            : 'errorSubmissionInvalid',
        ),
        success: false,
      }
}

export { supportModes }
