import type { GrammarBrowseCardViewModel } from '@/features/grammar/types'
import type { CefrLevel } from '@/lib/payload/fields'
import type { WordType } from '@/features/words/constants'
import type { WordBrowseCardViewModel } from '@/features/words/types'

export const SEARCH_PAGE_SIZE = 12

export type SearchParams = Record<string, string | string[] | undefined>

export interface SearchToken {
  cefrLevel?: CefrLevel
  topicIDs: number[]
  variants: string[]
  wordType?: WordType
}

export interface NormalizedSearchQuery {
  displayQuery: string
  tokens: Omit<SearchToken, 'topicIDs'>[]
}

export interface SearchPaginationViewModel {
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

export interface SearchPageViewModel {
  /**
   * Secondary results. Words stay the paginated primary list, so grammar is
   * capped and only present on the first page.
   */
  grammar: GrammarBrowseCardViewModel[]
  pagination: SearchPaginationViewModel
  query: string
  state: 'idle' | 'results'
  words: WordBrowseCardViewModel[]
}

export type SearchCanonicalQuery = Partial<Record<'page' | 'q', string>>

export type SearchResult =
  | { kind: 'page'; page: SearchPageViewModel }
  | { kind: 'redirect'; query: SearchCanonicalQuery }

export interface NormalizedSearchParams {
  isCanonical: boolean
  page: number
  query: string
}
