import { GrammarRepository } from '@/features/grammar/repository'
import { ScenarioRepository } from '@/features/scenarios/repository'
import { WordRepository } from '@/features/words/repository'
import { feedbackCollectionSlugs, type FeedbackContentType } from './constants'
import { FeedbackRepository } from './repository'
import type { FeedbackSubmitResult } from './types'
import { parseFeedbackSubmission, type FeedbackSubmission } from './validation'

type SlugLookup = { findPublishedBySlug: (slug: string) => Promise<unknown> }

/**
 * Turns an untrusted submission into a stored report.
 *
 * Two rules shape this class:
 *
 * - It depends on the word, grammar, and scenario *repositories*, never their
 *   services, which is the project's rule for keeping the feature graph acyclic.
 * - The public form submits a slug, never a database id. Resolving the slug here
 *   means a report can only ever be attached to content that is actually
 *   published, and no raw identifier has to travel through client props.
 */
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: Pick<
      FeedbackRepository,
      'createSubmission'
    > = new FeedbackRepository(),
    private readonly wordRepository: Pick<
      WordRepository,
      'findPublishedBySlug'
    > = new WordRepository(),
    private readonly grammarRepository: Pick<
      GrammarRepository,
      'findPublishedBySlug'
    > = new GrammarRepository(),
    private readonly scenarioRepository: Pick<
      ScenarioRepository,
      'findPublishedBySlug'
    > = new ScenarioRepository(),
  ) {}

  async submit(
    input: unknown,
    headers?: Headers,
  ): Promise<FeedbackSubmitResult> {
    const parsed = parseFeedbackSubmission(input)

    if (!parsed.success) {
      return { fieldErrors: parsed.fieldErrors, kind: 'invalid' }
    }

    const target = await this.resolveTarget(
      parsed.data.contentType,
      parsed.data.slug,
    )

    if (target === null) return { kind: 'unknown-target' }

    try {
      await this.feedbackRepository.createSubmission(
        toCreateData(parsed.data, target),
        headers,
      )
    } catch (error) {
      return toFailure(error)
    }

    return { kind: 'success' }
  }

  private async resolveTarget(
    contentType: FeedbackContentType,
    slug: string,
  ): Promise<number | null> {
    const lookup: SlugLookup =
      contentType === 'word'
        ? this.wordRepository
        : contentType === 'grammar-topic'
          ? this.grammarRepository
          : this.scenarioRepository

    const document = await lookup.findPublishedBySlug(slug)

    return documentID(document)
  }
}

function documentID(document: unknown): number | null {
  if (document === null || typeof document !== 'object') return null

  const { id } = document as { id?: unknown }

  return typeof id === 'number' ? id : null
}

function toCreateData(
  submission: FeedbackSubmission,
  relatedID: number,
): Parameters<FeedbackRepository['createSubmission']>[0] {
  const email = submission.email?.trim()

  // Built field by field on purpose: `status`, `adminNotes`, `handledBy` and
  // `handledAt` are absent by construction, not by filtering.
  return {
    contentType: submission.contentType,
    feedbackType: submission.feedbackType,
    message: submission.message,
    related: {
      relationTo: feedbackCollectionSlugs[submission.contentType],
      value: relatedID,
    },
    relatedSlug: submission.slug,
    submitterLocale: submission.locale,
    ...(email ? { email } : {}),
  }
}

/**
 * Maps a thrown Payload error onto the result union.
 *
 * Detection is by HTTP status rather than `instanceof`, so it still holds if an
 * error crosses a module boundary and loses its prototype: 429 is the rate-limit
 * hook, and 400 is the shared schema rejecting a payload the form let through.
 */
function toFailure(error: unknown): FeedbackSubmitResult {
  const status = (error as { status?: unknown } | null)?.status

  if (status === 429) return { kind: 'rate-limited' }
  if (status === 400) return { fieldErrors: {}, kind: 'invalid' }

  throw error
}
