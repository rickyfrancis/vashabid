import type { Word } from '@payload-types'
import type { CefrLevel } from '@/lib/payload/fields'
import type { WordType } from './constants'

export interface LearnerSupportViewModel {
  bangla: string | null
  english: string
}

export interface HomeWordViewModel {
  cefrLevel: Word['cefrLevel']
  lemma: string
  slug: string
  support: LearnerSupportViewModel
  wordType: Word['wordType']
}

export type WordBrowseSearchParams = Record<
  string,
  string | string[] | undefined
>

export interface WordBrowseFilters {
  level?: CefrLevel
  page: number
  topic?: string
  type?: WordType
}

export interface WordBrowseRepositoryFilters {
  cefrLevel?: CefrLevel
  page: number
  topicId?: number
  wordType?: WordType
}

export interface WordBrowseTopicViewModel {
  name: string
  slug: string
}

export interface WordBrowseCardViewModel {
  article: 'das' | 'der' | 'die' | null
  cefrLevel: CefrLevel
  headword: string
  slug: string
  support: LearnerSupportViewModel
  topics: WordBrowseTopicViewModel[]
  wordType: WordType
}

export interface WordDetailLanguageViewModel {
  commonMistakes: string[]
  explanation: string | null
  meanings: string[]
}

export interface WordDetailBanglaViewModel
  extends WordDetailLanguageViewModel {
  pronunciationHints: string[]
}

/**
 * Reverse link into the grammar feature: the published patterns that name this
 * word as an example.
 */
export interface WordDetailGrammarViewModel {
  cefrLevel: CefrLevel
  name: string
  slug: string
}

export interface WordDetailExampleViewModel {
  germanSentence: string
  support: LearnerSupportViewModel
}

export interface WordDetailRelatedWordViewModel {
  article: 'das' | 'der' | 'die' | null
  cefrLevel: CefrLevel
  headword: string
  slug: string
  support: LearnerSupportViewModel
  wordType: WordType
}

export interface WordDetailPageViewModel {
  article: 'das' | 'der' | 'die' | null
  audioAvailable: false
  cefrLevel: CefrLevel
  examples: WordDetailExampleViewModel[]
  grammar: WordDetailGrammarViewModel[]
  headword: string
  ipa: string | null
  lemma: string
  noun: {
    gender: 'das' | 'der' | 'die' | null
    pluralForm: string | null
  } | null
  register: Word['register']
  relatedWords: WordDetailRelatedWordViewModel[]
  slug: string
  support: {
    bangla: WordDetailBanglaViewModel | null
    english: WordDetailLanguageViewModel
  }
  topics: WordBrowseTopicViewModel[]
  usefulnessScore: number
  wordType: WordType
}

export interface WordBrowsePaginationViewModel {
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

export interface WordBrowsePageViewModel {
  filters: WordBrowseFilters
  options: {
    levels: readonly CefrLevel[]
    topics: WordBrowseTopicViewModel[]
    wordTypes: readonly WordType[]
  }
  pagination: WordBrowsePaginationViewModel
  words: WordBrowseCardViewModel[]
}

export type WordBrowseCanonicalQuery = Partial<
  Record<'level' | 'page' | 'topic' | 'type', string>
>

export type WordBrowseResult =
  | { kind: 'page'; page: WordBrowsePageViewModel }
  | { kind: 'redirect'; query: WordBrowseCanonicalQuery }
