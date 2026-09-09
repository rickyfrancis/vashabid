import type { Word } from '@payload-types'

import { WordRepository } from '@/features/words/repository'
import { splitGermanHeadword } from '@/features/words/service'
import { generateGermanAlternatives } from '@/lib/german'
import { cleanRows, cleanText } from '@/lib/content'
import { MAX_PHRASE_TOKENS, type TranslationDirection } from './constants'
import type {
  TranslationMatch,
  TranslationOutcome,
  TranslationRequest,
  TranslatorProvider,
} from './provider'
import {
  generateInflectionCandidates,
  phraseFromTokens,
  tokenize,
} from './tokenizer'

/** Which side of a direction the learner is typing in. */
function sourceLanguage(direction: TranslationDirection): 'bn' | 'de' | 'en' {
  if (direction === 'en-de') return 'en'
  if (direction === 'bn-de') return 'bn'
  return 'de'
}

/**
 * The searchable forms of one word for a given input language.
 *
 * Bangla forms are only ever indexed once `review.banglaReviewed` is true, so
 * an unapproved translation cannot be discovered by typing it.
 */
function indexableForms(
  word: Word,
  language: 'bn' | 'de' | 'en',
): string[] {
  if (language === 'de') {
    const { headword } = splitGermanHeadword(word)
    return [word.lemma, word.slug.replaceAll('-', ' '), headword]
  }

  if (language === 'en') {
    return cleanRows(word.english?.meanings, 'meaning')
  }

  if (word.review?.banglaReviewed !== true || !word.bangla) return []

  const romanized = cleanText(word.bangla.romanizedHelper)
  return [
    ...cleanRows(word.bangla.meanings, 'meaning'),
    // The romanized helper is a slash-separated list of aids, not one phrase.
    ...(romanized ? romanized.split('/').map((part) => part.trim()) : []),
  ]
}

interface LemmaIndex {
  /** Longest indexed form, in tokens, so phrase matching knows where to stop. */
  maxPhraseTokens: number
  variants: Map<string, Word>
}

export function buildLemmaIndex(
  words: Word[],
  language: 'bn' | 'de' | 'en',
): LemmaIndex {
  const variants = new Map<string, Word>()
  let maxPhraseTokens = 1

  for (const word of words) {
    for (const form of indexableForms(word, language)) {
      const cleaned = cleanText(form)
      if (!cleaned) continue

      const normalized = cleaned.normalize('NFC').toLocaleLowerCase('de-DE')
      const tokenCount = normalized.split(/\s+/u).filter(Boolean).length
      if (tokenCount === 0 || tokenCount > MAX_PHRASE_TOKENS) continue
      maxPhraseTokens = Math.max(maxPhraseTokens, tokenCount)

      // German spellings expand; English and Bangla are indexed literally.
      const forms =
        language === 'de' ? generateGermanAlternatives(normalized) : [normalized]

      for (const variant of forms) {
        // First writer wins, and words arrive in a deterministic order, so a
        // shared form always resolves to the same word across requests.
        if (!variants.has(variant)) variants.set(variant, word)
      }
    }
  }

  return { maxPhraseTokens, variants }
}

/**
 * Matches learner input against the published vocabulary. It never produces a
 * translated sentence — `translation` is always `null` — which is what keeps
 * the UI from presenting a lookup as real translation.
 */
export class DictionaryTranslatorProvider implements TranslatorProvider {
  readonly id = 'dictionary'

  constructor(
    private readonly wordRepository: Pick<
      WordRepository,
      'findAllPublishedActive'
    > = new WordRepository(),
  ) {}

  supports(): boolean {
    // Every direction degrades to the same word-by-word view.
    return true
  }

  async translate(request: TranslationRequest): Promise<TranslationOutcome> {
    const language = sourceLanguage(request.direction)
    const tokens = tokenize(request.text)

    if (tokens.length === 0) {
      return {
        kind: 'dictionary',
        matches: [],
        providerId: this.id,
        translation: null,
      }
    }

    const words = await this.wordRepository.findAllPublishedActive()
    const index = buildLemmaIndex(words, language)
    const matches: TranslationMatch[] = []

    let position = 0
    while (position < tokens.length) {
      const longest = Math.min(
        index.maxPhraseTokens,
        tokens.length - position,
      )
      let matched: TranslationMatch | null = null

      // Longest phrase first, so `das Brot` wins over a bare `Brot`.
      for (let size = longest; size >= 1 && !matched; size -= 1) {
        const end = position + size
        const phrase = phraseFromTokens(tokens, position, end)
        const word = index.variants.get(phrase)

        if (word) {
          matched = {
            end: tokens[end - 1].end,
            matchedText: request.text.slice(
              tokens[position].start,
              tokens[end - 1].end,
            ),
            precision: 'exact',
            slug: word.slug,
            start: tokens[position].start,
          }
          position = end
        }
      }

      // Only a single token is ever folded; a phrase that failed exactly is
      // not worth guessing at.
      if (!matched) {
        const token = tokens[position]
        const candidate = generateInflectionCandidates(token.normalized)
          .flatMap((value) => generateGermanAlternatives(value))
          .find((value) => index.variants.has(value))
        const word = candidate ? index.variants.get(candidate) : undefined

        if (word && language === 'de') {
          matched = {
            end: token.end,
            matchedText: token.raw,
            precision: 'inflected',
            slug: word.slug,
            start: token.start,
          }
        }
        position += 1
      }

      if (matched) matches.push(matched)
    }

    return {
      kind: 'dictionary',
      matches,
      providerId: this.id,
      translation: null,
    }
  }
}
