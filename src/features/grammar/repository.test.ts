import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({ findPublished: vi.fn() }))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { GrammarRepository } from './repository'

describe('GrammarRepository', () => {
  beforeEach(() => {
    findPublished.mockReset()
    findPublished.mockResolvedValue({ docs: [] })
  })

  test('queries one published topic by exact slug at depth zero', async () => {
    findPublished.mockResolvedValueOnce({
      docs: [{ id: 3, slug: 'modalverben' }],
    })

    await expect(
      new GrammarRepository().findPublishedBySlug('modalverben'),
    ).resolves.toMatchObject({ id: 3, slug: 'modalverben' })
    expect(findPublished).toHaveBeenCalledWith('grammar-topics', {
      depth: 0,
      limit: 1,
      where: { slug: { equals: 'modalverben' } },
    })
  })

  test('returns null when no published topic matches the slug', async () => {
    await expect(
      new GrammarRepository().findPublishedBySlug('missing'),
    ).resolves.toBeNull()
  })

  test('lists every published topic in a stable learning order', async () => {
    await new GrammarRepository().findForBrowse()

    expect(findPublished).toHaveBeenCalledWith('grammar-topics', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'name', 'slug'],
    })
  })

  test('looks up topics that reference a word without populating it', async () => {
    await new GrammarRepository().findPublishedByRelatedWordID(42)

    expect(findPublished).toHaveBeenCalledWith('grammar-topics', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'name', 'slug'],
      where: { relatedWords: { in: [42] } },
    })
  })

  test('pages without a filter clause when nothing is selected', async () => {
    await new GrammarRepository().findPublishedPage({ page: 2 })

    expect(findPublished).toHaveBeenCalledWith('grammar-topics', {
      depth: 0,
      limit: 6,
      page: 2,
      sort: ['cefrLevel', 'name', 'slug'],
    })
  })

  test('combines CEFR and topic filters with AND semantics', async () => {
    await new GrammarRepository().findPublishedPage({
      cefrLevel: 'A2',
      page: 1,
      topicId: 9,
    })

    expect(findPublished).toHaveBeenCalledWith('grammar-topics', {
      depth: 0,
      limit: 6,
      page: 1,
      sort: ['cefrLevel', 'name', 'slug'],
      where: {
        and: [{ cefrLevel: { equals: 'A2' } }, { topicTags: { equals: 9 } }],
      },
    })
  })
})
