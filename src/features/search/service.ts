import type { TopicTag } from '@payload-types'

import { TopicTagRepository } from '@/features/topics/repository'
import { WordService } from '@/features/words/service'
import { normalizeSearchParams, normalizeSearchQuery, toSearchQuery } from './normalization'
import { SearchRepository } from './repository'
import type {
  SearchPageViewModel,
  SearchParams,
  SearchResult,
  SearchToken,
} from './types'

function topicText(topic: TopicTag): string[] {
  const values = [topic.name, topic.slug, topic.english.description]

  if (topic.review?.banglaReviewed === true && topic.bangla?.description) {
    values.push(topic.bangla.description)
  }

  return values.map((value) =>
    value.normalize('NFC').toLocaleLowerCase('de-DE'),
  )
}

function matchingTopicIDs(topicTags: TopicTag[], variants: string[]): number[] {
  return topicTags
    .filter((topic) => {
      const values = topicText(topic)
      return variants.some((variant) =>
        values.some((value) => value.includes(variant)),
      )
    })
    .map((topic) => topic.id)
}

function idlePage(): SearchPageViewModel {
  return {
    pagination: {
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 0,
    },
    query: '',
    state: 'idle',
    words: [],
  }
}

export class SearchService {
  constructor(
    private readonly searchRepository: Pick<SearchRepository, 'findWordPage'> =
      new SearchRepository(),
    private readonly topicRepository: Pick<
      TopicTagRepository,
      'findForBrowse'
    > = new TopicTagRepository(),
    private readonly wordService: Pick<WordService, 'toBrowseCard'> =
      new WordService(),
  ) {}

  async getPage(params: SearchParams): Promise<SearchResult> {
    const normalizedParams = normalizeSearchParams(params)

    if (!normalizedParams.isCanonical) {
      return {
        kind: 'redirect',
        query: toSearchQuery(normalizedParams.query, normalizedParams.page),
      }
    }

    if (!normalizedParams.query) {
      return { kind: 'page', page: idlePage() }
    }

    const normalizedQuery = normalizeSearchQuery(normalizedParams.query)
    const publishedTopics = await this.topicRepository.findForBrowse()
    const tokens: SearchToken[] = normalizedQuery.tokens.map((token) => ({
      ...token,
      topicIDs: matchingTopicIDs(publishedTopics, token.variants),
    }))
    const result = await this.searchRepository.findWordPage(
      tokens,
      normalizedParams.page,
    )
    const lastPage = result.totalPages > 0 ? result.totalPages : 1

    if (normalizedParams.page > lastPage) {
      return {
        kind: 'redirect',
        query: toSearchQuery(normalizedParams.query, lastPage),
      }
    }

    return {
      kind: 'page',
      page: {
        pagination: {
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          page: normalizedParams.page,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
        },
        query: normalizedQuery.displayQuery,
        state: 'results',
        words: result.docs
          .map((word) => this.wordService.toBrowseCard(word, publishedTopics))
          .filter((word) => word !== null),
      },
    }
  }
}
