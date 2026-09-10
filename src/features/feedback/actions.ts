'use server'

import { headers } from 'next/headers'

import { HONEYPOT_FIELD } from './constants'
import { FeedbackService } from './service'
import type { FeedbackFormState, FeedbackFormValues } from './types'

function text(formData: FormData, field: string): string {
  const value = formData.get(field)
  return typeof value === 'string' ? value : ''
}

function submittedValues(formData: FormData): FeedbackFormValues {
  return {
    email: text(formData, 'email'),
    feedbackType: text(formData, 'feedbackType'),
    message: text(formData, 'message'),
  }
}

/**
 * The public submission entry point, and the first server action in the project.
 *
 * It stays a thin adapter: `FeedbackService` owns validation, target resolution,
 * and the result union, while the collection hooks own the rules that must also
 * apply to Payload's public REST endpoint. Nothing is revalidated because no
 * public page renders feedback.
 */
export async function submitFeedback(
  _previousState: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const values = submittedValues(formData)

  // The honeypot is a property of the form, not of a submission, so it is
  // checked here rather than in the schema. A filled honeypot is reported as
  // success and silently dropped, so a bot learns nothing from the response.
  if (text(formData, HONEYPOT_FIELD).trim() !== '') {
    return { status: 'success' }
  }

  const result = await new FeedbackService().submit(
    {
      contentType: text(formData, 'contentType'),
      email: values.email,
      feedbackType: values.feedbackType,
      locale: text(formData, 'locale'),
      message: values.message,
      slug: text(formData, 'slug'),
    },
    await headers(),
  )

  if (result.kind === 'success') return { status: 'success' }

  if (result.kind === 'invalid') {
    return { fieldErrors: result.fieldErrors, status: 'invalid', values }
  }

  return { status: result.kind, values }
}
