import { describe, expect, test, vi } from 'vitest'

import { richTextParagraphs } from '@/lib/payload/fields'
import { createGrammarDetailMetadata } from './metadata'
import type { GrammarDetailPageViewModel } from './types'

const topic = (
  overrides: Partial<GrammarDetailPageViewModel> = {},
): GrammarDetailPageViewModel => ({
  cefrLevel: 'A2',
  examples: [],
  name: 'Perfekt mit haben und sein',
  relatedWords: [],
  shortRule: 'Perfekt mit haben oder sein.',
  slug: 'perfekt-mit-haben-und-sein',
  support: {
    bangla: {
      commonMistakes: [],
      explanation: richTextParagraphs('বাংলা ব্যাখ্যা।'),
    },
    english: {
      commonMistakes: [],
      explanation: richTextParagraphs('The Perfekt combines haben or sein.'),
    },
  },
  topics: [],
  ...overrides,
})

const translate = vi.fn(
  (key: string, values: { summary: string; topic: string }) =>
    `${key}:${values.topic}:${values.summary}`,
)

describe('createGrammarDetailMetadata', () => {
  test('uses the English explanation for the English locale', () => {
    expect(createGrammarDetailMetadata(topic(), 'en', translate)).toEqual({
      description:
        'metadataDescription:Perfekt mit haben und sein:The Perfekt combines haben or sein.',
      title:
        'metadataTitle:Perfekt mit haben und sein:The Perfekt combines haben or sein.',
    })
  })

  test('prefers approved Bangla for the Bangla locale', () => {
    expect(
      createGrammarDetailMetadata(topic(), 'bn', translate).title,
    ).toContain('বাংলা ব্যাখ্যা।')
  })

  test('falls back to English when Bangla is unavailable', () => {
    expect(
      createGrammarDetailMetadata(
        topic({
          support: {
            bangla: null,
            english: {
              commonMistakes: [],
              explanation: richTextParagraphs('English only.'),
            },
          },
        }),
        'bn',
        translate,
      ).title,
    ).toContain('English only.')
  })

  test('falls back to the German short rule when no explanation renders', () => {
    expect(
      createGrammarDetailMetadata(
        topic({
          support: {
            bangla: null,
            english: { commonMistakes: [], explanation: null },
          },
        }),
        'en',
        translate,
      ).title,
    ).toContain('Perfekt mit haben oder sein.')
  })

  test('clips a long summary on a word boundary', () => {
    const result = createGrammarDetailMetadata(
      topic({
        support: {
          bangla: null,
          english: {
            commonMistakes: [],
            explanation: richTextParagraphs('lang '.repeat(80).trim()),
          },
        },
      }),
      'en',
      translate,
    )

    expect(result.title).toContain('…')
  })
})
