import { describe, expect, test } from 'vitest'

import { MAX_TRANSLATE_INPUT } from './constants'
import {
  normalizeTranslateParams,
  splitDirection,
  toTranslateQuery,
} from './normalization'

describe('splitDirection', () => {
  test.each([
    ['de-en', { from: 'de', to: 'en' }],
    ['de-both', { from: 'de', to: 'both' }],
    ['bn-de', { from: 'bn', to: 'de' }],
  ] as const)('splits %s into its selector values', (direction, expected) => {
    expect(splitDirection(direction)).toEqual(expected)
  })
})

describe('toTranslateQuery', () => {
  test('omits the direction when it is the default', () => {
    expect(toTranslateQuery('Brot', 'de-en')).toEqual({ text: 'Brot' })
  })

  test('carries a non-default direction', () => {
    expect(toTranslateQuery('Brot', 'de-bn')).toEqual({
      from: 'de',
      text: 'Brot',
      to: 'bn',
    })
  })

  test('collapses empty text to the bare route', () => {
    expect(toTranslateQuery('', 'de-bn')).toEqual({})
  })
})

describe('normalizeTranslateParams', () => {
  test('accepts the canonical contract', () => {
    expect(normalizeTranslateParams({ text: 'Das Brot' })).toEqual({
      direction: 'de-en',
      isCanonical: true,
      isTooLong: false,
      text: 'Das Brot',
    })
    expect(
      normalizeTranslateParams({ from: 'bn', text: 'খাওয়া', to: 'de' }),
    ).toMatchObject({ direction: 'bn-de', isCanonical: true })
  })

  test('defaults to German to English with no params', () => {
    expect(normalizeTranslateParams({})).toEqual({
      direction: 'de-en',
      isCanonical: true,
      isTooLong: false,
      text: '',
    })
  })

  test.each([
    { text: ' Brot ' },
    { text: ['Brot', 'Käse'] },
    { text: 'Brot', from: 'de', to: 'en' },
    { text: 'Brot', from: 'de' },
    { text: 'Brot', to: 'en' },
    { text: 'Brot', from: 'fr', to: 'de' },
    { text: 'Brot', from: 'de', to: 'fr' },
    { text: 'Brot', from: 'en', to: 'bn' },
    { text: 'Brot', extra: 'value' },
    { from: 'de', to: 'bn' },
  ])('marks malformed state as non-canonical: %o', (params) => {
    expect(normalizeTranslateParams(params).isCanonical).toBe(false)
  })

  test('keeps a valid direction while redirecting away from padded text', () => {
    expect(
      normalizeTranslateParams({ from: 'de', text: '  Brot  ', to: 'bn' }),
    ).toEqual({
      direction: 'de-bn',
      isCanonical: false,
      isTooLong: false,
      text: 'Brot',
    })
  })

  test('falls back to the default direction when the pair is unsupported', () => {
    expect(
      normalizeTranslateParams({ from: 'en', text: 'bread', to: 'bn' }),
    ).toMatchObject({ direction: 'de-en', isCanonical: false })
  })

  test('flags over-length input without truncating or redirecting', () => {
    const text = 'a'.repeat(MAX_TRANSLATE_INPUT + 1)

    expect(normalizeTranslateParams({ text })).toEqual({
      direction: 'de-en',
      isCanonical: true,
      isTooLong: true,
      text,
    })
  })

  test('accepts input exactly at the limit', () => {
    const text = 'a'.repeat(MAX_TRANSLATE_INPUT)

    expect(normalizeTranslateParams({ text })).toMatchObject({
      isCanonical: true,
      isTooLong: false,
    })
  })

  test('collapses newlines from a pasted passage', () => {
    expect(normalizeTranslateParams({ text: 'Ich esse\nBrot' })).toMatchObject({
      isCanonical: false,
      text: 'Ich esse Brot',
    })
  })
})
