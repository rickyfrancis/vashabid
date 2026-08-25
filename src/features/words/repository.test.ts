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
})
