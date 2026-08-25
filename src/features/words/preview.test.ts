import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findPublished } = vi.hoisted(() => ({
  findPublished: vi.fn(),
}))

vi.mock('@/lib/payload', () => ({ findPublished }))

import { getPublishedWordPreview } from './preview'

describe('published word preview query', () => {
  beforeEach(() => {
    findPublished.mockReset()
  })

  test('requires a published active word and maps only preview-safe identity data', async () => {
    findPublished.mockResolvedValue({
      docs: [
        {
          bangla: { meanings: [{ meaning: 'অ্যাপয়েন্টমেন্ট' }] },
          cefrLevel: 'A2',
          english: { meanings: [{ meaning: 'appointment' }] },
          lemma: 'der Termin',
          lifecycleStatus: 'active',
          slug: 'der-termin',
          wordType: 'noun',
        },
      ],
    })

    await expect(getPublishedWordPreview('der-termin')).resolves.toEqual({
      cefrLevel: 'A2',
      lemma: 'der Termin',
      slug: 'der-termin',
      wordType: 'noun',
    })
    expect(findPublished).toHaveBeenCalledWith('words', {
      depth: 0,
      limit: 1,
      where: {
        and: [
          { slug: { equals: 'der-termin' } },
          { lifecycleStatus: { equals: 'active' } },
        ],
      },
    })
  })

  test('returns null when no public word matches', async () => {
    findPublished.mockResolvedValue({ docs: [] })

    await expect(getPublishedWordPreview('missing')).resolves.toBeNull()
  })
})
