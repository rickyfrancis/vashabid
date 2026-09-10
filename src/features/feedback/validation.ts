import { z } from 'zod'

import { locales } from '@/features/i18n/types'
import {
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  feedbackContentTypes,
  feedbackTypes,
} from './constants'

/**
 * The single description of an acceptable submission.
 *
 * It is shared by three callers on purpose: the server action behind the public
 * form, the Payload `beforeValidate` hook that guards the public REST endpoint,
 * and the tests. A rule added here therefore applies to every write path at
 * once, which is what stops the REST API from becoming a softer back door.
 *
 * The honeypot is deliberately absent: it describes the form, not a submission.
 */
export const feedbackSubmissionSchema = z.object({
  contentType: z.enum(feedbackContentTypes),
  // Trimmed before the union so a field the reporter only tapped into, leaving
  // whitespace, counts as "left blank" rather than as a malformed address.
  email: z
    .preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z.union([z.literal(''), z.email().max(EMAIL_MAX_LENGTH)]),
    )
    .optional(),
  feedbackType: z.enum(feedbackTypes),
  locale: z.enum(locales),
  message: z.string().trim().min(MESSAGE_MIN_LENGTH).max(MESSAGE_MAX_LENGTH),
  slug: z.string().trim().min(1).max(SLUG_MAX_LENGTH),
})

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>

/**
 * Every message key `toFieldErrors` can produce.
 *
 * Declared as a union rather than `string` so the form can pass one straight to
 * `t()`, and so adding an error without adding its wording to
 * `messages/{en,bn}.json` fails to compile.
 */
export type FeedbackErrorMessageKey =
  | 'errorEmailInvalid'
  | 'errorFeedbackTypeInvalid'
  | 'errorMessageRequired'
  | 'errorMessageTooLong'
  | 'errorMessageTooShort'
  | 'errorSubmissionInvalid'

export type FeedbackFieldErrors = Partial<
  Record<keyof FeedbackSubmission, FeedbackErrorMessageKey>
>

/**
 * Translates Zod issues into message *keys* rather than rendered English.
 *
 * The form is bilingual, so an error that arrives as prose could only ever be
 * shown in one language. Returning keys keeps the choice of wording with
 * next-intl in `messages/{en,bn}.json`.
 */
export function toFieldErrors(error: z.ZodError): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {}

  for (const issue of error.issues) {
    const field = issue.path[0]

    if (typeof field !== 'string' || !isSubmissionField(field)) continue
    // Keep the first issue per field; later ones are usually consequences.
    if (errors[field]) continue

    errors[field] = messageKey(field, issue.code)
  }

  return errors
}

const submissionFields = new Set<string>([
  'contentType',
  'email',
  'feedbackType',
  'locale',
  'message',
  'slug',
])

function isSubmissionField(field: string): field is keyof FeedbackSubmission {
  return submissionFields.has(field)
}

function messageKey(
  field: keyof FeedbackSubmission,
  code: string,
): FeedbackErrorMessageKey {
  if (field === 'message') {
    if (code === 'too_small') return 'errorMessageTooShort'
    if (code === 'too_big') return 'errorMessageTooLong'
    return 'errorMessageRequired'
  }

  if (field === 'email') return 'errorEmailInvalid'
  if (field === 'feedbackType') return 'errorFeedbackTypeInvalid'

  // contentType, locale and slug travel in hidden inputs, so an error here
  // means the payload was tampered with rather than mistyped.
  return 'errorSubmissionInvalid'
}

/**
 * Parses untrusted input into a submission, or into per-field message keys.
 * Unknown keys are dropped by Zod, so an injected `status` cannot ride along.
 */
export function parseFeedbackSubmission(
  input: unknown,
):
  | { fieldErrors: FeedbackFieldErrors; success: false }
  | { data: FeedbackSubmission; success: true } {
  const result = feedbackSubmissionSchema.safeParse(input)

  return result.success
    ? { data: result.data, success: true }
    : { fieldErrors: toFieldErrors(result.error), success: false }
}
