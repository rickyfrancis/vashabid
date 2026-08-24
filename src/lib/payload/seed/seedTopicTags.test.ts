import type { Payload } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import type { TopicTag } from '../../../../payload-types'
import { topicTagSeeds } from './data/topicTags'
import { seedTopicTags } from './seedTopicTags'

interface StoredTag {
  _status: 'draft' | 'published'
  bangla?: { description?: string | null }
  english: { description: string }
  generateSlug?: boolean | null
  id: number
  name: string
  parent?: number | null
  review?: {
    banglaReviewed?: boolean | null
    englishReviewed?: boolean | null
    germanReviewed?: boolean | null
  }
  slug: string
  sortOrder: number
}

function createPayloadFixture(initial: StoredTag[] = []) {
  const docs = new Map(initial.map((doc) => [doc.slug, structuredClone(doc)]))
  let nextID = Math.max(0, ...initial.map((doc) => doc.id)) + 1

  const find = vi.fn(async ({ where }: { where: { slug: { equals: string } } }) => {
    const doc = docs.get(where.slug.equals)
    return { docs: doc ? [structuredClone(doc)] : [] }
  })
  const create = vi.fn(async ({ data }: { data: Omit<StoredTag, 'id'> }) => {
    const doc = { ...structuredClone(data), id: nextID++ }
    docs.set(doc.slug, doc)
    return structuredClone(doc)
  })
  const update = vi.fn(
    async ({ data, id }: { data: Omit<StoredTag, 'id'>; id: number }) => {
      const previous = [...docs.values()].find((doc) => doc.id === id)
      if (!previous) throw new Error(`Missing fixture tag: ${id}`)

      const doc = { ...previous, ...structuredClone(data), id }
      docs.delete(previous.slug)
      docs.set(doc.slug, doc)
      return structuredClone(doc)
    },
  )

  return {
    docs,
    payload: { create, find, update } as unknown as Payload,
    spies: { create, find, update },
  }
}

describe('topic tag seeding', () => {
  test('creates canonical published tags and resolves parents in two passes', async () => {
    const fixture = createPayloadFixture()

    expect(await seedTopicTags(fixture.payload)).toEqual({
      created: 5,
      unchanged: 0,
      updated: 0,
    })
    expect([...fixture.docs.keys()].sort()).toEqual(
      topicTagSeeds.map((tag) => tag.slug).sort(),
    )

    const alltag = fixture.docs.get('alltag')
    const food = fixture.docs.get('essen-und-trinken')

    expect(food?.parent).toBe(alltag?.id)
    expect(
      [...fixture.docs.values()].every(
        (doc) =>
          doc._status === 'published' &&
          doc.review?.germanReviewed === true &&
          doc.review?.englishReviewed === true &&
          doc.review?.banglaReviewed === true,
      ),
    ).toBe(true)
    expect(fixture.spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'topic-tags',
        draft: false,
        overrideAccess: true,
      }),
    )
  })

  test('is unchanged on repeat runs and never creates duplicates', async () => {
    const fixture = createPayloadFixture()

    await seedTopicTags(fixture.payload)
    fixture.spies.create.mockClear()
    fixture.spies.update.mockClear()

    expect(await seedTopicTags(fixture.payload)).toEqual({
      created: 0,
      unchanged: 5,
      updated: 0,
    })
    expect(fixture.docs.size).toBe(5)
    expect(fixture.spies.create).not.toHaveBeenCalled()
    expect(fixture.spies.update).not.toHaveBeenCalled()
  })

  test('repairs canonical data while preserving unrelated tags', async () => {
    const fixture = createPayloadFixture([
      {
        _status: 'published',
        english: { description: 'Do not remove me.' },
        id: 99,
        name: 'Unrelated',
        parent: null,
        slug: 'unrelated',
        sortOrder: 999,
      },
    ])
    await seedTopicTags(fixture.payload)
    const alltag = fixture.docs.get('alltag')
    if (!alltag) throw new Error('Missing seeded Alltag tag')
    alltag.english.description = 'Stale description'
    fixture.spies.update.mockClear()

    expect(await seedTopicTags(fixture.payload)).toEqual({
      created: 0,
      unchanged: 4,
      updated: 1,
    })
    expect(fixture.docs.get('unrelated')?.name).toBe('Unrelated')
    expect(fixture.docs.get('alltag')?.english.description).toBe(
      'Vocabulary for daily life and everyday activities.',
    )
    expect(fixture.spies.update).toHaveBeenCalledTimes(1)
  })

  test('fails instead of choosing between duplicate canonical slugs', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          { id: 1, slug: 'alltag' },
          { id: 2, slug: 'alltag' },
        ] as TopicTag[],
      }),
    } as unknown as Payload

    await expect(seedTopicTags(payload)).rejects.toThrow(
      'Duplicate topic tag seed slug: alltag',
    )
  })
})
