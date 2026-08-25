import { describe, expect, test } from 'vitest'

import {
  buildDuplicateWordsQuery,
  findDuplicateWords,
  getLocalizedWordPreviewLinks,
  getWordPreviewGuidance,
  normalizeWordLemma,
} from './word-admin-utils'

describe('word admin workflow utilities', () => {
  test('normalizes German lemma casing and whitespace', () => {
    expect(normalizeWordLemma('  Der   TERMIN\n')).toBe('der termin')
    expect(normalizeWordLemma(null)).toBe('')
  })

  test('builds an authenticated collection query across all workflow states', () => {
    const url = new URL(
      buildDuplicateWordsQuery(' der Termin ', 'noun', 7),
      'https://vashabid.test',
    )

    expect(url.pathname).toBe('/api/words')
    expect(url.searchParams.get('draft')).toBe('true')
    expect(url.searchParams.get('depth')).toBe('0')
    expect(url.searchParams.get('limit')).toBe('25')
    expect(url.searchParams.get('where[and][0][lemma][contains]')).toBe(
      'der Termin',
    )
    expect(url.searchParams.get('where[and][1][wordType][equals]')).toBe(
      'noun',
    )
    expect(url.searchParams.get('where[and][2][id][not_equals]')).toBe('7')
  })

  test('finds normalized duplicates in draft and archived records and excludes itself', () => {
    const candidates = [
      {
        _status: 'published',
        id: 7,
        lemma: 'der Termin',
        lifecycleStatus: 'active',
        wordType: 'noun',
      },
      {
        _status: 'draft',
        id: 8,
        lemma: ' DER   termin ',
        lifecycleStatus: 'archived',
        wordType: 'noun',
      },
      { id: 9, lemma: 'der Termin', wordType: 'verb' },
      { id: 10, lemma: 'Termin', wordType: 'noun' },
    ]

    expect(findDuplicateWords(candidates, 'der termin', 'noun', 7)).toEqual([
      candidates[1],
    ])
  })

  test('generates localized links only for a saved active published word', () => {
    expect(
      getLocalizedWordPreviewLinks({
        _status: 'published',
        lifecycleStatus: 'active',
        slug: 'der termin',
      }),
    ).toEqual([
      {
        label: 'English preview',
        locale: 'en',
        url: '/en/words/der%20termin',
      },
      {
        label: 'বাংলা preview',
        locale: 'bn',
        url: '/bn/words/der%20termin',
      },
    ])
    expect(
      getLocalizedWordPreviewLinks({
        _status: 'draft',
        lifecycleStatus: 'active',
        slug: 'der-termin',
      }),
    ).toEqual([])
    expect(
      getLocalizedWordPreviewLinks({
        _status: 'published',
        lifecycleStatus: 'archived',
        slug: 'der-termin',
      }),
    ).toEqual([])
  })

  test('explains each preview blocker in corrective order', () => {
    expect(getWordPreviewGuidance({})).toContain('Save the word')
    expect(
      getWordPreviewGuidance({
        _status: 'published',
        lifecycleStatus: 'archived',
        slug: 'der-termin',
      }),
    ).toContain('Active')
    expect(
      getWordPreviewGuidance({
        _status: 'draft',
        lifecycleStatus: 'active',
        slug: 'der-termin',
      }),
    ).toContain('Publish')
  })
})
