import type { GrammarTopic, TopicTag, Word } from '@payload-types'

import { TopicTagRepository } from '@/features/topics/repository'
import { WordRepository } from '@/features/words/repository'
import { WordService } from '@/features/words/service'
import { cleanRows, cleanText } from '@/lib/content'
import {
  cefrLevels,
  isRichTextEmpty,
  richTextToPlainText,
  type CefrLevel,
} from '@/lib/payload/fields'
import type { RichTextValue } from '@/lib/payload/fields'
import { GrammarRepository } from './repository'
import type {
  GrammarBrowseCanonicalQuery,
  GrammarBrowseCardViewModel,
  GrammarBrowseFilters,
  GrammarBrowseResult,
  GrammarBrowseSearchParams,
  GrammarDetailLanguageViewModel,
  GrammarDetailPageViewModel,
  GrammarLinkViewModel,
} from './types'
import type { WordBrowseTopicViewModel } from '@/features/words/types'

function relationshipID(value: number | Word): number {
  return typeof value === 'number' ? value : value.id
}

function richText(value: unknown): RichTextValue | null {
  if (value === null || value === undefined) return null
  return isRichTextEmpty(value) ? null : (value as RichTextValue)
}

const SUMMARY_LENGTH = 180

/**
 * Browse and search cards show a short gloss rather than the full explanation,
 * so rich text is flattened and clipped on a word boundary.
 */
function summarize(value: RichTextValue): string {
  const text = richTextToPlainText(value)
  if (text.length <= SUMMARY_LENGTH) return text

  const clipped = text.slice(0, SUMMARY_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

function readSingleValue(
  value: string | string[] | undefined,
): { isCanonical: boolean; value?: string } {
  if (value === undefined) return { isCanonical: true }
  if (Array.isArray(value)) return { isCanonical: false }

  const trimmed = value.trim()
  return trimmed && trimmed === value
    ? { isCanonical: true, value }
    : { isCanonical: false }
}

function isCefrLevel(value: string): value is CefrLevel {
  return cefrLevels.some((level) => level === value)
}

function toTopicOption(topic: TopicTag): WordBrowseTopicViewModel | null {
  const name = topic.name.trim()
  const slug = topic.slug.trim()
  return name && slug ? { name, slug } : null
}

function resolveTopics(
  topic: GrammarTopic,
  publishedTopics: TopicTag[],
): WordBrowseTopicViewModel[] {
  const relatedIDs = new Set(
    (topic.topicTags ?? []).map((tag) =>
      typeof tag === 'number' ? tag : tag.id,
    ),
  )

  return publishedTopics
    .filter((candidate) => relatedIDs.has(candidate.id))
    .map(toTopicOption)
    .filter((candidate) => candidate !== null)
}

/**
 * Bangla is only ever exposed once the independent Bangla review flag is set,
 * matching the rule already applied to words.
 */
function isBanglaApproved(topic: GrammarTopic): boolean {
  return topic.review?.banglaReviewed === true
}

function toEnglishSupport(
  topic: GrammarTopic,
): GrammarDetailLanguageViewModel | null {
  const explanation = richText(topic.english?.explanation)
  if (!explanation) return null

  return {
    commonMistakes: cleanRows(topic.english.commonMistakes, 'mistake'),
    explanation,
  }
}

function toBanglaSupport(
  topic: GrammarTopic,
): GrammarDetailLanguageViewModel | null {
  if (!isBanglaApproved(topic) || !topic.bangla) return null

  const explanation = richText(topic.bangla.explanation)
  const commonMistakes = cleanRows(topic.bangla.commonMistakes, 'mistake')

  if (!explanation && commonMistakes.length === 0) return null

  return { commonMistakes, explanation }
}

export function toGrammarBrowseQuery(
  filters: GrammarBrowseFilters,
): GrammarBrowseCanonicalQuery {
  return {
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.topic ? { topic: filters.topic } : {}),
    ...(filters.page > 1 ? { page: String(filters.page) } : {}),
  }
}

export function normalizeGrammarBrowseSearchParams(
  searchParams: GrammarBrowseSearchParams,
): { filters: GrammarBrowseFilters; isCanonical: boolean } {
  const supportedKeys = new Set(['level', 'page', 'topic'])
  let isCanonical = Object.keys(searchParams).every((key) =>
    supportedKeys.has(key),
  )
  const filters: GrammarBrowseFilters = { page: 1 }

  const level = readSingleValue(searchParams.level)
  if (level.value && isCefrLevel(level.value)) {
    filters.level = level.value
  } else if (level.value) {
    isCanonical = false
  }
  isCanonical &&= level.isCanonical

  const topic = readSingleValue(searchParams.topic)
  if (topic.value) filters.topic = topic.value
  isCanonical &&= topic.isCanonical

  const page = readSingleValue(searchParams.page)
  if (page.value) {
    const parsedPage = Number(page.value)
    if (
      /^\d+$/.test(page.value) &&
      Number.isSafeInteger(parsedPage) &&
      parsedPage > 0
    ) {
      filters.page = parsedPage
      if (parsedPage === 1 || String(parsedPage) !== page.value) {
        isCanonical = false
      }
    } else {
      isCanonical = false
    }
  }
  isCanonical &&= page.isCanonical

  return { filters, isCanonical }
}

export class GrammarService {
  constructor(
    private readonly grammarRepository: Pick<
      GrammarRepository,
      'findPublishedBySlug' | 'findPublishedPage'
    > = new GrammarRepository(),
    private readonly topicRepository: Pick<
      TopicTagRepository,
      'findForBrowse'
    > = new TopicTagRepository(),
    private readonly wordRepository: Pick<
      WordRepository,
      'findPublishedByIDs'
    > = new WordRepository(),
    private readonly wordService: Pick<
      WordService,
      'toRelatedWord'
    > = new WordService(),
  ) {}

  toGrammarLink(topic: GrammarTopic): GrammarLinkViewModel | null {
    const name = cleanText(topic.name)
    const slug = cleanText(topic.slug)

    if (!name || !slug) return null

    return { cefrLevel: topic.cefrLevel, name, slug }
  }

  toBrowseCard(
    topic: GrammarTopic,
    publishedTopics: TopicTag[],
  ): GrammarBrowseCardViewModel | null {
    const name = cleanText(topic.name)
    const slug = cleanText(topic.slug)
    const shortRule = cleanText(topic.shortRule)
    const english = richText(topic.english?.explanation)

    if (!name || !slug || !shortRule || !english) return null

    const bangla = isBanglaApproved(topic)
      ? richText(topic.bangla?.explanation)
      : null

    return {
      cefrLevel: topic.cefrLevel,
      name,
      shortRule,
      slug,
      support: {
        bangla: bangla ? summarize(bangla) : null,
        english: summarize(english),
      },
      topics: resolveTopics(topic, publishedTopics),
    }
  }

  toDetailPage(
    topic: GrammarTopic,
    publishedTopics: TopicTag[],
    relatedWords: Word[],
  ): GrammarDetailPageViewModel | null {
    const english = toEnglishSupport(topic)
    const name = cleanText(topic.name)
    const slug = cleanText(topic.slug)
    const shortRule = cleanText(topic.shortRule)

    if (!english || !name || !slug || !shortRule) return null

    const approvedBangla = isBanglaApproved(topic)
    const examples = (topic.examples ?? [])
      .map((example) => {
        const germanSentence = cleanText(example.germanSentence)
        const englishExplanation = cleanText(example.englishExplanation)
        if (!germanSentence || !englishExplanation) return null

        return {
          germanSentence,
          support: {
            bangla: approvedBangla
              ? cleanText(example.banglaExplanation)
              : null,
            english: englishExplanation,
          },
        }
      })
      .filter((example) => example !== null)

    const expectedIDs = (topic.relatedWords ?? []).map(relationshipID)
    const wordsByID = new Map(relatedWords.map((word) => [word.id, word]))
    const seen = new Set<number>()
    const safeRelated = expectedIDs
      .map((id) => {
        if (seen.has(id)) return null
        seen.add(id)
        const word = wordsByID.get(id)
        return word ? this.wordService.toRelatedWord(word) : null
      })
      .filter((word) => word !== null)

    return {
      cefrLevel: topic.cefrLevel,
      examples,
      name,
      relatedWords: safeRelated,
      shortRule,
      slug,
      support: {
        bangla: toBanglaSupport(topic),
        english,
      },
      topics: resolveTopics(topic, publishedTopics),
    }
  }

  async getDetailPage(
    slug: string,
  ): Promise<GrammarDetailPageViewModel | null> {
    const topic = await this.grammarRepository.findPublishedBySlug(slug)
    if (!topic) return null

    const relatedIDs = [
      ...new Set((topic.relatedWords ?? []).map(relationshipID)),
    ]
    const [publishedTopics, relatedWords] = await Promise.all([
      this.topicRepository.findForBrowse(),
      this.wordRepository.findPublishedByIDs(relatedIDs),
    ])

    return this.toDetailPage(topic, publishedTopics, relatedWords)
  }

  async getBrowsePage(
    searchParams: GrammarBrowseSearchParams,
  ): Promise<GrammarBrowseResult> {
    const normalized = normalizeGrammarBrowseSearchParams(searchParams)
    const publishedTopics = await this.topicRepository.findForBrowse()
    const topicOptions = publishedTopics
      .map(toTopicOption)
      .filter((topic) => topic !== null)
    const selectedTopic = normalized.filters.topic
      ? publishedTopics.find(
          (topic) => topic.slug === normalized.filters.topic,
        )
      : undefined

    if (normalized.filters.topic && !selectedTopic) {
      delete normalized.filters.topic
      normalized.isCanonical = false
    }

    if (!normalized.isCanonical) {
      return {
        kind: 'redirect',
        query: toGrammarBrowseQuery(normalized.filters),
      }
    }

    const result = await this.grammarRepository.findPublishedPage({
      cefrLevel: normalized.filters.level,
      page: normalized.filters.page,
      topicId: selectedTopic?.id,
    })
    const lastPage = result.totalPages > 0 ? result.totalPages : 1

    if (normalized.filters.page > lastPage) {
      return {
        kind: 'redirect',
        query: toGrammarBrowseQuery({
          ...normalized.filters,
          page: lastPage,
        }),
      }
    }

    return {
      kind: 'page',
      page: {
        filters: normalized.filters,
        options: {
          levels: cefrLevels,
          topics: topicOptions,
        },
        pagination: {
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          page: normalized.filters.page,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
        },
        topics: result.docs
          .map((topic) => this.toBrowseCard(topic, publishedTopics))
          .filter((topic) => topic !== null),
      },
    }
  }
}
