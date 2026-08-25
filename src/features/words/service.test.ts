import type { Word } from '@payload-types'
import { describe, expect, test } from 'vitest'

import { WordService } from './service'

function word(overrides: Partial<Word> = {}): Word {
  return {
    cefrLevel: 'A1',
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { meanings: [{ meaning: 'bread' }] },
    id: 1,
    lemma: 'das Brot',
    lifecycleStatus: 'active',
    register: 'neutral',
    review: { banglaReviewed: true },
    slug: 'das-brot',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usefulnessScore: 4,
    wordType: 'noun',
    ...overrides,
  }
}

describe('WordService', () => {
  const service = new WordService()

  test('maps only home-safe fields and approved Bangla', () => {
    const result = service.toHomeCard(
      word({
        bangla: { meanings: [{ meaning: ' রুটি ' }] },
        source: { attribution: 'must stay server-side' },
      }),
    )

    expect(result).toEqual({
      cefrLevel: 'A1',
      lemma: 'das Brot',
      slug: 'das-brot',
      support: { bangla: 'রুটি', english: 'bread' },
      wordType: 'noun',
    })
    expect(result).not.toHaveProperty('source')
    expect(result).not.toHaveProperty('review')
  })

  test.each([
    { bangla: { meanings: [{ meaning: 'রুটি' }] }, review: { banglaReviewed: false } },
    { bangla: undefined, review: { banglaReviewed: true } },
  ])('never maps missing or unapproved Bangla', (overrides) => {
    expect(service.toHomeCard(word(overrides as Partial<Word>))?.support).toEqual({
      bangla: null,
      english: 'bread',
    })
  })

  test('rejects a malformed document without an English meaning', () => {
    expect(service.toHomeCard(word({ english: { meanings: [] } }))).toBeNull()
  })
})
