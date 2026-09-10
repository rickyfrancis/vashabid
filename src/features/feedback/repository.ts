import type { RequiredDataFromCollectionSlug } from 'payload'

import { createDocument } from '@/lib/payload'

type FeedbackCreateData = RequiredDataFromCollectionSlug<'feedback'>

/**
 * What a public submission is allowed to contain.
 *
 * The moderation fields are `Omit`ted rather than merely left unset, so the
 * compiler rejects any attempt to send `status`, `adminNotes`, `handledBy` or
 * `handledAt` from the public path. Field access and the `forceNewFeedbackStatus`
 * hook enforce the same thing at runtime for callers that are not typed, such as
 * a direct REST request.
 */
export type FeedbackSubmissionData = Omit<
  FeedbackCreateData,
  'adminNotes' | 'handledAt' | 'handledBy' | 'status'
>

/**
 * Writes to the `feedback` collection.
 *
 * It injects the `createDocument` helper rather than a Payload instance, the
 * same seam every read repository uses, so tests assert on the exact call.
 */
export class FeedbackRepository {
  constructor(private readonly create = createDocument) {}

  async createSubmission(
    data: FeedbackSubmissionData,
    headers?: Headers,
  ): Promise<void> {
    // Safe by construction: `status` is the only omitted required field, and the
    // collection supplies it through `defaultValue` plus a `beforeValidate` hook
    // that pins every new submission to `new`.
    await this.create('feedback', data as FeedbackCreateData, { headers })
  }
}
