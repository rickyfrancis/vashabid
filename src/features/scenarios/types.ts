import type { CefrLevel } from '@/lib/payload/fields'
import type { RichTextValue } from '@/lib/payload/fields'
import type {
  LearnerSupportViewModel,
  WordBrowseTopicViewModel,
  WordDetailRelatedWordViewModel,
} from '@/features/words/types'
import type { GrammarLinkViewModel } from '@/features/grammar/types'
import type { SituationType } from './constants'

export type ScenarioBrowseSearchParams = Record<
  string,
  string | string[] | undefined
>

export interface ScenarioBrowseFilters {
  level?: CefrLevel
  page: number
  situation?: SituationType
  topic?: string
}

export interface ScenarioBrowseRepositoryFilters {
  cefrLevel?: CefrLevel
  page: number
  situationType?: SituationType
  topicId?: number
}

/**
 * A compact reference to a scenario, used wherever another page links into
 * scenarios without needing the full document.
 */
export interface ScenarioLinkViewModel {
  cefrLevel: CefrLevel
  situationType: SituationType
  slug: string
  title: string
}

export interface ScenarioBrowseCardViewModel {
  cefrLevel: CefrLevel
  learnerGoal: string
  situationType: SituationType
  slug: string
  support: LearnerSupportViewModel
  title: string
  topics: WordBrowseTopicViewModel[]
}

export interface ScenarioDetailLanguageViewModel {
  culturalNotes: string[]
  explanation: RichTextValue | null
}

export interface ScenarioDetailLineViewModel {
  germanLine: string
  speaker: string
  support: LearnerSupportViewModel
}

export interface ScenarioDetailPageViewModel {
  cefrLevel: CefrLevel
  dialogue: ScenarioDetailLineViewModel[]
  grammarTopics: GrammarLinkViewModel[]
  keyVocabulary: WordDetailRelatedWordViewModel[]
  learnerGoal: string
  situationType: SituationType
  slug: string
  support: {
    bangla: ScenarioDetailLanguageViewModel | null
    english: ScenarioDetailLanguageViewModel
  }
  title: string
  topics: WordBrowseTopicViewModel[]
}

export interface ScenarioBrowsePaginationViewModel {
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

export interface ScenarioBrowsePageViewModel {
  filters: ScenarioBrowseFilters
  options: {
    levels: readonly CefrLevel[]
    situations: readonly SituationType[]
    topics: WordBrowseTopicViewModel[]
  }
  pagination: ScenarioBrowsePaginationViewModel
  scenarios: ScenarioBrowseCardViewModel[]
}

export type ScenarioBrowseCanonicalQuery = Partial<
  Record<'level' | 'page' | 'situation' | 'topic', string>
>

export type ScenarioBrowseResult =
  | { kind: 'page'; page: ScenarioBrowsePageViewModel }
  | { kind: 'redirect'; query: ScenarioBrowseCanonicalQuery }
