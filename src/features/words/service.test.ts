import type { TopicTag, Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import {
  normalizeWordBrowseSearchParams,
  toWordBrowseQuery,
  WordService,
} from './service'

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

function topic(overrides: Partial<TopicTag> = {}): TopicTag {
  return {
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { description: 'Daily life vocabulary.' },
    id: 10,
    name: 'Alltag',
    slug: 'alltag',
    sortOrder: 10,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function pageResult(overrides: Record<string, unknown> = {}) {
  return {
    docs: [word({ topicTags: [10] })],
    hasNextPage: true,
    hasPrevPage: false,
    limit: 6,
    nextPage: 2,
    page: 1,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: 10,
    totalPages: 2,
    ...overrides,
  }
}

function repository(
  overrides: Partial<{
    findPublishedByIDs: ReturnType<typeof vi.fn>
    findPublishedBySlug: ReturnType<typeof vi.fn>
    findPublishedPage: ReturnType<typeof vi.fn>
  }> = {},
) {
  return {
    findPublishedByIDs: vi.fn().mockResolvedValue([]),
    findPublishedBySlug: vi.fn().mockResolvedValue(null),
    findPublishedPage: vi.fn().mockResolvedValue(pageResult()),
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

  test('maps a safe browse card with an article rendered exactly once', () => {
    const result = service.toBrowseCard(
      word({
        bangla: { meanings: [{ meaning: ' রুটি ' }] },
        gender: 'das',
        source: { attribution: 'must stay server-side' },
        topicTags: [10, 99],
      }),
      [topic()],
    )

    expect(result).toEqual({
      article: 'das',
      cefrLevel: 'A1',
      headword: 'Brot',
      slug: 'das-brot',
      support: { bangla: 'রুটি', english: 'bread' },
      topics: [{ name: 'Alltag', slug: 'alltag' }],
      wordType: 'noun',
    })
    expect(result).not.toHaveProperty('source')
    expect(result).not.toHaveProperty('review')
    expect(result?.topics[0]).not.toHaveProperty('id')
  })

  test('tolerates missing noun gender and optional relationships', () => {
    expect(
      service.toBrowseCard(
        word({ gender: null, topicTags: null }),
        [topic()],
      ),
    ).toMatchObject({ article: null, headword: 'das Brot', topics: [] })
  })

  test('never maps unapproved Bangla into browse cards', () => {
    expect(
      service.toBrowseCard(
        word({
          bangla: { meanings: [{ meaning: 'গোপন' }] },
          review: { banglaReviewed: false },
        }),
        [],
      )?.support,
    ).toEqual({ bangla: null, english: 'bread' })
  })

  test('maps a complete learner-safe detail page and ordered related words', () => {
    const result = service.toDetailPage(
      word({
        bangla: {
          commonMistakes: [{ mistake: ' ভুল ' }],
          explanation: ' বাংলা ব্যাখ্যা ',
          meanings: [{ meaning: ' রুটি ' }, { meaning: ' ' }],
          pronunciationHints: [{ hint: ' দীর্ঘ ও ' }],
        },
        english: {
          commonMistakes: [{ mistake: ' Wrong article ' }],
          explanation: ' Bread as food. ',
          meanings: [{ meaning: ' bread ' }, { meaning: ' loaf ' }],
        },
        examples: [
          {
            banglaExplanation: ' রুটিটি টাটকা। ',
            englishExplanation: ' The bread is fresh. ',
            germanSentence: ' Das Brot ist frisch. ',
          },
        ],
        gender: 'das',
        ipa: ' /bʁoːt/ ',
        pluralForm: ' die Brote ',
        relatedWords: [2, 2, 1, 3, 99],
        source: { attribution: 'must stay server-side' },
        topicTags: [10, 88],
      }),
      [topic()],
      [
        word({ id: 3, lemma: '', slug: 'invalid' }),
        word({
          bangla: { meanings: [{ meaning: ' করা ' }] },
          id: 2,
          lemma: 'machen',
          slug: 'machen',
          wordType: 'verb',
        }),
        word({ id: 4, lemma: 'extra', slug: 'extra' }),
      ],
    )

    expect(result).toMatchObject({
      article: 'das',
      audioAvailable: false,
      examples: [
        {
          germanSentence: 'Das Brot ist frisch.',
          support: { bangla: 'রুটিটি টাটকা।', english: 'The bread is fresh.' },
        },
      ],
      headword: 'Brot',
      ipa: '/bʁoːt/',
      noun: { gender: 'das', pluralForm: 'die Brote' },
      relatedWords: [
        {
          article: null,
          headword: 'machen',
          slug: 'machen',
          support: { bangla: 'করা', english: 'bread' },
        },
      ],
      support: {
        bangla: {
          commonMistakes: ['ভুল'],
          explanation: 'বাংলা ব্যাখ্যা',
          meanings: ['রুটি'],
          pronunciationHints: ['দীর্ঘ ও'],
        },
        english: {
          commonMistakes: ['Wrong article'],
          explanation: 'Bread as food.',
          meanings: ['bread', 'loaf'],
        },
      },
      topics: [{ name: 'Alltag', slug: 'alltag' }],
    })
    expect(result).not.toHaveProperty('source')
    expect(result).not.toHaveProperty('review')
    expect(result?.relatedWords[0]).not.toHaveProperty('id')
  })

  test('tolerates absent optional detail fields and gates all Bangla content', () => {
    const result = service.toDetailPage(
      word({
        bangla: {
          commonMistakes: [{ mistake: 'secret' }],
          explanation: 'secret',
          meanings: [{ meaning: 'গোপন' }],
          pronunciationHints: [{ hint: 'secret' }],
        },
        examples: [
          {
            banglaExplanation: 'secret',
            englishExplanation: 'To work.',
            germanSentence: 'Ich arbeite.',
          },
        ],
        gender: null,
        ipa: null,
        lemma: 'arbeiten',
        pluralForm: null,
        review: { banglaReviewed: false },
        wordType: 'verb',
      }),
      [],
      [],
    )

    expect(result).toMatchObject({
      article: null,
      headword: 'arbeiten',
      ipa: null,
      noun: null,
      relatedWords: [],
      support: { bangla: null },
      topics: [],
    })
    expect(result?.examples[0].support.bangla).toBeNull()
  })

  test('rejects malformed details without a usable English meaning', () => {
    expect(
      service.toDetailPage(word({ english: { meanings: [] } }), [], []),
    ).toBeNull()
  })
})

describe('browse filter normalization', () => {
  test('accepts the supported single-value URL contract', () => {
    expect(
      normalizeWordBrowseSearchParams({
        level: 'A2',
        page: '2',
        topic: 'alltag',
        type: 'noun',
      }),
    ).toEqual({
      filters: { level: 'A2', page: 2, topic: 'alltag', type: 'noun' },
      isCanonical: true,
    })
  })

  test.each([
    [{ level: ['A1', 'A2'] }, { page: 1 }],
    [{ level: 'a1' }, { page: 1 }],
    [{ page: '0' }, { page: 1 }],
    [{ page: '01' }, { page: 1 }],
    [{ page: 'word' }, { page: 1 }],
    [{ topic: ' alltag ' }, { page: 1 }],
    [{ type: 'article' }, { page: 1 }],
    [{ extra: 'value' }, { page: 1 }],
  ])('rejects noncanonical parameters %#', (searchParams, filters) => {
    expect(normalizeWordBrowseSearchParams(searchParams)).toEqual({
      filters,
      isCanonical: false,
    })
  })

  test('omits defaults when creating canonical queries', () => {
    expect(
      toWordBrowseQuery({ level: 'B1', page: 1, topic: 'reisen' }),
    ).toEqual({ level: 'B1', topic: 'reisen' })
    expect(toWordBrowseQuery({ page: 3, type: 'verb' })).toEqual({
      page: '3',
      type: 'verb',
    })
  })
})

describe('word browse orchestration', () => {
  test('resolves the topic and returns a safe paginated page', async () => {
    const wordRepository = repository()
    const topicRepository = {
      findForBrowse: vi.fn().mockResolvedValue([topic()]),
    }
    const service = new WordService(wordRepository, topicRepository)

    const result = await service.getBrowsePage({
      level: 'A1',
      topic: 'alltag',
      type: 'noun',
    })

    expect(wordRepository.findPublishedPage).toHaveBeenCalledWith({
      cefrLevel: 'A1',
      page: 1,
      topicId: 10,
      wordType: 'noun',
    })
    expect(result).toMatchObject({
      kind: 'page',
      page: {
        filters: { level: 'A1', page: 1, topic: 'alltag', type: 'noun' },
        pagination: { page: 1, totalDocs: 10, totalPages: 2 },
        words: [{ article: null, headword: 'das Brot' }],
      },
    })
  })

  test('canonicalizes an unknown or unpublished topic without querying words', async () => {
    const wordRepository = repository({ findPublishedPage: vi.fn() })
    const service = new WordService(wordRepository, {
      findForBrowse: vi.fn().mockResolvedValue([topic()]),
    })

    await expect(
      service.getBrowsePage({ level: 'A1', topic: 'private-topic' }),
    ).resolves.toEqual({ kind: 'redirect', query: { level: 'A1' } })
    expect(wordRepository.findPublishedPage).not.toHaveBeenCalled()
  })

  test('redirects an out-of-range page to the last available page', async () => {
    const service = new WordService(
      repository({
        findPublishedPage: vi.fn().mockResolvedValue(
          pageResult({ docs: [], hasNextPage: false, page: 9 }),
        ),
      }),
      { findForBrowse: vi.fn().mockResolvedValue([]) },
    )

    await expect(service.getBrowsePage({ page: '9', type: 'verb' })).resolves.toEqual(
      { kind: 'redirect', query: { page: '2', type: 'verb' } },
    )
  })

  test('keeps an empty result set on canonical page one', async () => {
    const service = new WordService(
      repository({
        findPublishedPage: vi.fn().mockResolvedValue(
          pageResult({
            docs: [],
            hasNextPage: false,
            totalDocs: 0,
            totalPages: 0,
          }),
        ),
      }),
      { findForBrowse: vi.fn().mockResolvedValue([]) },
    )

    await expect(service.getBrowsePage({})).resolves.toMatchObject({
      kind: 'page',
      page: {
        filters: { page: 1 },
        pagination: { page: 1, totalDocs: 0, totalPages: 0 },
        words: [],
      },
    })
  })
})

describe('word detail orchestration', () => {
  test('loads one word and resolves only its related IDs', async () => {
    const detail = word({ relatedWords: [4, 2, 4] })
    const wordRepository = repository({
      findPublishedByIDs: vi
        .fn()
        .mockResolvedValue([word({ id: 2, slug: 'machen' })]),
      findPublishedBySlug: vi.fn().mockResolvedValue(detail),
    })
    const topicRepository = {
      findForBrowse: vi.fn().mockResolvedValue([topic()]),
    }
    const service = new WordService(wordRepository, topicRepository)

    await expect(service.getDetailPage('das-brot')).resolves.toMatchObject({
      slug: 'das-brot',
    })
    expect(wordRepository.findPublishedBySlug).toHaveBeenCalledWith('das-brot')
    expect(wordRepository.findPublishedByIDs).toHaveBeenCalledWith([4, 2])
    expect(topicRepository.findForBrowse).toHaveBeenCalledOnce()
  })

  test('returns null without loading topics or relationships when absent', async () => {
    const wordRepository = repository()
    const topicRepository = { findForBrowse: vi.fn() }
    const service = new WordService(wordRepository, topicRepository)

    await expect(service.getDetailPage('missing')).resolves.toBeNull()
    expect(wordRepository.findPublishedByIDs).not.toHaveBeenCalled()
    expect(topicRepository.findForBrowse).not.toHaveBeenCalled()
  })
})
