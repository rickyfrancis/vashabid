import type { Payload } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { richTextToPlainText } from '../fields'
import { scenarioSeeds } from './data/scenarios'
import type { ScenarioSeed } from './data/scenarios'
import { seedScenarios } from './seedScenarios'

interface StoredDoc {
  id: number
  slug: string
  [key: string]: unknown
}

const topicSlugs = [
  ...new Set(scenarioSeeds.flatMap((seed) => seed.topicSlugs)),
]
const wordSlugs = [...new Set(scenarioSeeds.flatMap((seed) => seed.wordSlugs))]
const grammarSlugs = [
  ...new Set(scenarioSeeds.flatMap((seed) => seed.grammarSlugs)),
]

function referenceDocs(slugs: string[], offset: number): StoredDoc[] {
  return slugs.map((slug, index) => ({ id: offset + index, slug }))
}

function createPayloadFixture({
  grammar = referenceDocs(grammarSlugs, 300),
  scenarios = [],
  tags = referenceDocs(topicSlugs, 100),
  words = referenceDocs(wordSlugs, 200),
}: {
  grammar?: StoredDoc[]
  scenarios?: StoredDoc[]
  tags?: StoredDoc[]
  words?: StoredDoc[]
} = {}) {
  const docs = new Map(scenarios.map((doc) => [doc.slug, structuredClone(doc)]))
  let nextID = Math.max(0, ...scenarios.map((doc) => doc.id)) + 1

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
      if (collection === 'grammar-topics') {
        return {
          docs: grammar.filter((doc) => where.slug.in?.includes(doc.slug)),
        }
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
      if (!previous) throw new Error(`Missing fixture scenario: ${id}`)

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

const oneSeed: ScenarioSeed[] = [scenarioSeeds[0]]

describe('scenario seed data', () => {
  test('publishes eight scenarios with unique slugs', () => {
    expect(scenarioSeeds).toHaveLength(8)
    expect(new Set(scenarioSeeds.map((seed) => seed.slug)).size).toBe(8)
  })

  test('spans enough levels and situations to exercise every filter', () => {
    expect(new Set(scenarioSeeds.map((seed) => seed.cefrLevel)).size)
      .toBeGreaterThanOrEqual(3)
    expect(
      new Set(scenarioSeeds.map((seed) => seed.situationType)).size,
    ).toBeGreaterThanOrEqual(4)
  })

  test('keeps exactly one scenario with Bangla pending review', () => {
    const pending = scenarioSeeds.filter(
      (seed) => seed.bangla && !seed.bangla.reviewed,
    )

    expect(pending).toHaveLength(1)
    expect(pending[0].slug).toBe('fahrkarte-am-schalter-kaufen')
  })

  test('gives every scenario a publishable dialogue', () => {
    for (const seed of scenarioSeeds) {
      expect(seed.dialogue.length).toBeGreaterThan(0)
      for (const line of seed.dialogue) {
        expect(line.germanLine.trim()).not.toBe('')
        expect(line.englishExplanation.trim()).not.toBe('')
        expect(line.speaker.trim()).not.toBe('')
      }
    }
  })
})

describe('seedScenarios', () => {
  test('creates every scenario with resolved relationships', async () => {
    const fixture = createPayloadFixture()

    await expect(seedScenarios(fixture.payload)).resolves.toEqual({
      created: 8,
      unchanged: 0,
      updated: 0,
    })
    expect(fixture.spies.create).toHaveBeenCalledTimes(8)

    const stored = fixture.docs.get('im-cafe-bestellen')
    expect(stored).toMatchObject({
      _status: 'published',
      cefrLevel: 'A1',
      generateSlug: false,
      situationType: 'everyday',
      title: 'Im Café bestellen',
    })
    expect(stored?.keyVocabulary).toEqual(
      scenarioSeeds[0].wordSlugs.map(
        (slug) => 200 + wordSlugs.indexOf(slug),
      ),
    )
    expect(stored?.relatedGrammarTopics).toEqual(
      scenarioSeeds[0].grammarSlugs.map(
        (slug) => 300 + grammarSlugs.indexOf(slug),
      ),
    )
  })

  test('reports no drift on a second run', async () => {
    const fixture = createPayloadFixture()

    await seedScenarios(fixture.payload)
    fixture.spies.create.mockClear()

    await expect(seedScenarios(fixture.payload)).resolves.toEqual({
      created: 0,
      unchanged: 8,
      updated: 0,
    })
    expect(fixture.spies.create).not.toHaveBeenCalled()
    expect(fixture.spies.update).not.toHaveBeenCalled()
  })

  test('treats reordered rich-text keys as unchanged', async () => {
    const fixture = createPayloadFixture()
    await seedScenarios(fixture.payload, oneSeed)

    const stored = fixture.docs.get(oneSeed[0].slug) as StoredDoc
    stored.english = reorderKeys(stored.english) as StoredDoc['english']
    stored.bangla = reorderKeys(stored.bangla) as StoredDoc['bangla']

    await expect(seedScenarios(fixture.payload, oneSeed)).resolves.toEqual({
      created: 0,
      unchanged: 1,
      updated: 0,
    })
  })

  test('repairs drift by updating the stored scenario', async () => {
    const fixture = createPayloadFixture()
    await seedScenarios(fixture.payload, oneSeed)

    const stored = fixture.docs.get(oneSeed[0].slug) as StoredDoc
    stored.learnerGoal = 'Verändert.'

    await expect(seedScenarios(fixture.payload, oneSeed)).resolves.toEqual({
      created: 0,
      unchanged: 0,
      updated: 1,
    })
    expect(fixture.docs.get(oneSeed[0].slug)?.learnerGoal).toBe(
      oneSeed[0].learnerGoal,
    )
  })

  test('restores a published status that drifted to draft', async () => {
    const fixture = createPayloadFixture()
    await seedScenarios(fixture.payload, oneSeed)

    const stored = fixture.docs.get(oneSeed[0].slug) as StoredDoc
    stored._status = 'draft'

    await expect(seedScenarios(fixture.payload, oneSeed)).resolves.toEqual({
      created: 0,
      unchanged: 0,
      updated: 1,
    })
    expect(fixture.docs.get(oneSeed[0].slug)?._status).toBe('published')
  })

  test('stores Bangla review state exactly as the seed declares it', async () => {
    const fixture = createPayloadFixture()
    await seedScenarios(fixture.payload)

    expect(
      (fixture.docs.get('im-cafe-bestellen')?.review as Record<string, boolean>)
        .banglaReviewed,
    ).toBe(true)
    expect(
      (
        fixture.docs.get('fahrkarte-am-schalter-kaufen')?.review as Record<
          string,
          boolean
        >
      ).banglaReviewed,
    ).toBe(false)
  })

  test('builds rich text that flattens back to the seed paragraphs', async () => {
    const fixture = createPayloadFixture()
    await seedScenarios(fixture.payload, oneSeed)

    expect(
      richTextToPlainText(
        (fixture.docs.get(oneSeed[0].slug)?.english as Record<string, unknown>)
          .explanation,
      ),
    ).toBe(oneSeed[0].englishExplanation.join(' '))
  })

  test('rejects duplicate seed slugs before touching the database', async () => {
    const fixture = createPayloadFixture()

    await expect(
      seedScenarios(fixture.payload, [oneSeed[0], oneSeed[0]]),
    ).rejects.toThrow('Duplicate scenario seed slug: im-cafe-bestellen')
    expect(fixture.spies.find).not.toHaveBeenCalled()
  })

  test.each([
    ['wordSlugs', 'key vocabulary'],
    ['grammarSlugs', 'grammar topic'],
    ['topicSlugs', 'topic tag'],
  ])('rejects a duplicate %s reference', async (field, label) => {
    const fixture = createPayloadFixture()
    const value = (oneSeed[0] as unknown as Record<string, string[]>)[field][0]
    const seed = { ...oneSeed[0], [field]: [value, value] } as ScenarioSeed

    await expect(seedScenarios(fixture.payload, [seed])).rejects.toThrow(
      `Duplicate ${label} seed ${value} for scenario ${seed.slug}`,
    )
  })

  test.each([
    ['tags', 'Missing topic tag seed for scenario'],
    ['words', 'Missing key vocabulary seed for scenario'],
    ['grammar', 'Missing grammar topic seed for scenario'],
  ])('fails loudly when %s references are missing', async (key, message) => {
    const fixture = createPayloadFixture({ [key]: [] })

    await expect(seedScenarios(fixture.payload, oneSeed)).rejects.toThrow(
      message,
    )
    expect(fixture.spies.create).not.toHaveBeenCalled()
  })

  test('refuses to guess when two stored scenarios share a slug', async () => {
    const fixture = createPayloadFixture()
    fixture.spies.find.mockImplementation(
      async ({ collection }: { collection: string }) => {
        if (collection === 'scenarios') {
          return { docs: [{ id: 1 }, { id: 2 }] }
        }
        if (collection === 'topic-tags') {
          return { docs: referenceDocs(topicSlugs, 100) }
        }
        if (collection === 'words') {
          return { docs: referenceDocs(wordSlugs, 200) }
        }
        return { docs: referenceDocs(grammarSlugs, 300) }
      },
    )

    await expect(seedScenarios(fixture.payload, oneSeed)).rejects.toThrow(
      'Duplicate stored scenario seed slug: im-cafe-bestellen',
    )
  })
})
