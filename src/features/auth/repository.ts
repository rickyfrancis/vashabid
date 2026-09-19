import {
  createDocument,
  createDocumentAs,
  findOneAs,
  updateDocumentAs,
} from '@/lib/payload'
import type { OnboardingSubmission, SignupSubmission } from './validation'

/**
 * Data the signup path is allowed to send.
 *
 * Written as an explicit shape rather than the generated `User` type so the
 * compiler refuses `role` and `accountStatus` outright. Runtime enforcement
 * still exists in the collection hooks for untyped callers; the type makes the
 * intent unmissable in review.
 */
export type LearnerSignupData = SignupSubmission & {
  supportMode: 'bn' | 'both' | 'en'
}

export class UserRepository {
  constructor(
    private readonly create = createDocument,
    private readonly updateAs = updateDocumentAs,
  ) {}

  /**
   * Creates a self-registered learner.
   *
   * Goes through `createDocument`, which pins `overrideAccess: false`, so the
   * anonymous signup passes the same collection and field policies a public
   * `POST /api/users` would. There is deliberately no privileged variant.
   */
  async createLearner(
    data: LearnerSignupData,
    headers?: Headers,
  ): Promise<void> {
    await this.create('users', data as never, { headers })
  }

  async updatePreferences(
    id: number | string,
    data: { supportMode?: string; uiLocale?: string },
    options: { headers?: Headers; user: unknown },
  ): Promise<void> {
    await this.updateAs('users', id, data as never, {
      headers: options.headers,
      user: options.user as never,
    })
  }
}

export type LearnerProfileData = Omit<OnboardingSubmission, 'uiLocale'>

export class LearnerProfileRepository {
  constructor(
    private readonly createAs = createDocumentAs,
    private readonly updateAs = updateDocumentAs,
    private readonly findAs = findOneAs,
  ) {}

  async findByUser(
    userId: number | string,
    options: { user: unknown },
  ): Promise<{ id: number | string } | null> {
    return (await this.findAs(
      'learner-profiles',
      { user: { equals: userId } },
      { user: options.user as never },
    )) as { id: number | string } | null
  }

  /**
   * `user` is absent from the payload on purpose: `forceProfileOwner` stamps it
   * from the authenticated request, so ownership is never something a caller
   * gets to state.
   */
  async createForUser(
    data: LearnerProfileData,
    options: { headers?: Headers; user: unknown },
  ): Promise<void> {
    await this.createAs('learner-profiles', data as never, {
      headers: options.headers,
      user: options.user as never,
    })
  }

  async updateForUser(
    id: number | string,
    data: LearnerProfileData,
    options: { headers?: Headers; user: unknown },
  ): Promise<void> {
    await this.updateAs('learner-profiles', id, data as never, {
      headers: options.headers,
      user: options.user as never,
    })
  }
}
