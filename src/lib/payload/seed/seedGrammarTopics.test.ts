import type { Payload } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { richTextToPlainText } from '../fields'
import { grammarTopicSeeds } from './data/grammarTopics'
import type { GrammarTopicSeed } from './data/grammarTopics'
import { seedGrammarTopics } from './seedGrammarTopics'

interface StoredDoc {
  id: number
  slug: string
  [key: string]: unknown
}

const topicSlugs = [
  ...new Set(grammarTopicSeeds.flatMap((seed) => seed.topicSlugs)),
]
const wordSlugs = [
  ...new Set(grammarTopicSeeds.flatMap((seed) => seed.relatedSlugs)),
]

function referenceDocs(slugs: string[], offset: number): StoredDoc[] {
  return slugs.map((slug, index) => ({ id: offset + index, slug }))
}

function createPayloadFixture({
  grammar = [],
  tags = referenceDocs(topicSlugs, 100),
  words = referenceDocs(wordSlugs, 200),
}: {
  grammar?: StoredDoc[]
  tags?: StoredDoc[]
  words?: StoredDoc[]
} = {}) {
  const docs = new Map(grammar.map((doc) => [doc.slug, structuredClone(doc)]))
  let nextID = Math.max(0, ...grammar.map((doc) => doc.id)) + 1

  const find = vi.fn(
    async ({
      collection,
      where,
    }: {
      collection: string
      where: { slug: { equals?: string; in?: string[] } }
    }) => {
      if (collection === 'topic-tags') {
        return { docs: tags.filter((doc) => where.slug.in?.includes(doc.slug)) }
      }
      if (collection === 'words') {
        return { docs: words.filter((doc) => where.slug.in?.includes(doc.slug)) }
      }

      const doc = docs.get(where.slug.equals as string)
      return { docs: doc ? [structuredClone(doc)] : [] }
    },
  )
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const doc = { ...structuredClone(data), id: nextID++ } as StoredDoc
    docs.set(doc.slug, doc)
    return structuredClone(doc)
  })
  const update = vi.fn(
    async ({ data, id }: { data: Record<string, unknown>; id: number }) => {
      const previous = [...docs.values()].find((doc) => doc.id === id)
      if (!previous) throw new Error(`Missing fixture topic: ${id}`)

      const doc = { ...previous, ...structuredClone(data), id } as StoredDoc
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

function reorderKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reorderKeys)
  if (value === null || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, entry]) => [key, reorderKeys(entry)]),
  )
}

describe('grammar topic seeding', () => {
  test('creates every seed as a published topic with resolved references', async () => {
    const fixture = createPayloadFixture()

    expect(await seedGrammarTopics(fixture.payload)).toEqual({
      created: grammarTopicSeeds.length,
      unchanged: 0,
      updated: 0,
    })
    expect([...fixture.docs.keys()].sort()).toEqual(
      grammarTopicSeeds.map((seed) => seed.slug).sort(),
    )

    const artikel = fixture.docs.get('bestimmter-artikel')

    expect(artikel).toMatchObject({
      _status: 'published',
      cefrLevel: 'A1',
      generateSlug: false,
      name: 'Bestimmter Artikel',
    })
    expect(artikel?.topicTags).toEqual([100])
    expect((artikel?.relatedWords as number[]).length).toBe(3)
    expect(
      richTextToPlainText(
        (artikel?.english as { explanation: unknown }).explanation,
      ),
    ).toContain('three genders')
  })

  test('seeds exactly one topic with unapproved Bangla', async () => {
    const fixture = createPayloadFixture()
    await seedGrammarTopics(fixture.payload)

    const pending = [...fixture.docs.values()].filter(
      (doc) =>
        (doc.review as { banglaReviewed?: boolean })?.banglaReviewed !== true,
    )

    expect(pending.map((doc) => doc.slug)).toEqual(['trennbare-verben'])
  })

  test('is idempotent across repeated runs', async () => {
    const fixture = createPayloadFixture()
    await seedGrammarTopics(fixture.payload)
    fixture.spies.create.mockClear()
    fixture.spies.update.mockClear()

    expect(await seedGrammarTopics(fixture.payload)).toEqual({
      created: 0,
      unchanged: grammarTopicSeeds.length,
      updated: 0,
    })
    expect(fixture.spies.create).not.toHaveBeenCalled()
    expect(fixture.spies.update).not.toHaveBeenCalled()
  })

  test('treats reordered rich-text keys as unchanged', async () => {
    const fixture = createPayloadFixture()
    await seedGrammarTopics(fixture.payload)

    // `jsonb` does not preserve key order, so a round-tripped document comes
    // back with the same content under a different key order.
    for (const doc of fixture.docs.values()) {
      const english = doc.english as { explanation: unknown }
      english.explanation = reorderKeys(english.explanation)
    }

    expect(await seedGrammarTopics(fixture.payload)).toEqual({
      created: 0,
      unchanged: grammarTopicSeeds.length,
      updated: 0,
    })
    expect(fixture.spies.update).not.toHaveBeenCalled()
  })

  test('repairs drifted documents without recreating them', async () => {
    const fixture = createPayloadFixture()
    await seedGrammarTopics(fixture.payload)

    const drifted = fixture.docs.get('modalverben') as StoredDoc
    drifted.shortRule = 'Veraltete Regel.'
    drifted._status = 'draft'

    expect(await seedGrammarTopics(fixture.payload)).toEqual({
      created: 0,
      unchanged: grammarTopicSeeds.length - 1,
      updated: 1,
    })
    expect(fixture.docs.get('modalverben')).toMatchObject({
      _status: 'published',
      shortRule:
        'Das Modalverb wird konjugiert und das Hauptverb steht als Infinitiv am Satzende.',
    })
  })

  test('reads and writes only through access-overriding published calls', async () => {
    const fixture = createPayloadFixture()
    await seedGrammarTopics(fixture.payload)

    expect(fixture.spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'grammar-topics',
        draft: false,
        overrideAccess: true,
      }),
    )
    expect(fixture.spies.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'grammar-topics',
        depth: 0,
        draft: true,
        limit: 2,
        overrideAccess: true,
      }),
    )
  })

  test('rejects duplicate seed slugs before touching the database', async () => {
    const duplicate = [
      grammarTopicSeeds[0],
      { ...grammarTopicSeeds[1], slug: grammarTopicSeeds[0].slug },
    ] as readonly GrammarTopicSeed[]
    const fixture = createPayloadFixture()

    await expect(
      seedGrammarTopics(fixture.payload, duplicate),
    ).rejects.toThrow(
      `Duplicate grammar topic seed slug: ${grammarTopicSeeds[0].slug}`,
    )
    expect(fixture.spies.find).not.toHaveBeenCalled()
  })

  test('rejects a duplicate related word within one seed', async () => {
    const seeds = [
      {
        ...grammarTopicSeeds[0],
        relatedSlugs: ['essen', 'essen'],
      },
    ] as readonly GrammarTopicSeed[]

    await expect(
      seedGrammarTopics(createPayloadFixture().payload, seeds),
    ).rejects.toThrow(
      'Duplicate related word seed essen for grammar topic bestimmter-artikel',
    )
  })

  test('fails loudly when a referenced tag or word is missing', async () => {
    await expect(
      seedGrammarTopics(createPayloadFixture({ tags: [] }).payload),
    ).rejects.toThrow('Missing topic tag seed for grammar topic: grammatik')

    await expect(
      seedGrammarTopics(createPayloadFixture({ words: [] }).payload),
    ).rejects.toThrow('Missing related word seed for grammar topic:')
  })

  test('rejects duplicate stored slugs instead of guessing', async () => {
    const fixture = createPayloadFixture()
    fixture.spies.find.mockImplementation(async ({ collection }) => {
      if (collection === 'topic-tags') {
        return { docs: referenceDocs(topicSlugs, 100) }
      }
      if (collection === 'words') return { docs: referenceDocs(wordSlugs, 200) }
      return {
        docs: [
          { id: 1, slug: 'bestimmter-artikel' },
          { id: 2, slug: 'bestimmter-artikel' },
        ],
      }
    })

    await expect(seedGrammarTopics(fixture.payload)).rejects.toThrow(
      'Duplicate stored grammar topic seed slug: bestimmter-artikel',
    )
  })
})
