import type { CefrLevel } from '@/lib/payload/fields'
import type { RichTextValue } from '@/lib/payload/fields'
import type {
  LearnerSupportViewModel,
  WordBrowseTopicViewModel,
  WordDetailRelatedWordViewModel,
} from '@/features/words/types'

export type GrammarBrowseSearchParams = Record<
  string,
  string | string[] | undefined
>

export interface GrammarBrowseFilters {
  level?: CefrLevel
  page: number
  topic?: string
}

export interface GrammarBrowseRepositoryFilters {
  cefrLevel?: CefrLevel
  page: number
  topicId?: number
}

/**
 * A compact reference to a grammar topic, used wherever another page links into
 * grammar without needing the full document.
 */
export interface GrammarLinkViewModel {
  cefrLevel: CefrLevel
  name: string
  slug: string
}

export interface GrammarBrowseCardViewModel {
  cefrLevel: CefrLevel
  name: string
  shortRule: string
  slug: string
  support: LearnerSupportViewModel
  topics: WordBrowseTopicViewModel[]
}

export interface GrammarDetailLanguageViewModel {
  commonMistakes: string[]
  explanation: RichTextValue | null
}

export interface GrammarDetailExampleViewModel {
  germanSentence: string
  support: LearnerSupportViewModel
}

export interface GrammarDetailPageViewModel {
  cefrLevel: CefrLevel
  examples: GrammarDetailExampleViewModel[]
  name: string
  relatedWords: WordDetailRelatedWordViewModel[]
  shortRule: string
  slug: string
  support: {
    bangla: GrammarDetailLanguageViewModel | null
    english: GrammarDetailLanguageViewModel
  }
  topics: WordBrowseTopicViewModel[]
}

export interface GrammarBrowsePaginationViewModel {
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

export interface GrammarBrowsePageViewModel {
  filters: GrammarBrowseFilters
  options: {
    levels: readonly CefrLevel[]
    topics: WordBrowseTopicViewModel[]
  }
  pagination: GrammarBrowsePaginationViewModel
  topics: GrammarBrowseCardViewModel[]
}

export type GrammarBrowseCanonicalQuery = Partial<
  Record<'level' | 'page' | 'topic', string>
>

export type GrammarBrowseResult =
  | { kind: 'page'; page: GrammarBrowsePageViewModel }
  | { kind: 'redirect'; query: GrammarBrowseCanonicalQuery }
