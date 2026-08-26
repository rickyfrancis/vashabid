import { describe, expect, test } from 'vitest'

import {
  cleanSearchQuery,
  generateGermanAlternatives,
  normalizeSearchParams,
  normalizeSearchQuery,
  toSearchQuery,
} from './normalization'

describe('search query normalization', () => {
  test('normalizes Unicode and whitespace while preserving display case', () => {
    expect(cleanSearchQuery('  Der\tMa\u0308dchen  বাংলা  ')).toBe(
      'Der Mädchen বাংলা',
    )
    expect(normalizeSearchQuery('  Der\tMa\u0308dchen  ')).toMatchObject({
      displayQuery: 'Der Mädchen',
      tokens: [{ variants: expect.arrayContaining(['mädchen']) }],
    })
  })

  test.each(['mädchen', 'madchen', 'maedchen'])(
    'generates all simple umlaut spellings from %s',
    (value) => {
      expect(generateGermanAlternatives(value)).toEqual(
        expect.arrayContaining(['mädchen', 'madchen', 'maedchen']),
      )
    },
  )

  test('treats sharp-s and double-s as equivalent without duplicate variants', () => {
    const variants = generateGermanAlternatives('Straße')
    expect(variants).toEqual(expect.arrayContaining(['straße', 'strasse']))
    expect(new Set(variants).size).toBe(variants.length)
    expect(variants.length).toBeLessThanOrEqual(24)
  })

  test('strips only a leading German article from matching tokens', () => {
    expect(normalizeSearchQuery('die Bahnhof').tokens).toHaveLength(1)
    expect(normalizeSearchQuery('die Bahnhof').tokens[0].variants).toContain(
      'bahnhof',
    )
    expect(normalizeSearchQuery('die').tokens[0].variants).toContain('die')
  })

  test('recognizes compound CEFR and English word-type searches', () => {
    const result = normalizeSearchQuery('A1 verbs')
    expect(result.tokens[0]).toMatchObject({ cefrLevel: 'A1' })
    expect(result.tokens[1]).toMatchObject({ wordType: 'verb' })
  })

  test.each([
    ['বিশেষ্য', 'noun'],
    ['পদান্বয়ী অব্যয়', 'preposition'],
    ['সংযোজক অব্যয়', 'conjunction'],
  ] as const)('recognizes the Bangla word type %s', (query, wordType) => {
    expect(normalizeSearchQuery(query).tokens).toMatchObject([{ wordType }])
  })
})

describe('search URL normalization', () => {
  test('accepts the canonical q and page contract', () => {
    expect(normalizeSearchParams({ q: 'Bahnhof', page: '2' })).toEqual({
      isCanonical: true,
      page: 2,
      query: 'Bahnhof',
    })
    expect(toSearchQuery('Bahnhof', 2)).toEqual({
      q: 'Bahnhof',
      page: '2',
    })
    expect(normalizeSearchParams({ q: 'Bahnhof', page: '12' }).page).toBe(12)
  })

  test.each([
    { q: ' Bahnhof ' },
    { q: ['Bahnhof', 'Termin'] },
    { q: 'Bahnhof', page: '1' },
    { q: 'Bahnhof', page: '01' },
    { q: 'Bahnhof', page: ['2', '3'] },
    { q: 'Bahnhof', extra: 'value' },
  ])('marks malformed state as non-canonical: %o', (params) => {
    expect(normalizeSearchParams(params).isCanonical).toBe(false)
  })

  test('collapses empty query state to the route without parameters', () => {
    expect(normalizeSearchParams({ q: '   ', page: '3' })).toEqual({
      isCanonical: false,
      page: 3,
      query: '',
    })
    expect(toSearchQuery('', 3)).toEqual({})
  })
})
