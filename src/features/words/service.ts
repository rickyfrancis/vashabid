import type { TopicTag, Word } from '@payload-types'

import { TopicTagRepository } from '@/features/topics/repository'
import { cefrLevels, type CefrLevel } from '@/lib/payload/fields'
import { wordTypes, type WordType } from './constants'
import { WordRepository } from './repository'
import type { HomeWordViewModel } from './types'
import type {
  WordBrowseCanonicalQuery,
  WordBrowseCardViewModel,
  WordBrowseFilters,
  WordBrowseResult,
  WordBrowseSearchParams,
  WordBrowseTopicViewModel,
} from './types'

function firstMeaning(
  rows: null | undefined | { meaning: string }[],
): string | null {
  const value = rows?.find(
    (row) =>
      typeof row.meaning === 'string' && row.meaning.trim().length > 0,
  )?.meaning
  return value?.trim() || null
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

function isWordType(value: string): value is WordType {
  return wordTypes.some((wordType) => wordType === value)
}

function toTopicOption(topic: TopicTag): WordBrowseTopicViewModel | null {
  const name = topic.name.trim()
  const slug = topic.slug.trim()
  return name && slug ? { name, slug } : null
}

export function toWordBrowseQuery(
  filters: WordBrowseFilters,
): WordBrowseCanonicalQuery {
  return {
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.topic ? { topic: filters.topic } : {}),
    ...(filters.page > 1 ? { page: String(filters.page) } : {}),
  }
}

export function normalizeWordBrowseSearchParams(
  searchParams: WordBrowseSearchParams,
): { filters: WordBrowseFilters; isCanonical: boolean } {
  const supportedKeys = new Set(['level', 'page', 'topic', 'type'])
  let isCanonical = Object.keys(searchParams).every((key) =>
    supportedKeys.has(key),
  )
  const filters: WordBrowseFilters = { page: 1 }

  const level = readSingleValue(searchParams.level)
  if (level.value && isCefrLevel(level.value)) {
    filters.level = level.value
  } else if (level.value) {
    isCanonical = false
  }
  isCanonical &&= level.isCanonical

  const type = readSingleValue(searchParams.type)
  if (type.value && isWordType(type.value)) {
    filters.type = type.value
  } else if (type.value) {
    isCanonical = false
  }
  isCanonical &&= type.isCanonical

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

export class WordService {
  constructor(
    private readonly wordRepository: Pick<
      WordRepository,
      'findPublishedPage'
    > = new WordRepository(),
    private readonly topicRepository: Pick<
      TopicTagRepository,
      'findForBrowse'
    > = new TopicTagRepository(),
  ) {}

  toHomeCard(word: Word): HomeWordViewModel | null {
    const english = firstMeaning(word.english.meanings)

    if (!english) return null

    const approvedBangla =
      word.review?.banglaReviewed === true
        ? firstMeaning(word.bangla?.meanings)
        : null

    return {
      cefrLevel: word.cefrLevel,
      lemma: word.lemma,
      slug: word.slug,
      support: {
        bangla: approvedBangla,
        english,
      },
      wordType: word.wordType,
    }
  }

  toBrowseCard(
    word: Word,
    publishedTopics: TopicTag[],
  ): WordBrowseCardViewModel | null {
    const english = firstMeaning(word.english.meanings)
    const storedLemma = word.lemma.trim()

    if (!english || !storedLemma) return null

    const article = word.wordType === 'noun' ? (word.gender ?? null) : null
    const articlePrefix = article ? `${article} ` : null
    const headword =
      articlePrefix &&
      storedLemma.toLocaleLowerCase('de-DE').startsWith(articlePrefix)
        ? storedLemma.slice(articlePrefix.length).trim() || storedLemma
        : storedLemma
    const relatedTopicIds = new Set(
      (word.topicTags ?? []).map((topic) =>
        typeof topic === 'number' ? topic : topic.id,
      ),
    )
    const topics = publishedTopics
      .filter((topic) => relatedTopicIds.has(topic.id))
      .map(toTopicOption)
      .filter((topic) => topic !== null)

    return {
      article,
      cefrLevel: word.cefrLevel,
      headword,
      slug: word.slug,
      support: {
        bangla:
          word.review?.banglaReviewed === true
            ? firstMeaning(word.bangla?.meanings)
            : null,
        english,
      },
      topics,
      wordType: word.wordType,
    }
  }

  async getBrowsePage(
    searchParams: WordBrowseSearchParams,
  ): Promise<WordBrowseResult> {
    const normalized = normalizeWordBrowseSearchParams(searchParams)
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
        query: toWordBrowseQuery(normalized.filters),
      }
    }

    const result = await this.wordRepository.findPublishedPage({
      cefrLevel: normalized.filters.level,
      page: normalized.filters.page,
      topicId: selectedTopic?.id,
      wordType: normalized.filters.type,
    })
    const lastPage = result.totalPages > 0 ? result.totalPages : 1

    if (normalized.filters.page > lastPage) {
      return {
        kind: 'redirect',
        query: toWordBrowseQuery({
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
          wordTypes,
        },
        pagination: {
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          page: normalized.filters.page,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
        },
        words: result.docs
          .map((word) => this.toBrowseCard(word, publishedTopics))
          .filter((word) => word !== null),
      },
    }
  }
}
