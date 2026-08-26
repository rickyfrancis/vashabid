import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({ findPublished: vi.fn() }))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { WordRepository } from './repository'

describe('WordRepository', () => {
  beforeEach(() => {
    findPublished.mockReset()
    findPublished.mockResolvedValue({ docs: [] })
  })

  test('queries the newest active published word', async () => {
    await new WordRepository().findNewestPublished()

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 1,
      sort: '-createdAt',
      where: { lifecycleStatus: { equals: 'active' } },
    })
  })

  test('queries deterministic A1 and A2 active published words', async () => {
    await new WordRepository().findBeginnerPublished(7)

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 7,
      sort: ['cefrLevel', 'lemma'],
      where: {
        and: [
          { lifecycleStatus: { equals: 'active' } },
          { cefrLevel: { in: ['A1', 'A2'] } },
        ],
      },
    })
  })

  test('queries one active published word by exact slug at depth zero', async () => {
    findPublished.mockResolvedValueOnce({ docs: [{ id: 7, slug: 'machen' }] })

    await expect(
      new WordRepository().findPublishedBySlug('machen'),
    ).resolves.toMatchObject({ id: 7, slug: 'machen' })
    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 1,
      where: {
        and: [
          { slug: { equals: 'machen' } },
          { lifecycleStatus: { equals: 'active' } },
        ],
      },
    })
  })

  test('queries active published related IDs without populating relationships', async () => {
    await new WordRepository().findPublishedByIDs([9, 4])

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 2,
      where: {
        and: [
          { id: { in: [9, 4] } },
          { lifecycleStatus: { equals: 'active' } },
        ],
      },
    })
  })

  test('does not query Payload for an empty related-ID list', async () => {
    await expect(new WordRepository().findPublishedByIDs([])).resolves.toEqual(
      [],
    )
    expect(findPublished).not.toHaveBeenCalled()
  })

  test('composes a paginated active browse query with every filter', async () => {
    await new WordRepository().findPublishedPage({
      cefrLevel: 'A2',
      page: 2,
      topicId: 17,
      wordType: 'noun',
    })

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 6,
      page: 2,
      sort: ['cefrLevel', 'lemma', 'slug'],
      where: {
        and: [
          { lifecycleStatus: { equals: 'active' } },
          { cefrLevel: { equals: 'A2' } },
          { wordType: { equals: 'noun' } },
          { topicTags: { equals: 17 } },
        ],
      },
    })
  })

  test('keeps the unfiltered browse query published, active, and stable', async () => {
    await new WordRepository().findPublishedPage({ page: 1 })

    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 6,
      page: 1,
      sort: ['cefrLevel', 'lemma', 'slug'],
      where: {
        and: [{ lifecycleStatus: { equals: 'active' } }],
      },
    })
  })
})
