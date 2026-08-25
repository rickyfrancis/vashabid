import type { TopicTag, Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { HomeService, toHomeTopic } from './service'

const baseWord = {
  cefrLevel: 'A1',
  createdAt: '2026-01-01T00:00:00.000Z',
  english: { meanings: [{ meaning: 'to learn' }] },
  id: 1,
  lemma: 'lernen',
  lifecycleStatus: 'active',
  register: 'neutral',
  slug: 'lernen',
  updatedAt: '2026-01-01T00:00:00.000Z',
  usefulnessScore: 5,
  wordType: 'verb',
} satisfies Word

const baseTopic = {
  createdAt: '2026-01-01T00:00:00.000Z',
  english: { description: 'Daily life vocabulary.' },
  id: 1,
  name: 'Alltag',
  review: { banglaReviewed: true },
  slug: 'alltag',
  sortOrder: 10,
  updatedAt: '2026-01-01T00:00:00.000Z',
} satisfies TopicTag

describe('HomeService', () => {
  test('composes safe content and removes the featured word from beginners', async () => {
    const wordRepository = {
      findBeginnerPublished: vi.fn().mockResolvedValue([
        baseWord,
        { ...baseWord, id: 2, lemma: 'machen', slug: 'machen' },
      ]),
      findNewestPublished: vi.fn().mockResolvedValue(baseWord),
    }
    const topicRepository = {
      findForHome: vi.fn().mockResolvedValue([baseTopic]),
    }
    const service = new HomeService(wordRepository, topicRepository)

    await expect(service.getHomePage()).resolves.toEqual({
      beginnerWords: [
        {
          cefrLevel: 'A1',
          lemma: 'machen',
          slug: 'machen',
          support: { bangla: null, english: 'to learn' },
          wordType: 'verb',
        },
      ],
      featuredWord: {
        cefrLevel: 'A1',
        lemma: 'lernen',
        slug: 'lernen',
        support: { bangla: null, english: 'to learn' },
        wordType: 'verb',
      },
      topics: [
        {
          description: { bangla: null, english: 'Daily life vocabulary.' },
          name: 'Alltag',
          slug: 'alltag',
        },
      ],
    })
    expect(wordRepository.findBeginnerPublished).toHaveBeenCalledWith(7)
    expect(topicRepository.findForHome).toHaveBeenCalledWith(6)
  })

  test('returns stable empty content when Payload has no documents', async () => {
    const service = new HomeService(
      {
        findBeginnerPublished: vi.fn().mockResolvedValue([]),
        findNewestPublished: vi.fn().mockResolvedValue(null),
      },
      { findForHome: vi.fn().mockResolvedValue([]) },
    )

    await expect(service.getHomePage()).resolves.toEqual({
      beginnerWords: [],
      featuredWord: null,
      topics: [],
    })
  })
})

describe('topic view-model mapping', () => {
  test('keeps approved Bangla and strips raw metadata', () => {
    expect(
      toHomeTopic({
        ...baseTopic,
        bangla: { description: 'দৈনন্দিন শব্দভাণ্ডার।' },
        source: { attribution: 'must stay server-side' },
      }),
    ).toEqual({
      description: {
        bangla: 'দৈনন্দিন শব্দভাণ্ডার।',
        english: 'Daily life vocabulary.',
      },
      name: 'Alltag',
      slug: 'alltag',
    })
  })

  test('strips unapproved Bangla even if raw content is present', () => {
    expect(
      toHomeTopic({
        ...baseTopic,
        bangla: { description: 'গোপন খসড়া' },
        review: { banglaReviewed: false },
      })?.description.bangla,
    ).toBeNull()
  })
})
