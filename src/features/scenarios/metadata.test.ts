import { describe, expect, test, vi } from 'vitest'

import { richTextParagraphs } from '@/lib/payload/fields'
import { createScenarioDetailMetadata } from './metadata'
import type { ScenarioDetailPageViewModel } from './types'

const scenario = (
  overrides: Partial<ScenarioDetailPageViewModel> = {},
): ScenarioDetailPageViewModel => ({
  cefrLevel: 'A1',
  dialogue: [],
  grammarTopics: [],
  keyVocabulary: [],
  learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
  situationType: 'everyday',
  slug: 'im-cafe-bestellen',
  support: {
    bangla: {
      culturalNotes: [],
      explanation: richTextParagraphs('বাংলা ব্যাখ্যা।'),
    },
    english: {
      culturalNotes: [],
      explanation: richTextParagraphs('Greet, then order politely.'),
    },
  },
  title: 'Im Café bestellen',
  topics: [],
  ...overrides,
})

const translate = vi.fn(
  (key: string, values: { scenario: string; summary: string }) =>
    `${key}:${values.scenario}:${values.summary}`,
)

describe('createScenarioDetailMetadata', () => {
  test('prefers English on the English route', () => {
    const metadata = createScenarioDetailMetadata(
      scenario(),
      'en',
      translate as never,
    )

    expect(metadata.title).toContain('Greet, then order politely.')
    expect(metadata.description).toContain('Im Café bestellen')
  })

  test('prefers approved Bangla on the Bangla route', () => {
    expect(
      createScenarioDetailMetadata(scenario(), 'bn', translate as never).title,
    ).toContain('বাংলা ব্যাখ্যা।')
  })

  test('falls back to English when Bangla is withheld', () => {
    const withheld = scenario({
      support: {
        bangla: null,
        english: {
          culturalNotes: [],
          explanation: richTextParagraphs('Greet, then order politely.'),
        },
      },
    })

    expect(
      createScenarioDetailMetadata(withheld, 'bn', translate as never).title,
    ).toContain('Greet, then order politely.')
  })

  test('falls back to the learner goal when no explanation survives', () => {
    const bare = scenario({
      support: {
        bangla: null,
        english: { culturalNotes: [], explanation: null },
      },
    })

    expect(
      createScenarioDetailMetadata(bare, 'en', translate as never).title,
    ).toContain('Ich kann ein Getränk höflich bestellen.')
  })

  test('clips a long summary on a word boundary with an ellipsis', () => {
    const long = scenario({
      support: {
        bangla: null,
        english: {
          culturalNotes: [],
          explanation: richTextParagraphs(
            'Ordering politely in a German cafe requires a greeting first and then a request phrased with the subjunctive form so the exchange stays courteous throughout the whole conversation.',
          ),
        },
      },
    })

    const title = createScenarioDetailMetadata(
      long,
      'en',
      translate as never,
    ).title as string
    const summary = title.split(':').slice(2).join(':')

    expect(summary.endsWith('…')).toBe(true)
    expect(summary.length).toBeLessThanOrEqual(151)
    expect(summary).not.toContain('  ')
  })
})
