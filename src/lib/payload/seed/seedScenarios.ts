import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

import type {
  GrammarTopic,
  Scenario,
  TopicTag,
  Word,
} from '../../../../payload-types'
import { richTextParagraphs } from '../fields'
import { scenarioSeeds } from './data/scenarios'
import type { ScenarioSeed } from './data/scenarios'
import type { SeedSummary } from './types'

type ScenarioData = RequiredDataFromCollectionSlug<'scenarios'>
type ReferenceCollection = 'grammar-topics' | 'topic-tags' | 'words'

function relationshipID(value: number | { id: number }): number {
  return typeof value === 'number' ? value : value.id
}

function stringRows(
  rows: null | undefined | unknown[],
  field: string,
): (string | undefined)[] {
  return (
    rows?.map(
      (row) => (row as Record<string, unknown>)[field] as string | undefined,
    ) ?? []
  )
}

/**
 * Serializes with sorted keys so comparisons survive a database round trip.
 *
 * Rich text is stored as `jsonb`, which does not preserve key order, so a plain
 * `JSON.stringify` comparison would report drift on every seed run.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null'
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))

  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function sameRichText(left: unknown, right: unknown): boolean {
  return stableStringify(left ?? null) === stableStringify(right ?? null)
}

function canonicalData(
  seed: ScenarioSeed,
  topicTags: number[],
  keyVocabulary: number[],
  relatedGrammarTopics: number[],
): ScenarioData {
  return {
    _status: 'published',
    bangla: seed.bangla
      ? {
          culturalNotes: (seed.bangla.culturalNotes ?? []).map((note) => ({
            note,
          })),
          explanation: richTextParagraphs(...seed.bangla.explanation),
        }
      : undefined,
    cefrLevel: seed.cefrLevel,
    dialogue: seed.dialogue.map((line) => ({
      banglaExplanation: line.banglaExplanation,
      englishExplanation: line.englishExplanation,
      germanLine: line.germanLine,
      speaker: line.speaker,
    })),
    english: {
      culturalNotes: (seed.englishCulturalNotes ?? []).map((note) => ({
        note,
      })),
      explanation: richTextParagraphs(...seed.englishExplanation),
    },
    generateSlug: false,
    keyVocabulary,
    learnerGoal: seed.learnerGoal,
    relatedGrammarTopics,
    review: {
      banglaReviewed: seed.bangla?.reviewed ?? false,
      englishReviewed: true,
      germanReviewed: true,
    },
    situationType: seed.situationType,
    slug: seed.slug,
    title: seed.title,
    topicTags,
  }
}

function sameRelationship(
  docValue: (number | { id: number })[] | null | undefined,
  dataValue: (number | { id: number })[] | null | undefined,
): boolean {
  return (
    JSON.stringify(docValue?.map(relationshipID) ?? []) ===
    JSON.stringify((dataValue ?? []).map(relationshipID))
  )
}

function matchesCanonicalData(doc: Scenario, data: ScenarioData): boolean {
  return (
    doc._status === data._status &&
    doc.title === data.title &&
    doc.slug === data.slug &&
    doc.generateSlug === data.generateSlug &&
    doc.cefrLevel === data.cefrLevel &&
    doc.situationType === data.situationType &&
    doc.learnerGoal === data.learnerGoal &&
    sameRelationship(doc.topicTags, data.topicTags) &&
    sameRelationship(doc.keyVocabulary, data.keyVocabulary) &&
    sameRelationship(
      doc.relatedGrammarTopics,
      data.relatedGrammarTopics,
    ) &&
    sameRichText(doc.english.explanation, data.english.explanation) &&
    JSON.stringify(stringRows(doc.english.culturalNotes, 'note')) ===
      JSON.stringify(stringRows(data.english.culturalNotes, 'note')) &&
    sameRichText(doc.bangla?.explanation, data.bangla?.explanation) &&
    JSON.stringify(stringRows(doc.bangla?.culturalNotes, 'note')) ===
      JSON.stringify(stringRows(data.bangla?.culturalNotes, 'note')) &&
    JSON.stringify(stringRows(doc.dialogue, 'speaker')) ===
      JSON.stringify(stringRows(data.dialogue, 'speaker')) &&
    JSON.stringify(stringRows(doc.dialogue, 'germanLine')) ===
      JSON.stringify(stringRows(data.dialogue, 'germanLine')) &&
    JSON.stringify(stringRows(doc.dialogue, 'englishExplanation')) ===
      JSON.stringify(stringRows(data.dialogue, 'englishExplanation')) &&
    JSON.stringify(stringRows(doc.dialogue, 'banglaExplanation')) ===
      JSON.stringify(stringRows(data.dialogue, 'banglaExplanation')) &&
    doc.review?.germanReviewed === data.review?.germanReviewed &&
    doc.review?.englishReviewed === data.review?.englishReviewed &&
    doc.review?.banglaReviewed === data.review?.banglaReviewed
  )
}

export function assertUniqueScenarioSeedSlugs(
  seeds: readonly ScenarioSeed[],
): void {
  const seen = new Set<string>()

  for (const seed of seeds) {
    if (seen.has(seed.slug)) {
      throw new Error(`Duplicate scenario seed slug: ${seed.slug}`)
    }
    seen.add(seed.slug)
  }
}

export function assertValidScenarioSeedRelations(
  seeds: readonly ScenarioSeed[],
): void {
  for (const seed of seeds) {
    for (const [label, slugs] of [
      ['key vocabulary', seed.wordSlugs],
      ['grammar topic', seed.grammarSlugs],
      ['topic tag', seed.topicSlugs],
    ] as const) {
      const seen = new Set<string>()

      for (const slug of slugs) {
        if (seen.has(slug)) {
          throw new Error(
            `Duplicate ${label} seed ${slug} for scenario ${seed.slug}`,
          )
        }
        seen.add(slug)
      }
    }
  }
}

async function resolveBySlug(
  payload: Payload,
  collection: ReferenceCollection,
  slugs: string[],
  missingMessage: (slug: string) => string,
): Promise<Map<string, number>> {
  if (slugs.length === 0) return new Map()

  const result = await payload.find({
    collection,
    depth: 0,
    draft: true,
    limit: Math.max(slugs.length * 2, 1),
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        in: slugs,
      },
    },
  })

  const idsBySlug = new Map<string, number>()

  for (const doc of result.docs as (GrammarTopic | TopicTag | Word)[]) {
    if (!slugs.includes(doc.slug)) continue
    if (idsBySlug.has(doc.slug)) {
      throw new Error(`Duplicate ${collection} seed slug: ${doc.slug}`)
    }
    idsBySlug.set(doc.slug, doc.id)
  }

  for (const slug of slugs) {
    if (!idsBySlug.has(slug)) throw new Error(missingMessage(slug))
  }

  return idsBySlug
}

async function findStoredScenario(
  payload: Payload,
  seed: ScenarioSeed,
): Promise<Scenario | undefined> {
  const result = await payload.find({
    collection: 'scenarios',
    depth: 0,
    draft: true,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        equals: seed.slug,
      },
    },
  })

  if (result.docs.length > 1) {
    throw new Error(`Duplicate stored scenario seed slug: ${seed.slug}`)
  }

  return result.docs[0] as Scenario | undefined
}

export async function seedScenarios(
  payload: Payload,
  seeds: readonly ScenarioSeed[] = scenarioSeeds,
): Promise<SeedSummary> {
  assertUniqueScenarioSeedSlugs(seeds)
  assertValidScenarioSeedRelations(seeds)

  const topicIDs = await resolveBySlug(
    payload,
    'topic-tags',
    [...new Set(seeds.flatMap((seed) => seed.topicSlugs))],
    (slug) => `Missing topic tag seed for scenario: ${slug}`,
  )
  const wordIDs = await resolveBySlug(
    payload,
    'words',
    [...new Set(seeds.flatMap((seed) => seed.wordSlugs))],
    (slug) => `Missing key vocabulary seed for scenario: ${slug}`,
  )
  const grammarIDs = await resolveBySlug(
    payload,
    'grammar-topics',
    [...new Set(seeds.flatMap((seed) => seed.grammarSlugs))],
    (slug) => `Missing grammar topic seed for scenario: ${slug}`,
  )

  const summary: SeedSummary = { created: 0, unchanged: 0, updated: 0 }

  for (const seed of seeds) {
    const data = canonicalData(
      seed,
      seed.topicSlugs.map((slug) => topicIDs.get(slug) as number),
      seed.wordSlugs.map((slug) => wordIDs.get(slug) as number),
      seed.grammarSlugs.map((slug) => grammarIDs.get(slug) as number),
    )
    const existing = await findStoredScenario(payload, seed)

    if (!existing) {
      summary.created += 1
      await payload.create({
        collection: 'scenarios',
        data,
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    if (matchesCanonicalData(existing, data)) {
      summary.unchanged += 1
      continue
    }

    summary.updated += 1
    await payload.update({
      collection: 'scenarios',
      data,
      draft: false,
      id: existing.id,
      overrideAccess: true,
    })
  }

  return summary
}
