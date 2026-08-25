import type { Payload } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { topicTagSeeds } from './data/topicTags'
import { wordSeeds } from './data/words'
import {
  assertUniqueWordSeedSlugs,
  seedWords,
} from './seedWords'

interface StoredWord {
  [key: string]: unknown
  id: number
  slug: string
}

interface FixtureOptions {
  duplicateStoredSlugs?: readonly string[]
  missingTagSlugs?: readonly string[]
}

function createPayloadFixture(options: FixtureOptions = {}) {
  const docs = new Map<string, StoredWord>()
  const duplicateStoredSlugs = new Set(options.duplicateStoredSlugs)
  const missingTagSlugs = new Set(options.missingTagSlugs)
  const tags = topicTagSeeds
    .filter((tag) => !missingTagSlugs.has(tag.slug))
    .map((tag, index) => ({ id: index + 1, slug: tag.slug }))
  let nextID = 100

  const find = vi.fn(
    async ({
      collection,
      where,
    }: {
      collection: string
      where: {
        slug: { equals?: string; in?: string[] }
      }
    }) => {
      if (collection === 'topic-tags') {
        const expected = new Set(where.slug.in)
        return {
          docs: tags
            .filter((tag) => expected.has(tag.slug))
            .map((tag) => structuredClone(tag)),
        }
      }

      const slug = where.slug.equals as string
      const doc = docs.get(slug)
      if (!doc) return { docs: [] }

      const matches = [structuredClone(doc)]
      if (duplicateStoredSlugs.has(slug)) {
        matches.push({ ...structuredClone(doc), id: doc.id + 10_000 })
      }
      return { docs: matches }
    },
  )
  const create = vi.fn(async ({ data }: { data: Omit<StoredWord, 'id'> }) => {
    const doc = { ...structuredClone(data), id: nextID++ } as StoredWord
    docs.set(doc.slug, doc)
    return structuredClone(doc)
  })
  const update = vi.fn(
    async ({
      data,
      id,
    }: {
      data: Omit<StoredWord, 'id'>
      id: number
    }) => {
      const previous = [...docs.values()].find((doc) => doc.id === id)
      if (!previous) throw new Error(`Missing fixture word: ${id}`)

      const doc = {
        ...previous,
        ...structuredClone(data),
        id,
      } as StoredWord
      docs.delete(previous.slug)
      docs.set(doc.slug, doc)
      return structuredClone(doc)
    },
  )

  return {
    docs,
    payload: { create, find, update } as unknown as Payload,
    spies: { create, find, update },
    tags,
  }
}

describe('word seeding', () => {
  test('creates ten canonical published words with resolved topic tags', async () => {
    const fixture = createPayloadFixture()

    expect(await seedWords(fixture.payload)).toEqual({
      created: 10,
      unchanged: 0,
      updated: 0,
    })
    expect([...fixture.docs.keys()].sort()).toEqual(
      wordSeeds.map((word) => word.slug).sort(),
    )

    const alltagID = fixture.tags.find((tag) => tag.slug === 'alltag')?.id
    const termin = fixture.docs.get('der-termin')
    expect(termin?.topicTags).toEqual([alltagID])
    expect(termin).toMatchObject({
      _status: 'published',
      lifecycleStatus: 'active',
      review: {
        banglaReviewed: true,
        englishReviewed: true,
        germanReviewed: true,
      },
    })
    expect(fixture.spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'words',
        draft: false,
        overrideAccess: true,
      }),
    )
  })

  test('provides aligned examples and the intended Bangla review mix', async () => {
    const fixture = createPayloadFixture()
    await seedWords(fixture.payload)

    const seeded = [...fixture.docs.values()]
    const withBangla = seeded.filter((word) => word.bangla !== undefined)
    const reviewedBangla = withBangla.filter(
      (word) =>
        (word.review as { banglaReviewed?: boolean }).banglaReviewed === true,
    )
    const pendingBangla = withBangla.filter(
      (word) =>
        (word.review as { banglaReviewed?: boolean }).banglaReviewed === false,
    )

    expect(seeded).toHaveLength(10)
    expect(
      seeded.every(
        (word) =>
          Array.isArray(word.examples) &&
          (word.examples as unknown[]).length === 1,
      ),
    ).toBe(true)
    expect(withBangla).toHaveLength(5)
    expect(reviewedBangla).toHaveLength(4)
    expect(pendingBangla.map((word) => word.slug)).toEqual(['das-brot'])
  })

  test('is unchanged on repeat runs and never creates duplicates', async () => {
    const fixture = createPayloadFixture()

    await seedWords(fixture.payload)
    fixture.spies.create.mockClear()
    fixture.spies.update.mockClear()

    expect(await seedWords(fixture.payload)).toEqual({
      created: 0,
      unchanged: 10,
      updated: 0,
    })
    expect(fixture.docs.size).toBe(10)
    expect(fixture.spies.create).not.toHaveBeenCalled()
    expect(fixture.spies.update).not.toHaveBeenCalled()
  })

  test('repairs canonical data while preserving unrelated words', async () => {
    const fixture = createPayloadFixture()
    await seedWords(fixture.payload)
    const termin = fixture.docs.get('der-termin')
    if (!termin) throw new Error('Missing seeded word')

    ;(termin.english as { explanation: string }).explanation = 'Stale text'
    fixture.docs.set('unrelated', {
      id: 999,
      lemma: 'unrelated',
      slug: 'unrelated',
    })
    fixture.spies.update.mockClear()

    expect(await seedWords(fixture.payload)).toEqual({
      created: 0,
      unchanged: 9,
      updated: 1,
    })
    expect(fixture.docs.get('unrelated')?.lemma).toBe('unrelated')
    expect(
      (fixture.docs.get('der-termin')?.english as { explanation: string })
        .explanation,
    ).toBe(
      'A scheduled time for a meeting, appointment, or official visit.',
    )
  })

  test('rejects duplicate seed slugs before querying Payload', async () => {
    const duplicateSeeds = [wordSeeds[0], wordSeeds[0]]
    const fixture = createPayloadFixture()

    expect(() => assertUniqueWordSeedSlugs(duplicateSeeds)).toThrow(
      'Duplicate word seed slug: der-termin',
    )
    await expect(seedWords(fixture.payload, duplicateSeeds)).rejects.toThrow(
      'Duplicate word seed slug: der-termin',
    )
    expect(fixture.spies.find).not.toHaveBeenCalled()
  })

  test('rejects missing topic tags and duplicate stored words', async () => {
    const missingTagFixture = createPayloadFixture({
      missingTagSlugs: ['alltag'],
    })
    await expect(seedWords(missingTagFixture.payload)).rejects.toThrow(
      'Missing topic tag seed for word: alltag',
    )

    const duplicateWordFixture = createPayloadFixture({
      duplicateStoredSlugs: ['der-termin'],
    })
    await seedWords(duplicateWordFixture.payload)
    await expect(seedWords(duplicateWordFixture.payload)).rejects.toThrow(
      'Duplicate stored word seed slug: der-termin',
    )
  })
})
