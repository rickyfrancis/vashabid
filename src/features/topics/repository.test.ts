import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({ findPublished: vi.fn() }))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { TopicTagRepository } from './repository'

describe('TopicTagRepository', () => {
  beforeEach(() => {
    findPublished.mockReset()
    findPublished.mockResolvedValue({ docs: [] })
  })

  test('queries published tags in deterministic editorial order', async () => {
    await new TopicTagRepository().findForHome(6)

    expect(findPublished).toHaveBeenCalledWith('topic-tags', {
      depth: 0,
      limit: 6,
      sort: ['sortOrder', 'name'],
    })
  })

  test('queries every published browse option in editorial order', async () => {
    await new TopicTagRepository().findForBrowse()

    expect(findPublished).toHaveBeenCalledWith('topic-tags', {
      depth: 0,
      pagination: false,
      sort: ['sortOrder', 'name'],
    })
  })
})
