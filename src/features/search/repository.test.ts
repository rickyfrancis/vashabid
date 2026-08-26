import type { Word } from '@payload-types'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({ findPublished: vi.fn() }))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { matchesSearchToken, SearchRepository } from './repository'
import type { SearchToken } from './types'

const word = (overrides: Partial<Word> = {}): Word => ({
  _status: 'published',
  bangla: {
    meanings: [{ meaning: 'খাওয়া' }],
    romanizedHelper: 'khaoa',
  },
  cefrLevel: 'A1',
  createdAt: '2026-01-01T00:00:00.000Z',
  english: { meanings: [{ meaning: 'to eat' }] },
  id: 3,
  lemma: 'essen',
  lifecycleStatus: 'active',
  register: 'neutral',
  review: { banglaReviewed: true },
  slug: 'essen',
  topicTags: [7],
  updatedAt: '2026-01-01T00:00:00.000Z',
  usefulnessScore: 5,
  wordType: 'verb',
  ...overrides,
})

const token = (overrides: Partial<SearchToken> = {}): SearchToken => ({
  topicIDs: [],
  variants: ['missing'],
  ...overrides,
})

describe('matchesSearchToken', () => {
  test.each([
    token({ variants: ['essen'] }),
    token({ variants: ['eat'] }),
    token({ variants: ['খাওয়া'] }),
    token({ variants: ['khaoa'] }),
    token({ cefrLevel: 'A1' }),
    token({ wordType: 'verb' }),
    token({ topicIDs: [7] }),
  ])('matches one searchable word field or classification', (searchToken) => {
    expect(matchesSearchToken(word(), searchToken)).toBe(true)
  })

  test('never searches Bangla content without the review gate', () => {
    const pending = word({ review: { banglaReviewed: false } })

    expect(matchesSearchToken(pending, token({ variants: ['খাওয়া'] }))).toBe(
      false,
    )
    expect(matchesSearchToken(pending, token({ variants: ['khaoa'] }))).toBe(
      false,
    )
  })
})

describe('SearchRepository', () => {
  beforeEach(() => {
    findPublished.mockReset()
    findPublished.mockResolvedValue({ docs: [] })
  })

  test('loads only active published access-filtered documents at depth zero', async () => {
    await new SearchRepository().findWordPage([token()], 1)

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      pagination: false,
      sort: ['lemma', 'slug'],
      where: { lifecycleStatus: { equals: 'active' } },
    })
  })

  test('applies AND token semantics and returns deterministic pages', async () => {
    const words = Array.from({ length: 14 }, (_, index) =>
      word({
        id: index + 1,
        lemma: `essen ${index + 1}`,
        slug: `essen-${index + 1}`,
      }),
    )
    findPublished.mockResolvedValue({ docs: words })

    const result = await new SearchRepository().findWordPage(
      [token({ variants: ['essen'] }), token({ wordType: 'verb' })],
      2,
    )

    expect(result).toMatchObject({
      docs: [
        expect.objectContaining({ id: 13 }),
        expect.objectContaining({ id: 14 }),
      ],
      hasNextPage: false,
      hasPrevPage: true,
      page: 2,
      totalDocs: 14,
      totalPages: 2,
    })
  })

  test('excludes words that fail any token', async () => {
    findPublished.mockResolvedValue({
      docs: [word(), word({ id: 4, wordType: 'noun' })],
    })

    const result = await new SearchRepository().findWordPage(
      [token({ variants: ['eat'] }), token({ wordType: 'verb' })],
      1,
    )

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].id).toBe(3)
  })
})
