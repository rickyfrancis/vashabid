import { describe, expect, test } from 'vitest'

import { cleanRows, cleanText, firstRow } from './text'

describe('cleanText', () => {
  test.each([
    ['  der Termin  ', 'der Termin'],
    ['', null],
    ['   ', null],
    [null, null],
    [undefined, null],
  ])('normalizes %o', (value, expected) => {
    expect(cleanText(value)).toBe(expected)
  })
})

describe('cleanRows', () => {
  test('keeps only non-empty trimmed values', () => {
    expect(
      cleanRows(
        [
          { meaning: ' appointment ' },
          { meaning: '   ' },
          { meaning: null },
          { meaning: 'date' },
        ],
        'meaning',
      ),
    ).toEqual(['appointment', 'date'])
  })

  test.each([null, undefined])('returns an empty array for %s', (rows) => {
    expect(cleanRows(rows, 'meaning')).toEqual([])
  })
})

describe('firstRow', () => {
  test('skips blank rows to find the first usable value', () => {
    expect(
      firstRow([{ meaning: '  ' }, { meaning: ' appointment ' }], 'meaning'),
    ).toBe('appointment')
  })

  test.each([null, undefined, []])('returns null for %o', (rows) => {
    expect(firstRow(rows, 'meaning')).toBeNull()
  })
})
