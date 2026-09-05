import { describe, expect, test } from 'vitest'

import {
  isRichTextEmpty,
  richTextParagraphs,
  richTextToPlainText,
  type RichTextValue,
} from './rich-text'

describe('richTextParagraphs', () => {
  test('builds a valid editor state with one block per paragraph', () => {
    const value = richTextParagraphs('Erste Regel.', 'Zweite Regel.')

    expect(value.root.type).toBe('root')
    expect(value.root.version).toBe(1)
    expect(value.root.children).toHaveLength(2)
    expect(value.root.children[0]).toMatchObject({
      type: 'paragraph',
      version: 1,
    })
    expect(value.root.children[0].children?.[0]).toMatchObject({
      text: 'Erste Regel.',
      type: 'text',
      version: 1,
    })
  })

  test('supports an empty document', () => {
    expect(richTextParagraphs().root.children).toEqual([])
  })
})

describe('richTextToPlainText', () => {
  test('joins text across sibling blocks', () => {
    const value = richTextParagraphs('Der Artikel', 'richtet sich nach Genus.')

    expect(richTextToPlainText(value)).toBe(
      'Der Artikel richtet sich nach Genus.',
    )
  })

  test('collects text from arbitrarily nested nodes', () => {
    const value: RichTextValue = {
      root: {
        children: [
          {
            children: [
              {
                children: [
                  { text: 'Nominativ', type: 'text', version: 1 },
                  { text: 'und Akkusativ', type: 'text', version: 1 },
                ],
                type: 'listitem',
                version: 1,
              },
            ],
            type: 'list',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }

    expect(richTextToPlainText(value)).toBe('Nominativ und Akkusativ')
  })

  test('preserves Bangla and German characters', () => {
    expect(richTextToPlainText(richTextParagraphs('কর্তৃকারক, größer'))).toBe(
      'কর্তৃকারক, größer',
    )
  })

  test('collapses whitespace and trims', () => {
    expect(richTextToPlainText(richTextParagraphs('  a \n\n b  '))).toBe('a b')
  })

  test.each([null, undefined])('returns an empty string for %s', (value) => {
    expect(richTextToPlainText(value)).toBe('')
  })

  test('ignores malformed roots and non-string text', () => {
    expect(richTextToPlainText({})).toBe('')
    expect(richTextToPlainText({ root: {} })).toBe('')
    expect(richTextToPlainText({ root: { children: 'nope' } })).toBe('')
    expect(
      richTextToPlainText({
        root: { children: [{ text: 42, type: 'text', version: 1 }, null] },
      }),
    ).toBe('')
  })
})

describe('isRichTextEmpty', () => {
  test.each([
    [null, true],
    [undefined, true],
    [richTextParagraphs(), true],
    [richTextParagraphs(''), true],
    [richTextParagraphs('   '), true],
    [richTextParagraphs('Regel'), false],
  ])('treats %o as empty=%s', (value, expected) => {
    expect(isRichTextEmpty(value)).toBe(expected)
  })
})
