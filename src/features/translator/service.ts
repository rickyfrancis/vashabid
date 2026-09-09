import type { Word } from '@payload-types'

import { WordRepository } from '@/features/words/repository'
import { WordService } from '@/features/words/service'
import type { WordDetailRelatedWordViewModel } from '@/features/words/types'
import {
  TRANSLATE_MATCH_LIMIT,
  translationDirections,
  translationSourceLanguages,
  translationTargetLanguages,
  type TranslationDirection,
} from './constants'
import { DictionaryTranslatorProvider } from './dictionary-provider'
import { normalizeTranslateParams, toTranslateQuery } from './normalization'
import type { TranslationMatch, TranslatorProvider } from './provider'
import type {
  TranslatePageViewModel,
  TranslateResult,
  TranslateResultViewModel,
  TranslateSearchParams,
  TranslatedSegment,
} from './types'

const directionOptions = {
  directions: translationDirections,
  sources: translationSourceLanguages,
  targets: translationTargetLanguages,
} as const

function emptyPage(
  direction: TranslationDirection,
  state: 'idle' | 'too-long',
  text: string,
): TranslatePageViewModel {
  return {
    direction,
    options: directionOptions,
    result: null,
    state,
    text,
  }
}

export class TranslatorService {
  constructor(
    private readonly provider: TranslatorProvider =
      new DictionaryTranslatorProvider(),
    private readonly wordRepository: Pick<
      WordRepository,
      'findAllPublishedActive'
    > = new WordRepository(),
    private readonly wordService: Pick<WordService, 'toRelatedWord'> =
      new WordService(),
  ) {}

  /**
   * Stitches provider matches back into the original text as alternating plain
   * and matched spans. The spans reconstruct the input exactly, so nothing the
   * learner typed is lost or duplicated.
   */
  toSegments(
    text: string,
    matches: TranslationMatch[],
    words: Map<string, WordDetailRelatedWordViewModel>,
  ): TranslatedSegment[] {
    const segments: TranslatedSegment[] = []
    let cursor = 0

    for (const match of matches) {
      const word = words.get(match.slug)
      // A word that failed to map is not renderable; leave its text plain.
      if (!word || match.start < cursor) continue

      if (match.start > cursor) {
        segments.push({ kind: 'text', text: text.slice(cursor, match.start) })
      }

      segments.push({
        kind: 'match',
        precision: match.precision,
        text: text.slice(match.start, match.end),
        word,
      })
      cursor = match.end
    }

    if (cursor < text.length) {
      segments.push({ kind: 'text', text: text.slice(cursor) })
    }

    return segments
  }

  async getPage(params: TranslateSearchParams): Promise<TranslateResult> {
    const normalized = normalizeTranslateParams(params)

    if (!normalized.isCanonical) {
      return {
        kind: 'redirect',
        query: toTranslateQuery(normalized.text, normalized.direction),
      }
    }

    if (!normalized.text) {
      return {
        kind: 'page',
        page: emptyPage(normalized.direction, 'idle', ''),
      }
    }

    // Refuse rather than silently truncate: a learner who pasted a long
    // passage should be told, not handed a partial reading of it.
    if (normalized.isTooLong) {
      return {
        kind: 'page',
        page: emptyPage(normalized.direction, 'too-long', normalized.text),
      }
    }

    const outcome = await this.provider.translate({
      direction: normalized.direction,
      text: normalized.text,
    })

    // Hydrate only the words that actually matched, through the words feature's
    // own mapper, so editorial metadata and pending Bangla stay server-side.
    const matchedSlugs = new Set(outcome.matches.map((match) => match.slug))
    const words = new Map<string, WordDetailRelatedWordViewModel>()

    if (matchedSlugs.size > 0) {
      const documents = await this.wordRepository.findAllPublishedActive()
      for (const document of documents as Word[]) {
        if (!matchedSlugs.has(document.slug)) continue

        const viewModel = this.wordService.toRelatedWord(document)
        if (viewModel) words.set(document.slug, viewModel)
      }
    }

    const segments = this.toSegments(normalized.text, outcome.matches, words)
    const seen = new Set<string>()
    const matches: WordDetailRelatedWordViewModel[] = []

    for (const segment of segments) {
      if (segment.kind !== 'match' || seen.has(segment.word.slug)) continue
      seen.add(segment.word.slug)
      if (matches.length < TRANSLATE_MATCH_LIMIT) matches.push(segment.word)
    }

    const result: TranslateResultViewModel = {
      isDictionaryAssisted: outcome.kind === 'dictionary',
      matches,
      segments,
      translation: outcome.kind === 'dictionary' ? null : outcome.translation,
    }

    return {
      kind: 'page',
      page: {
        direction: normalized.direction,
        options: directionOptions,
        result,
        state: 'results',
        text: normalized.text,
      },
    }
  }
}
