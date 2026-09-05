import type { TopicTag } from '@payload-types'

import { GRAMMAR_SEARCH_LIMIT } from '@/features/grammar/constants'
import { GrammarService } from '@/features/grammar/service'
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
    grammar: [],
    query: '',
    state: 'idle',
    words: [],
  }
}

export class SearchService {
  constructor(
    private readonly searchRepository: Pick<
      SearchRepository,
      'findGrammarMatches' | 'findWordPage'
    > = new SearchRepository(),
    private readonly topicRepository: Pick<
      TopicTagRepository,
      'findForBrowse'
    > = new TopicTagRepository(),
    private readonly wordService: Pick<WordService, 'toBrowseCard'> =
      new WordService(),
    private readonly grammarService: Pick<GrammarService, 'toBrowseCard'> =
      new GrammarService(),
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

    // Words are the paginated primary list, so grammar is a capped secondary
    // section shown only alongside the first page of word results.
    const grammarTopics =
      normalizedParams.page === 1
        ? await this.searchRepository.findGrammarMatches(
            tokens,
            GRAMMAR_SEARCH_LIMIT,
          )
        : []

    return {
      kind: 'page',
      page: {
        grammar: grammarTopics
          .map((topic) => this.grammarService.toBrowseCard(topic, publishedTopics))
          .filter((topic) => topic !== null),
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
