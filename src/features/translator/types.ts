import type { WordDetailRelatedWordViewModel } from '@/features/words/types'
import type {
  TranslationDirection,
  TranslationSourceLanguage,
  TranslationTargetLanguage,
} from './constants'

export type TranslateSearchParams = Record<
  string,
  string | string[] | undefined
>

export interface TranslateFilters {
  direction: TranslationDirection
  text: string
}

export type TranslateCanonicalQuery = Partial<
  Record<'from' | 'text' | 'to', string>
>

export interface NormalizedTranslateParams {
  direction: TranslationDirection
  isCanonical: boolean
  /** Set when the submitted text exceeded `MAX_TRANSLATE_INPUT`. */
  isTooLong: boolean
  text: string
}

/** A tokenizer token: one word-like run of the input, with its offsets. */
export interface InputToken {
  end: number
  normalized: string
  raw: string
  start: number
  variants: string[]
}

/**
 * The input text split into consecutive spans that together reconstruct it
 * exactly. Matched spans carry the word they resolved to.
 */
export type TranslatedSegment =
  | { kind: 'text'; text: string }
  | {
      kind: 'match'
      precision: 'exact' | 'inflected'
      text: string
      word: WordDetailRelatedWordViewModel
    }

export interface TranslateResultViewModel {
  /** Distinct known words, in first-appearance order, for the chip list. */
  matches: WordDetailRelatedWordViewModel[]
  /** True when output came from dictionary lookup rather than a real engine. */
  isDictionaryAssisted: boolean
  segments: TranslatedSegment[]
  /** Non-null only when a real translation engine produced a sentence. */
  translation: string | null
}

export interface TranslatePageViewModel {
  direction: TranslationDirection
  options: {
    directions: readonly TranslationDirection[]
    sources: readonly TranslationSourceLanguage[]
    targets: readonly TranslationTargetLanguage[]
  }
  result: TranslateResultViewModel | null
  /** `too-long` means the input exceeded the cap and was not translated. */
  state: 'idle' | 'results' | 'too-long'
  text: string
}

export type TranslateResult =
  | { kind: 'page'; page: TranslatePageViewModel }
  | { kind: 'redirect'; query: TranslateCanonicalQuery }
