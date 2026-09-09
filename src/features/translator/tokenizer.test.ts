import { describe, expect, test } from 'vitest'

import {
  generateInflectionCandidates,
  phraseFromTokens,
  tokenize,
} from './tokenizer'

describe('tokenize', () => {
  test('records offsets that slice the original text back out', () => {
    const text = 'Das Brot ist frisch.'
    const tokens = tokenize(text)

    expect(tokens.map((token) => token.raw)).toEqual([
      'Das',
      'Brot',
      'ist',
      'frisch',
    ])
    for (const token of tokens) {
      expect(text.slice(token.start, token.end)).toBe(token.raw)
    }
  })

  test('excludes trailing punctuation from the token itself', () => {
    // Search never strips punctuation, so 'Termin.' would otherwise never
    // reach the lemma 'der Termin'.
    const tokens = tokenize('Ich habe morgen einen Termin.')

    expect(tokens.at(-1)).toMatchObject({ normalized: 'termin', raw: 'Termin' })
  })

  test.each([
    ['Wir essen zusammen!', ['Wir', 'essen', 'zusammen']],
    ['Brot, Wasser und Käse', ['Brot', 'Wasser', 'und', 'Käse']],
    ['„Guten Tag!"', ['Guten', 'Tag']],
    ['Es kostet 3 Euro.', ['Es', 'kostet', 'Euro']],
  ])('drops punctuation around %s', (text, expected) => {
    expect(tokenize(text).map((token) => token.raw)).toEqual(expected)
  })

  test('keeps hyphenated and apostrophised words whole', () => {
    expect(tokenize("Schwarz-Weiß, geht's").map((t) => t.raw)).toEqual([
      'Schwarz-Weiß',
      "geht's",
    ])
  })

  test('lowercases for matching while preserving the displayed form', () => {
    expect(tokenize('Brot')[0]).toMatchObject({
      normalized: 'brot',
      raw: 'Brot',
    })
  })

  test('attaches German spelling variants to every token', () => {
    expect(tokenize('Käse')[0].variants).toEqual(
      expect.arrayContaining(['käse', 'kaese', 'kase']),
    )
  })

  test('tokenizes Bangla input', () => {
    expect(tokenize('খাওয়া এবং রুটি').map((token) => token.raw)).toEqual([
      'খাওয়া',
      'এবং',
      'রুটি',
    ])
  })

  test('normalizes decomposed Unicode before recording offsets', () => {
    const tokens = tokenize('Mädchen')

    expect(tokens[0].normalized).toBe('mädchen')
    expect(tokens[0].end - tokens[0].start).toBe('mädchen'.length)
  })

  test('returns nothing for empty and punctuation-only input', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   ...  !? ')).toEqual([])
  })
})

describe('phraseFromTokens', () => {
  test('joins a consecutive run into a normalized phrase', () => {
    const tokens = tokenize('Ich habe einen Termin heute')

    expect(phraseFromTokens(tokens, 2, 4)).toBe('einen termin')
    expect(phraseFromTokens(tokens, 0, 1)).toBe('ich')
  })

  test('collapses the original spacing so lemma comparison is stable', () => {
    expect(phraseFromTokens(tokenize('das    Brot'), 0, 2)).toBe('das brot')
  })
})

describe('generateInflectionCandidates', () => {
  test.each([
    ['esse', 'essen'],
    ['isst', 'issen'],
    ['arbeitest', 'arbeiten'],
    ['arbeitet', 'arbeiten'],
    ['lernte', 'lernen'],
    ['machst', 'machen'],
  ])('offers a verb base form for %s', (input, expected) => {
    expect(generateInflectionCandidates(input)).toContain(expected)
  })

  test.each([
    ['Brote', 'brot'],
    ['Termine', 'termin'],
    ['Bahnhöfe', 'bahnhöf'],
    ['Artikeln', 'artikel'],
  ])('offers a noun singular candidate for %s', (input, expected) => {
    expect(generateInflectionCandidates(input)).toContain(expected)
  })

  test('offers adjective base forms', () => {
    expect(generateInflectionCandidates('frisches')).toContain('frisch')
    expect(generateInflectionCandidates('frischem')).toContain('frisch')
  })

  test('never offers the original value back', () => {
    expect(generateInflectionCandidates('essen')).not.toContain('essen')
  })

  test('returns unique candidates', () => {
    const candidates = generateInflectionCandidates('lernte')
    expect(new Set(candidates).size).toBe(candidates.length)
  })

  test('refuses to fold short words down to a stub', () => {
    // Folding 'ist' or 'es' would strand a one or two letter stem that could
    // collide with unrelated lemmas.
    expect(generateInflectionCandidates('es')).toEqual([])
    expect(generateInflectionCandidates('ist')).toEqual([])
  })

  test('leaves non-German input alone', () => {
    expect(generateInflectionCandidates('খাওয়া')).toEqual([])
  })
})
