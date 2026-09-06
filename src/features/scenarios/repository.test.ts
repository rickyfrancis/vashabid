import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({ findPublished: vi.fn() }))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { ScenarioRepository } from './repository'

const browseSort = ['cefrLevel', 'title', 'slug']

describe('ScenarioRepository', () => {
  beforeEach(() => {
    findPublished.mockReset()
    findPublished.mockResolvedValue({ docs: [] })
  })

  test('queries one published scenario by exact slug at depth zero', async () => {
    findPublished.mockResolvedValueOnce({
      docs: [{ id: 3, slug: 'im-cafe-bestellen' }],
    })

    await expect(
      new ScenarioRepository().findPublishedBySlug('im-cafe-bestellen'),
    ).resolves.toMatchObject({ id: 3, slug: 'im-cafe-bestellen' })
    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      limit: 1,
      where: { slug: { equals: 'im-cafe-bestellen' } },
    })
  })

  test('returns null when no published scenario matches the slug', async () => {
    await expect(
      new ScenarioRepository().findPublishedBySlug('missing'),
    ).resolves.toBeNull()
  })

  test('lists every published scenario in a stable learning order', async () => {
    await new ScenarioRepository().findForBrowse()

    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      pagination: false,
      sort: browseSort,
    })
  })

  test('looks up scenarios that teach a word without populating it', async () => {
    await new ScenarioRepository().findPublishedByKeyWordID(42)

    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      pagination: false,
      sort: browseSort,
      where: { keyVocabulary: { in: [42] } },
    })
  })

  test('looks up scenarios that practise a grammar topic', async () => {
    await new ScenarioRepository().findPublishedByGrammarTopicID(7)

    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      pagination: false,
      sort: browseSort,
      where: { relatedGrammarTopics: { in: [7] } },
    })
  })

  test('pages without a filter clause when nothing is selected', async () => {
    await new ScenarioRepository().findPublishedPage({ page: 2 })

    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      limit: 6,
      page: 2,
      sort: browseSort,
    })
  })

  test('combines level, situation, and topic filters with AND semantics', async () => {
    await new ScenarioRepository().findPublishedPage({
      cefrLevel: 'A2',
      page: 1,
      situationType: 'travel',
      topicId: 9,
    })

    expect(findPublished).toHaveBeenCalledWith('scenarios', {
      depth: 0,
      limit: 6,
      page: 1,
      sort: browseSort,
      where: {
        and: [
          { cefrLevel: { equals: 'A2' } },
          { situationType: { equals: 'travel' } },
          { topicTags: { equals: 9 } },
        ],
      },
    })
  })

  test('treats topic zero as a real filter rather than a missing one', async () => {
    await new ScenarioRepository().findPublishedPage({ page: 1, topicId: 0 })

    expect(findPublished).toHaveBeenCalledWith(
      'scenarios',
      expect.objectContaining({
        where: { and: [{ topicTags: { equals: 0 } }] },
      }),
    )
  })
})
