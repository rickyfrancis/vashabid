import type { GrammarTopic, Scenario, TopicTag, Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { richTextParagraphs } from '@/lib/payload/fields'
import {
  ScenarioService,
  normalizeScenarioBrowseSearchParams,
  toScenarioBrowseQuery,
} from './service'

const PENDING_BANGLA = 'অপ্রকাশিত বাংলা ব্যাখ্যা।'

const scenario = (overrides: Partial<Scenario> = {}): Scenario =>
  ({
    _status: 'published',
    bangla: {
      culturalNotes: [{ note: 'বাংলা সাংস্কৃতিক নোট।' }],
      explanation: richTextParagraphs('ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।'),
    },
    cefrLevel: 'A1',
    dialogue: [
      {
        banglaExplanation: 'বিনয়ী অনুরোধ।',
        englishExplanation: 'A polite order.',
        germanLine: 'Ich hätte gern einen Kaffee.',
        speaker: 'Kundin',
      },
    ],
    english: {
      culturalNotes: [{ note: 'Greet before ordering.' }],
      explanation: richTextParagraphs('Greet, then order politely.'),
    },
    id: 1,
    keyVocabulary: [],
    learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
    relatedGrammarTopics: [],
    review: {
      banglaReviewed: true,
      englishReviewed: true,
      germanReviewed: true,
    },
    situationType: 'everyday',
    slug: 'im-cafe-bestellen',
    title: 'Im Café bestellen',
    topicTags: [5],
    ...overrides,
  }) as Scenario

const topicTag = (overrides: Partial<TopicTag> = {}): TopicTag =>
  ({ id: 5, name: 'Alltag', slug: 'alltag', ...overrides }) as TopicTag

const word = (overrides: Partial<Word> = {}): Word =>
  ({
    cefrLevel: 'A1',
    id: 30,
    lemma: 'das Brot',
    slug: 'das-brot',
    wordType: 'noun',
    ...overrides,
  }) as Word

const grammarTopic = (overrides: Partial<GrammarTopic> = {}): GrammarTopic =>
  ({
    cefrLevel: 'A1',
    id: 40,
    name: 'Bestimmter Artikel',
    slug: 'bestimmter-artikel',
    ...overrides,
  }) as GrammarTopic

function createService({
  page = {
    docs: [scenario()],
    hasNextPage: false,
    hasPrevPage: false,
    totalDocs: 1,
    totalPages: 1,
  },
  grammarTopics = [] as GrammarTopic[],
  topics = [topicTag()],
  words = [] as Word[],
}: {
  page?: unknown
  grammarTopics?: GrammarTopic[]
  topics?: TopicTag[]
  words?: Word[]
} = {}) {
  const scenarioRepository = {
    findPublishedBySlug: vi.fn().mockResolvedValue(scenario()),
    findPublishedPage: vi.fn().mockResolvedValue(page),
  }
  const topicRepository = { findForBrowse: vi.fn().mockResolvedValue(topics) }
  const wordRepository = {
    findPublishedByIDs: vi.fn().mockResolvedValue(words),
  }
  const grammarRepository = {
    findPublishedByIDs: vi.fn().mockResolvedValue(grammarTopics),
  }
  const wordService = {
    toRelatedWord: vi.fn((value: Word) => ({
      article: null,
      cefrLevel: value.cefrLevel,
      headword: value.lemma,
      slug: value.slug,
      support: { bangla: null, english: 'bread' },
      wordType: value.wordType,
    })),
  }
  const grammarService = {
    toGrammarLink: vi.fn((value: GrammarTopic) => ({
      cefrLevel: value.cefrLevel,
      name: value.name,
      slug: value.slug,
    })),
  }

  return {
    grammarRepository,
    grammarService,
    scenarioRepository,
    service: new ScenarioService(
      scenarioRepository as never,
      topicRepository as never,
      wordRepository as never,
      grammarRepository as never,
      wordService as never,
      grammarService as never,
    ),
    topicRepository,
    wordRepository,
    wordService,
  }
}

describe('scenario browse query canonicalization', () => {
  test('treats an empty query as canonical page one', () => {
    expect(normalizeScenarioBrowseSearchParams({})).toEqual({
      filters: { page: 1 },
      isCanonical: true,
    })
  })

  test('accepts every supported filter together', () => {
    expect(
      normalizeScenarioBrowseSearchParams({
        level: 'B1',
        page: '2',
        situation: 'travel',
        topic: 'reisen',
      }),
    ).toEqual({
      filters: { level: 'B1', page: 2, situation: 'travel', topic: 'reisen' },
      isCanonical: true,
    })
  })

  test.each([
    ['an unknown query key', { unknown: 'x' }],
    ['a repeated parameter', { level: ['A1', 'A2'] }],
    ['an untrimmed value', { topic: ' alltag' }],
    ['an invalid CEFR level', { level: 'Z9' }],
    ['an invalid situation type', { situation: 'holiday' }],
    ['an explicit page one', { page: '1' }],
    ['a zero-padded page', { page: '01' }],
    ['a non-numeric page', { page: 'two' }],
    ['a negative page', { page: '-3' }],
  ])('rejects %s as non-canonical', (_label, params) => {
    expect(
      normalizeScenarioBrowseSearchParams(params as never).isCanonical,
    ).toBe(false)
  })

  test('drops invalid filter values instead of querying with them', () => {
    const { filters } = normalizeScenarioBrowseSearchParams({
      level: 'Z9',
      situation: 'holiday',
    })

    expect(filters).toEqual({ page: 1 })
  })

  test('omits defaults when rebuilding the canonical query', () => {
    expect(toScenarioBrowseQuery({ page: 1 })).toEqual({})
    expect(
      toScenarioBrowseQuery({
        level: 'A2',
        page: 3,
        situation: 'work',
        topic: 'arbeit-und-studium',
      }),
    ).toEqual({
      level: 'A2',
      page: '3',
      situation: 'work',
      topic: 'arbeit-und-studium',
    })
  })
})

describe('ScenarioService mappers', () => {
  test('builds a browse card with a clipped English summary', () => {
    const card = createService().service.toBrowseCard(scenario(), [topicTag()])

    expect(card).toMatchObject({
      cefrLevel: 'A1',
      learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
      situationType: 'everyday',
      slug: 'im-cafe-bestellen',
      title: 'Im Café bestellen',
      topics: [{ name: 'Alltag', slug: 'alltag' }],
    })
    expect(card?.support.english).toBe('Greet, then order politely.')
  })

  test('withholds Bangla from cards until Bangla review is approved', () => {
    const pending = scenario({
      bangla: {
        culturalNotes: [],
        explanation: richTextParagraphs(PENDING_BANGLA),
      },
      review: { banglaReviewed: false, englishReviewed: true },
    } as Partial<Scenario>)

    expect(
      createService().service.toBrowseCard(pending, [topicTag()])?.support
        .bangla,
    ).toBeNull()
    expect(
      createService().service.toBrowseCard(scenario(), [topicTag()])?.support
        .bangla,
    ).toBe('ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।')
  })

  test('returns null for a scenario that cannot be rendered', () => {
    const { service } = createService()

    expect(service.toBrowseCard(scenario({ title: '  ' }), [])).toBeNull()
    expect(service.toBrowseCard(scenario({ slug: '  ' }), [])).toBeNull()
    expect(service.toBrowseCard(scenario({ learnerGoal: ' ' }), [])).toBeNull()
    expect(
      service.toBrowseCard(
        scenario({ english: { explanation: richTextParagraphs('  ') } } as Partial<Scenario>),
        [],
      ),
    ).toBeNull()
  })

  test('only lists topics that are both related and published', () => {
    const card = createService().service.toBrowseCard(
      scenario({ topicTags: [5, 99] }),
      [topicTag(), topicTag({ id: 6, name: 'Reisen', slug: 'reisen' })],
    )

    expect(card?.topics).toEqual([{ name: 'Alltag', slug: 'alltag' }])
  })

  test('builds a scenario link and rejects unusable identity', () => {
    const { service } = createService()

    expect(service.toScenarioLink(scenario())).toEqual({
      cefrLevel: 'A1',
      situationType: 'everyday',
      slug: 'im-cafe-bestellen',
      title: 'Im Café bestellen',
    })
    expect(service.toScenarioLink(scenario({ title: '   ' }))).toBeNull()
  })
})

describe('ScenarioService.toDetailPage', () => {
  test('keeps dialogue aligned and drops half-written lines', () => {
    const detail = createService().service.toDetailPage(
      scenario({
        dialogue: [
          {
            englishExplanation: 'A polite order.',
            germanLine: 'Ich hätte gern einen Kaffee.',
            speaker: 'Kundin',
          },
          { englishExplanation: 'Missing German.', speaker: 'Kellner' },
          { germanLine: 'Missing English.', speaker: 'Kellner' },
          { englishExplanation: 'Missing speaker.', germanLine: 'Bitte.' },
        ],
      } as Partial<Scenario>),
      [topicTag()],
      [],
      [],
    )

    expect(detail?.dialogue).toEqual([
      {
        germanLine: 'Ich hätte gern einen Kaffee.',
        speaker: 'Kundin',
        support: { bangla: null, english: 'A polite order.' },
      },
    ])
  })

  test('withholds Bangla explanations, notes, and dialogue when unapproved', () => {
    const detail = createService().service.toDetailPage(
      scenario({
        bangla: {
          culturalNotes: [{ note: PENDING_BANGLA }],
          explanation: richTextParagraphs(PENDING_BANGLA),
        },
        review: { banglaReviewed: false, englishReviewed: true },
      } as Partial<Scenario>),
      [topicTag()],
      [],
      [],
    )

    expect(detail?.support.bangla).toBeNull()
    expect(detail?.dialogue[0].support.bangla).toBeNull()
    expect(JSON.stringify(detail)).not.toContain(PENDING_BANGLA)
  })

  test('exposes approved Bangla at every surface', () => {
    const detail = createService().service.toDetailPage(
      scenario(),
      [topicTag()],
      [],
      [],
    )

    expect(detail?.support.bangla?.culturalNotes).toEqual([
      'বাংলা সাংস্কৃতিক নোট।',
    ])
    expect(detail?.dialogue[0].support.bangla).toBe('বিনয়ী অনুরোধ।')
  })

  test('preserves editor order and drops duplicate or unpublished relations', () => {
    const detail = createService().service.toDetailPage(
      scenario({
        keyVocabulary: [31, 30, 31, 999],
        relatedGrammarTopics: [41, 40, 41, 999],
      }),
      [topicTag()],
      [word(), word({ id: 31, lemma: 'essen', slug: 'essen', wordType: 'verb' })],
      [
        grammarTopic(),
        grammarTopic({ id: 41, name: 'Der Akkusativ', slug: 'der-akkusativ' }),
      ],
    )

    expect(detail?.keyVocabulary.map((entry) => entry.slug)).toEqual([
      'essen',
      'das-brot',
    ])
    expect(detail?.grammarTopics.map((entry) => entry.slug)).toEqual([
      'der-akkusativ',
      'bestimmter-artikel',
    ])
  })

  test('returns null when the English explanation is unusable', () => {
    expect(
      createService().service.toDetailPage(
        scenario({
          english: { explanation: richTextParagraphs('   ') },
        } as Partial<Scenario>),
        [],
        [],
        [],
      ),
    ).toBeNull()
  })
})

describe('ScenarioService.getDetailPage', () => {
  test('resolves each relationship set exactly once', async () => {
    const harness = createService({ words: [word()] })
    harness.scenarioRepository.findPublishedBySlug.mockResolvedValue(
      scenario({ keyVocabulary: [30, 30], relatedGrammarTopics: [40, 40] }),
    )

    await harness.service.getDetailPage('im-cafe-bestellen')

    expect(harness.wordRepository.findPublishedByIDs).toHaveBeenCalledWith([30])
    expect(harness.grammarRepository.findPublishedByIDs).toHaveBeenCalledWith([
      40,
    ])
  })

  test('returns null without loading relationships when absent', async () => {
    const harness = createService()
    harness.scenarioRepository.findPublishedBySlug.mockResolvedValue(null)

    await expect(harness.service.getDetailPage('missing')).resolves.toBeNull()
    expect(harness.wordRepository.findPublishedByIDs).not.toHaveBeenCalled()
    expect(harness.topicRepository.findForBrowse).not.toHaveBeenCalled()
  })
})

describe('ScenarioService.getBrowsePage', () => {
  test('requests a canonical redirect before querying scenarios', async () => {
    const harness = createService()

    await expect(
      harness.service.getBrowsePage({ page: '1', unknown: 'x' }),
    ).resolves.toEqual({ kind: 'redirect', query: {} })
    expect(harness.scenarioRepository.findPublishedPage).not.toHaveBeenCalled()
  })

  test('drops an unknown topic slug and redirects to the canonical URL', async () => {
    const harness = createService()

    await expect(
      harness.service.getBrowsePage({ topic: 'does-not-exist' }),
    ).resolves.toEqual({ kind: 'redirect', query: {} })
    expect(harness.scenarioRepository.findPublishedPage).not.toHaveBeenCalled()
  })

  test('resolves a known topic slug to its ID before querying', async () => {
    const harness = createService()

    await harness.service.getBrowsePage({
      level: 'A1',
      situation: 'everyday',
      topic: 'alltag',
    })

    expect(harness.scenarioRepository.findPublishedPage).toHaveBeenCalledWith({
      cefrLevel: 'A1',
      page: 1,
      situationType: 'everyday',
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

    await expect(
      harness.service.getBrowsePage({ page: '9' }),
    ).resolves.toEqual({ kind: 'redirect', query: { page: '2' } })
  })

  test('offers every level and situation as a filter option', async () => {
    const result = await createService().service.getBrowsePage({})

    if (result.kind !== 'page') throw new Error('expected a page result')

    expect(result.page.options.levels).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2',
    ])
    expect(result.page.options.situations).toEqual([
      'everyday',
      'travel',
      'work',
      'study',
      'health',
      'services',
      'social',
    ])
    expect(result.page.scenarios).toHaveLength(1)
  })

  test('filters out scenarios that cannot be rendered as cards', async () => {
    const harness = createService({
      page: {
        docs: [scenario(), scenario({ id: 2, title: '   ' })],
        hasNextPage: false,
        hasPrevPage: false,
        totalDocs: 2,
        totalPages: 1,
      },
    })

    const result = await harness.service.getBrowsePage({})

    if (result.kind !== 'page') throw new Error('expected a page result')
    expect(result.page.scenarios).toHaveLength(1)
  })
})
