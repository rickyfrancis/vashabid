import type {
  FeedbackErrorMessageKey,
  FeedbackFieldErrors,
  FeedbackSubmission,
} from './validation'

/**
 * The outcome of a submission attempt, in the same discriminated-union style the
 * browse and translator services use, so the route adapter stays a thin mapper.
 */
export type FeedbackSubmitResult =
  | { fieldErrors: FeedbackFieldErrors; kind: 'invalid' }
  | { kind: 'rate-limited' }
  | { kind: 'success' }
  | { kind: 'unknown-target' }

/** What the form carries back to the client between submissions. */
export type FeedbackFormState =
  | { fieldErrors: FeedbackFieldErrors; status: 'invalid'; values: FeedbackFormValues }
  | { status: 'idle' }
  | { status: 'rate-limited'; values: FeedbackFormValues }
  | { status: 'success' }
  | { status: 'unknown-target'; values: FeedbackFormValues }

/** Echoed back so a rejected submission does not lose what was typed. */
export interface FeedbackFormValues {
  email: string
  feedbackType: string
  message: string
}

export type {
  FeedbackErrorMessageKey,
  FeedbackFieldErrors,
  FeedbackSubmission,
}
