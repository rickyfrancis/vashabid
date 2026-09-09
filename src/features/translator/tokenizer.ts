import { generateGermanAlternatives } from '@/lib/german'
import type { InputToken } from './types'

/**
 * Word-like runs, so punctuation and whitespace are excluded from tokens but
 * their offsets survive. `\p{L}` covers German, English, and Bangla letters;
 * the inner apostrophe and hyphen keep forms like `geht's` and `Schwarz-Weiß`
 * whole.
 */
const TOKEN_PATTERN = /\p{L}[\p{L}\p{M}\d]*(?:['’-][\p{L}\p{M}\d]+)*/gu

/**
 * Conservative German suffix folding.
 *
 * Each entry strips a suffix and optionally appends a replacement, producing a
 * candidate base form. A candidate is only ever *offered*; the caller accepts it
 * exclusively when it lands on a lemma that actually exists, so folding can
 * narrow a search but never invent a word.
 *
 * Ordered longest-suffix-first so `arbeitest` tries `-est` before `-st`.
 */
const inflectionRules: readonly { append: string; suffix: string }[] = [
  // Verb present tense and infinitive-adjacent forms.
  { append: 'en', suffix: 'est' },
  { append: 'en', suffix: 'et' },
  { append: 'en', suffix: 'st' },
  { append: 'en', suffix: 'te' },
  { append: 'en', suffix: 'e' },
  // -eln/-ern verbs: `wandere` folds to `wandern`, not `wanderen`.
  { append: 'n', suffix: 'e' },
  { append: 'en', suffix: 't' },
  // Noun plurals.
  { append: '', suffix: 'en' },
  { append: '', suffix: 'er' },
  { append: '', suffix: 'e' },
  { append: '', suffix: 's' },
  { append: '', suffix: 'n' },
  // Adjective declensions.
  { append: '', suffix: 'es' },
  { append: '', suffix: 'em' },
  { append: '', suffix: 'er' },
]

/** German inflection only applies to Latin-script words. */
const LATIN_WORD = /^[\p{Script=Latin}\p{M}]+$/u

/**
 * Every base form worth trying for a token that did not match directly.
 * Deduplicated, never including the original value.
 */
export function generateInflectionCandidates(value: string): string[] {
  const normalized = value.normalize('NFC').toLocaleLowerCase('de-DE')
  if (!LATIN_WORD.test(normalized)) return []

  const candidates = new Set<string>()

  for (const { append, suffix } of inflectionRules) {
    if (suffix && !normalized.endsWith(suffix)) continue

    const stem = suffix ? normalized.slice(0, -suffix.length) : normalized
    // Keep a real stem; folding away to one or two letters only creates noise.
    if (stem.length < 3) continue

    const candidate = stem + append
    if (candidate !== normalized) candidates.add(candidate)
  }

  return [...candidates]
}

/**
 * Splits input into word tokens while recording where each one sat, so the
 * original sentence — punctuation, spacing, and casing intact — can be rebuilt
 * around the matches.
 */
export function tokenize(text: string): InputToken[] {
  const source = text.normalize('NFC')
  const tokens: InputToken[] = []

  for (const match of source.matchAll(TOKEN_PATTERN)) {
    const raw = match[0]
    const start = match.index
    tokens.push({
      end: start + raw.length,
      normalized: raw.toLocaleLowerCase('de-DE'),
      raw,
      start,
      variants: generateGermanAlternatives(raw),
    })
  }

  return tokens
}

/**
 * The consecutive token run `[start, end)` as it appears in the source,
 * normalized for matching. Used to test multi-word lemmas such as `der Termin`.
 */
export function phraseFromTokens(
  tokens: InputToken[],
  start: number,
  end: number,
): string {
  return tokens
    .slice(start, end)
    .map((token) => token.normalized)
    .join(' ')
}
