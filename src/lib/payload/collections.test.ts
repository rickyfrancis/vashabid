import { beforeEach, describe, expect, test, vi } from 'vitest'

const { find, getPayloadClient } = vi.hoisted(() => ({
  find: vi.fn(),
  getPayloadClient: vi.fn(),
}))

vi.mock('./getPayload', () => ({ getPayloadClient }))

import { findBySlug, findPublished } from './collections'

describe('public Payload collection helpers', () => {
  beforeEach(() => {
    find.mockReset()
    find.mockResolvedValue({ docs: [] })
    getPayloadClient.mockReset()
    getPayloadClient.mockResolvedValue({ find })
  })

  test('enforces anonymous access and published status for collection queries', async () => {
    await findPublished('words', {
      depth: 0,
      limit: 6,
      sort: ['cefrLevel', 'lemma'],
      where: { lifecycleStatus: { equals: 'active' } },
    })

    expect(find).toHaveBeenCalledWith({
      collection: 'words',
      depth: 0,
      limit: 6,
      overrideAccess: false,
      sort: ['cefrLevel', 'lemma'],
      where: {
        lifecycleStatus: { equals: 'active' },
        _status: { equals: 'published' },
      },
    })
  })

  test('enforces anonymous access and published status for slug queries', async () => {
    find.mockResolvedValue({ docs: [{ slug: 'machen' }] })

    await expect(findBySlug('words', 'machen', { depth: 0 })).resolves.toEqual({
      slug: 'machen',
    })
    expect(find).toHaveBeenCalledWith({
      collection: 'words',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      where: {
        slug: { equals: 'machen' },
        _status: { equals: 'published' },
      },
    })
  })
})
