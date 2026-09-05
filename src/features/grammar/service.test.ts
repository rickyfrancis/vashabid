import type { GrammarTopic, TopicTag, Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { richTextParagraphs } from '@/lib/payload/fields'
import {
  GrammarService,
  normalizeGrammarBrowseSearchParams,
  toGrammarBrowseQuery,
} from './service'

const topicTag = (overrides: Partial<TopicTag> = {}): TopicTag =>
  ({
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { description: 'Grammar patterns.' },
    id: 5,
    name: 'Grammatik',
    slug: 'grammatik',
    sortOrder: 50,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as TopicTag

const topic = (overrides: Partial<GrammarTopic> = {}): GrammarTopic =>
  ({
    _status: 'published',
    bangla: {
      commonMistakes: [{ mistake: 'ভুল সহায়ক ক্রিয়া।' }],
      explanation: richTextParagraphs('সহায়ক ক্রিয়া haben বা sein।'),
    },
    cefrLevel: 'A2',
    createdAt: '2026-01-01T00:00:00.000Z',
    english: {
      commonMistakes: [{ mistake: 'Using haben with verbs of movement.' }],
      explanation: richTextParagraphs('The Perfekt combines haben or sein.'),
    },
    examples: [
      {
        banglaExplanation: 'গতিবাচক, তাই sein।',
        englishExplanation: 'reisen expresses movement.',
        germanSentence: 'Ich bin gereist.',
      },
    ],
    id: 1,
    name: 'Perfekt mit haben und sein',
    relatedWords: [],
    review: { banglaReviewed: true, englishReviewed: true, germanReviewed: true },
    shortRule: 'Perfekt mit haben oder sein.',
    slug: 'perfekt-mit-haben-und-sein',
    topicTags: [5],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as GrammarTopic

const word = (overrides: Partial<Word> = {}): Word =>
  ({
    _status: 'published',
    cefrLevel: 'A1',
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { meanings: [{ meaning: 'to travel' }] },
    id: 30,
    lemma: 'reisen',
    lifecycleStatus: 'active',
    register: 'neutral',
    slug: 'reisen',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usefulnessScore: 4,
    wordType: 'verb',
    ...overrides,
  }) as Word

function createService({
  page = {
    docs: [topic()],
    hasNextPage: false,
    hasPrevPage: false,
    totalDocs: 1,
    totalPages: 1,
  },
  topics = [topicTag()],
  words = [] as Word[],
}: {
  page?: unknown
  topics?: TopicTag[]
  words?: Word[]
} = {}) {
  const grammarRepository = {
    findPublishedBySlug: vi.fn().mockResolvedValue(topic()),
    findPublishedPage: vi.fn().mockResolvedValue(page),
  }
  const topicRepository = { findForBrowse: vi.fn().mockResolvedValue(topics) }
  const wordRepository = {
    findPublishedByIDs: vi.fn().mockResolvedValue(words),
  }
  const wordService = {
    toRelatedWord: vi.fn((value: Word) => ({
      article: null,
      cefrLevel: value.cefrLevel,
      headword: value.lemma,
      slug: value.slug,
      support: { bangla: null, english: 'to travel' },
      wordType: value.wordType,
    })),
  }

  return {
    grammarRepository,
    service: new GrammarService(
      grammarRepository as never,
      topicRepository as never,
      wordRepository as never,
      wordService as never,
    ),
    topicRepository,
    wordRepository,
    wordService,
  }
}

describe('normalizeGrammarBrowseSearchParams', () => {
  test('accepts a canonical filtered query', () => {
    expect(
      normalizeGrammarBrowseSearchParams({
        level: 'A2',
        page: '2',
        topic: 'grammatik',
      }),
    ).toEqual({
      filters: { level: 'A2', page: 2, topic: 'grammatik' },
      isCanonical: true,
    })
  })

  test('defaults to the first page with no filters', () => {
    expect(normalizeGrammarBrowseSearchParams({})).toEqual({
      filters: { page: 1 },
      isCanonical: true,
    })
  })

  test.each([
    ['an unknown query key', { unknown: 'x' }],
    ['a repeated value', { level: ['A1', 'A2'] }],
    ['untrimmed whitespace', { level: ' A1' }],
    ['an invalid level', { level: 'Z9' }],
    ['an explicit first page', { page: '1' }],
    ['a padded page number', { page: '02' }],
    ['a non-numeric page', { page: 'two' }],
    ['a zero page', { page: '0' }],
  ])('treats %s as non-canonical', (_label, params) => {
    expect(normalizeGrammarBrowseSearchParams(params).isCanonical).toBe(false)
  })

  test('drops an invalid level but keeps the rest of the query', () => {
    expect(
      normalizeGrammarBrowseSearchParams({ level: 'Z9', topic: 'grammatik' }),
    ).toEqual({
      filters: { page: 1, topic: 'grammatik' },
      isCanonical: false,
    })
  })
})

describe('toGrammarBrowseQuery', () => {
  test('omits defaults so the canonical URL stays short', () => {
    expect(toGrammarBrowseQuery({ page: 1 })).toEqual({})
    expect(
      toGrammarBrowseQuery({ level: 'A2', page: 3, topic: 'grammatik' }),
    ).toEqual({ level: 'A2', page: '3', topic: 'grammatik' })
  })
})

describe('GrammarService.toBrowseCard', () => {
  test('summarizes English and approved Bangla explanations', () => {
    const card = createService().service.toBrowseCard(topic(), [topicTag()])

    expect(card).toEqual({
      cefrLevel: 'A2',
      name: 'Perfekt mit haben und sein',
      shortRule: 'Perfekt mit haben oder sein.',
      slug: 'perfekt-mit-haben-und-sein',
      support: {
        bangla: 'সহায়ক ক্রিয়া haben বা sein।',
        english: 'The Perfekt combines haben or sein.',
      },
      topics: [{ name: 'Grammatik', slug: 'grammatik' }],
    })
  })

  test('withholds Bangla until the Bangla review flag is set', () => {
    const card = createService().service.toBrowseCard(
      topic({ review: { banglaReviewed: false } }),
      [topicTag()],
    )

    expect(card?.support.bangla).toBeNull()
    expect(card?.support.english).toBe('The Perfekt combines haben or sein.')
  })

  test('clips a long explanation on a word boundary', () => {
    const card = createService().service.toBrowseCard(
      topic({
        english: {
          commonMistakes: [],
          explanation: richTextParagraphs('lang '.repeat(80).trim()),
        },
      } as Partial<GrammarTopic>),
      [],
    )

    expect(card?.support.english.endsWith('…')).toBe(true)
    expect(card?.support.english.length).toBeLessThanOrEqual(181)
  })

  test.each([
    ['a blank name', { name: '   ' }],
    ['a blank short rule', { shortRule: '  ' }],
    [
      'an empty English explanation',
      { english: { commonMistakes: [], explanation: richTextParagraphs('  ') } },
    ],
  ])('rejects %s', (_label, overrides) => {
    expect(
      createService().service.toBrowseCard(
        topic(overrides as Partial<GrammarTopic>),
        [],
      ),
    ).toBeNull()
  })

  test('ignores topic tags that are not published', () => {
    const card = createService().service.toBrowseCard(topic(), [])

    expect(card?.topics).toEqual([])
  })
})

describe('GrammarService.toDetailPage', () => {
  test('maps aligned examples and approved Bangla support', () => {
    const detail = createService().service.toDetailPage(
      topic(),
      [topicTag()],
      [],
    )

    expect(detail?.support.bangla?.commonMistakes).toEqual([
      'ভুল সহায়ক ক্রিয়া।',
    ])
    expect(detail?.examples).toEqual([
      {
        germanSentence: 'Ich bin gereist.',
        support: {
          bangla: 'গতিবাচক, তাই sein।',
          english: 'reisen expresses movement.',
        },
      },
    ])
  })

  test('strips every Bangla surface when review is pending', () => {
    const detail = createService().service.toDetailPage(
      topic({ review: { banglaReviewed: false } }),
      [],
      [],
    )
    const serialized = JSON.stringify(detail)

    expect(detail?.support.bangla).toBeNull()
    expect(detail?.examples[0].support.bangla).toBeNull()
    expect(serialized).not.toContain('সহায়ক')
    expect(serialized).not.toContain('গতিবাচক')
  })

  test('drops examples that are missing German or English text', () => {
    const detail = createService().service.toDetailPage(
      topic({
        examples: [
          { englishExplanation: 'No German.', germanSentence: '  ' },
          { englishExplanation: '  ', germanSentence: 'Kein Englisch.' },
          {
            englishExplanation: 'Complete.',
            germanSentence: 'Vollständig.',
          },
        ],
      } as Partial<GrammarTopic>),
      [],
      [],
    )

    expect(detail?.examples.map((example) => example.germanSentence)).toEqual([
      'Vollständig.',
    ])
  })

  test('returns null when the English explanation is empty', () => {
    expect(
      createService().service.toDetailPage(
        topic({
          english: {
            commonMistakes: [],
            explanation: richTextParagraphs(''),
          },
        } as Partial<GrammarTopic>),
        [],
        [],
      ),
    ).toBeNull()
  })

  test('keeps related words ordered, deduplicated, and published-only', () => {
    const detail = createService().service.toDetailPage(
      topic({ relatedWords: [30, 30, 99] } as Partial<GrammarTopic>),
      [],
      [word()],
    )

    expect(detail?.relatedWords.map((related) => related.slug)).toEqual([
      'reisen',
    ])
  })
})

describe('GrammarService.toGrammarLink', () => {
  test('exposes only what another page needs to link here', () => {
    expect(createService().service.toGrammarLink(topic())).toEqual({
      cefrLevel: 'A2',
      name: 'Perfekt mit haben und sein',
      slug: 'perfekt-mit-haben-und-sein',
    })
  })

  test('rejects a topic without a usable name or slug', () => {
    expect(
      createService().service.toGrammarLink(
        topic({ name: '  ' } as Partial<GrammarTopic>),
      ),
    ).toBeNull()
  })
})

describe('GrammarService.getDetailPage', () => {
  test('returns null without loading related data when the slug is unknown', async () => {
    const harness = createService()
    harness.grammarRepository.findPublishedBySlug.mockResolvedValue(null)

    await expect(harness.service.getDetailPage('missing')).resolves.toBeNull()
    expect(harness.wordRepository.findPublishedByIDs).not.toHaveBeenCalled()
  })

  test('requests only the related word IDs the topic names', async () => {
    const harness = createService({ words: [word()] })
    harness.grammarRepository.findPublishedBySlug.mockResolvedValue(
      topic({ relatedWords: [30, 30] } as Partial<GrammarTopic>),
    )

    await harness.service.getDetailPage('perfekt-mit-haben-und-sein')

    expect(harness.wordRepository.findPublishedByIDs).toHaveBeenCalledWith([30])
  })
})

describe('GrammarService.getBrowsePage', () => {
  test('requests a canonical redirect before querying topics', async () => {
    const harness = createService()

    await expect(
      harness.service.getBrowsePage({ page: '1', unknown: 'x' }),
    ).resolves.toEqual({ kind: 'redirect', query: {} })
    expect(harness.grammarRepository.findPublishedPage).not.toHaveBeenCalled()
  })

  test('drops an unknown topic slug and redirects to the canonical URL', async () => {
    const harness = createService()

    await expect(
      harness.service.getBrowsePage({ topic: 'does-not-exist' }),
    ).resolves.toEqual({ kind: 'redirect', query: {} })
    expect(harness.grammarRepository.findPublishedPage).not.toHaveBeenCalled()
  })

  test('resolves a known topic slug to its ID before querying', async () => {
    const harness = createService()

    await harness.service.getBrowsePage({ topic: 'grammatik' })

    expect(harness.grammarRepository.findPublishedPage).toHaveBeenCalledWith({
      cefrLevel: undefined,
      page: 1,
      topicId: 5,
    })
  })

  test('redirects an out-of-range page to the last available page', async () => {
    const harness = createService({
      page: {
        docs: [],
        hasNextPage: false,
        hasPrevPage: true,
        totalDocs: 8,
        totalPages: 2,
      },
    })

    await expect(harness.service.getBrowsePage({ page: '9' })).resolves.toEqual({
      kind: 'redirect',
      query: { page: '2' },
    })
  })

  test('clamps to page one when nothing is published', async () => {
    const harness = createService({
      page: {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        totalDocs: 0,
        totalPages: 0,
      },
    })

    await expect(harness.service.getBrowsePage({ page: '4' })).resolves.toEqual({
      kind: 'redirect',
      query: {},
    })
  })

  test('returns filter options and mapped cards for a valid page', async () => {
    const result = await createService().service.getBrowsePage({})

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    expect(result.page.options.levels).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2',
    ])
    expect(result.page.options.topics).toEqual([
      { name: 'Grammatik', slug: 'grammatik' },
    ])
    expect(result.page.pagination).toEqual({
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 1,
      totalPages: 1,
    })
    expect(result.page.topics).toHaveLength(1)
  })
})
