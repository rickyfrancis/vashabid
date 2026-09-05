import type { TopicTag, Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { SearchService } from './service'

const topic = (overrides: Partial<TopicTag> = {}): TopicTag => ({
  _status: 'published',
  bangla: { description: 'ভ্রমণ ও গন্তব্য' },
  createdAt: '2026-01-01T00:00:00.000Z',
  english: { description: 'Travel and destinations' },
  id: 4,
  name: 'Reisen',
  review: { banglaReviewed: true },
  slug: 'reisen',
  sortOrder: 10,
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const word = (overrides: Partial<Word> = {}): Word => ({
  _status: 'published',
  cefrLevel: 'A1',
  createdAt: '2026-01-01T00:00:00.000Z',
  english: { meanings: [{ meaning: 'to travel' }] },
  id: 9,
  lemma: 'reisen',
  lifecycleStatus: 'active',
  register: 'neutral',
  slug: 'reisen',
  topicTags: [4],
  updatedAt: '2026-01-01T00:00:00.000Z',
  usefulnessScore: 4,
  wordType: 'verb',
  ...overrides,
})

function repositoryResult(overrides: Record<string, unknown> = {}) {
  return {
    docs: [word()],
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12,
    nextPage: null,
    page: 1,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: 1,
    totalPages: 1,
    ...overrides,
  }
}

function createService({
  grammar = [],
  topics = [topic()],
  result = repositoryResult(),
}: {
  grammar?: unknown[]
  topics?: TopicTag[]
  result?: ReturnType<typeof repositoryResult>
} = {}) {
  const searchRepository = {
    findGrammarMatches: vi.fn().mockResolvedValue(grammar),
    findWordPage: vi.fn().mockResolvedValue(result),
  }
  const topicRepository = { findForBrowse: vi.fn().mockResolvedValue(topics) }
  const wordService = {
    toBrowseCard: vi.fn().mockReturnValue({
      article: null,
      cefrLevel: 'A1',
      headword: 'reisen',
      slug: 'reisen',
      support: { bangla: null, english: 'to travel' },
      topics: [{ name: 'Reisen', slug: 'reisen' }],
      wordType: 'verb',
    }),
  }

  const grammarService = {
    toBrowseCard: vi.fn((value: { slug: string }) => ({
      cefrLevel: 'A2',
      name: 'Modalverben',
      shortRule: 'Das Modalverb wird konjugiert.',
      slug: value.slug,
      support: { bangla: null, english: 'Modal verbs.' },
      topics: [],
    })),
  }

  return {
    grammarService,
    searchRepository,
    service: new SearchService(
      searchRepository,
      topicRepository,
      wordService,
      grammarService as never,
    ),
    topicRepository,
    wordService,
  }
}

describe('SearchService', () => {
  test('returns idle state without querying repositories', async () => {
    const fixture = createService()

    await expect(fixture.service.getPage({})).resolves.toMatchObject({
      kind: 'page',
      page: { grammar: [], query: '', state: 'idle', words: [] },
    })
    expect(fixture.topicRepository.findForBrowse).not.toHaveBeenCalled()
    expect(fixture.searchRepository.findWordPage).not.toHaveBeenCalled()
  })

  test('requests canonical redirects before searching', async () => {
    const fixture = createService()

    await expect(
      fixture.service.getPage({ q: '  Bahnhof ', page: '01', extra: 'x' }),
    ).resolves.toEqual({ kind: 'redirect', query: { q: 'Bahnhof' } })
    expect(fixture.searchRepository.findWordPage).not.toHaveBeenCalled()
  })

  test('adds published topic matches to each normalized token', async () => {
    const fixture = createService()

    await fixture.service.getPage({ q: 'A1 travel' })

    expect(fixture.searchRepository.findWordPage).toHaveBeenCalledWith(
      [
        expect.objectContaining({ cefrLevel: 'A1', topicIDs: [] }),
        expect.objectContaining({ topicIDs: [4], variants: expect.arrayContaining(['travel']) }),
      ],
      1,
    )
  })

  test('does not match unapproved Bangla topic metadata', async () => {
    const fixture = createService({
      topics: [topic({ review: { banglaReviewed: false } })],
    })

    await fixture.service.getPage({ q: 'ভ্রমণ' })

    expect(fixture.searchRepository.findWordPage).toHaveBeenCalledWith(
      [expect.objectContaining({ topicIDs: [] })],
      1,
    )
  })

  test('maps result documents through the learner-safe word boundary', async () => {
    const fixture = createService()

    await expect(fixture.service.getPage({ q: 'travel' })).resolves.toMatchObject({
      kind: 'page',
      page: {
        pagination: { page: 1, totalDocs: 1, totalPages: 1 },
        query: 'travel',
        state: 'results',
        words: [{ slug: 'reisen', support: { english: 'to travel' } }],
      },
    })
    expect(fixture.wordService.toBrowseCard).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'reisen' }),
      expect.arrayContaining([expect.objectContaining({ slug: 'reisen' })]),
    )
  })

  test('redirects an out-of-range page to the last available page', async () => {
    const fixture = createService({
      result: repositoryResult({
        docs: [],
        page: 3,
        totalDocs: 14,
        totalPages: 2,
      }),
    })

    await expect(
      fixture.service.getPage({ q: 'travel', page: '3' }),
    ).resolves.toEqual({
      kind: 'redirect',
      query: { q: 'travel', page: '2' },
    })
  })
})

describe('SearchService grammar results', () => {
  test('returns capped grammar matches alongside the first page of words', async () => {
    const fixture = createService({
      grammar: [{ slug: 'modalverben' }, { slug: 'relativsaetze' }],
    })

    const result = await fixture.service.getPage({ q: 'verben' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    expect(result.page.grammar.map((topic) => topic.slug)).toEqual([
      'modalverben',
      'relativsaetze',
    ])
    expect(fixture.searchRepository.findGrammarMatches).toHaveBeenCalledWith(
      expect.any(Array),
      6,
    )
  })

  test('keeps words paginated by omitting grammar beyond the first page', async () => {
    const fixture = createService({
      grammar: [{ slug: 'modalverben' }],
      result: repositoryResult({ page: 2, totalDocs: 14, totalPages: 2 }),
    })

    const result = await fixture.service.getPage({ q: 'verben', page: '2' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    expect(result.page.grammar).toEqual([])
    expect(fixture.searchRepository.findGrammarMatches).not.toHaveBeenCalled()
  })

  test('drops grammar topics the view-model mapper rejects', async () => {
    const fixture = createService({ grammar: [{ slug: 'broken' }] })
    fixture.grammarService.toBrowseCard.mockReturnValue(
      null as unknown as ReturnType<typeof fixture.grammarService.toBrowseCard>,
    )

    const result = await fixture.service.getPage({ q: 'verben' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    expect(result.page.grammar).toEqual([])
  })

  test('returns no grammar for an idle query without querying', async () => {
    const fixture = createService({ grammar: [{ slug: 'modalverben' }] })

    const result = await fixture.service.getPage({})

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    expect(result.page.grammar).toEqual([])
    expect(fixture.searchRepository.findGrammarMatches).not.toHaveBeenCalled()
  })
})
