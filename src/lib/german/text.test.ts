import { describe, expect, test } from 'vitest'

import { cleanUserText, generateGermanAlternatives } from './text'

describe('cleanUserText', () => {
  test('composes Unicode and collapses whitespace while preserving case', () => {
    expect(cleanUserText('  Der\tMädchen  বাংলা  ')).toBe(
      'Der Mädchen বাংলা',
    )
  })

  test('returns an empty string for whitespace-only input', () => {
    expect(cleanUserText('   \t\n  ')).toBe('')
  })

  test('collapses newlines so pasted text stays a single matchable line', () => {
    expect(cleanUserText('Ich esse\nBrot')).toBe('Ich esse Brot')
  })
})

describe('generateGermanAlternatives', () => {
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

  test('always lists the normalized input first', () => {
    expect(generateGermanAlternatives('Brot')[0]).toBe('brot')
  })

  test('caps expansion so long umlaut-heavy input cannot explode', () => {
    expect(
      generateGermanAlternatives('äöüäöüäöü').length,
    ).toBeLessThanOrEqual(24)
  })

  test('leaves text without German equivalences unchanged', () => {
    expect(generateGermanAlternatives('খাওয়া')).toEqual(['খাওয়া'])
  })
})
