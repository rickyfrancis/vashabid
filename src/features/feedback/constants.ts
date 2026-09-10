/**
 * The content surfaces a learner can report a problem on. These are the public
 * names used in form markup and URLs; the matching Payload collection slugs are
 * resolved in `feedbackCollectionSlugs` so the two can never drift.
 */
export const feedbackContentTypes = ['word', 'grammar-topic', 'scenario'] as const
export type FeedbackContentType = (typeof feedbackContentTypes)[number]

export const feedbackCollectionSlugs = {
  'grammar-topic': 'grammar-topics',
  scenario: 'scenarios',
  word: 'words',
} as const satisfies Record<FeedbackContentType, string>

/**
 * The reportable problem types, taken from the learner feedback moderation
 * requirements in `docs/SRS_Vashabid_German_English_Bangla.md` section 2.6.
 */
export const feedbackTypes = [
  'incorrect-german',
  'incorrect-english',
  'incorrect-bangla',
  'missing-audio',
  'bad-example',
  'wrong-cefr',
  'unclear-explanation',
  'usage-suggestion',
  'other',
] as const
export type FeedbackType = (typeof feedbackTypes)[number]

/** Moderation lifecycle. Every submission starts at `new`. */
export const feedbackStatuses = ['new', 'triaged', 'resolved', 'rejected'] as const
export type FeedbackStatus = (typeof feedbackStatuses)[number]

export const MESSAGE_MIN_LENGTH = 10
export const MESSAGE_MAX_LENGTH = 2000
export const EMAIL_MAX_LENGTH = 254
export const SLUG_MAX_LENGTH = 200

/**
 * The honeypot input name. It is a form-layer trick rather than part of a
 * submission, so it deliberately stays out of the submission schema.
 */
export const HONEYPOT_FIELD = 'website'

/**
 * Rate-limit defaults. Generous enough that a real person reporting several
 * problems in one sitting is never blocked, and that the end-to-end suite does
 * not depend on staying under a tight limit, while still stopping a script.
 */
export const FEEDBACK_RATE_LIMIT = 10
export const FEEDBACK_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
