import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

import type { GrammarTopic, TopicTag, Word } from '../../../../payload-types'
import { richTextParagraphs } from '../fields'
import { grammarTopicSeeds } from './data/grammarTopics'
import type { GrammarTopicSeed } from './data/grammarTopics'
import type { SeedSummary } from './types'

type GrammarTopicData = RequiredDataFromCollectionSlug<'grammar-topics'>

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
  seed: GrammarTopicSeed,
  topicTags: number[],
  relatedWords: number[],
): GrammarTopicData {
  return {
    _status: 'published',
    bangla: seed.bangla
      ? {
          commonMistakes: (seed.bangla.commonMistakes ?? []).map((mistake) => ({
            mistake,
          })),
          explanation: richTextParagraphs(...seed.bangla.explanation),
        }
      : undefined,
    cefrLevel: seed.cefrLevel,
    english: {
      commonMistakes: (seed.englishCommonMistakes ?? []).map((mistake) => ({
        mistake,
      })),
      explanation: richTextParagraphs(...seed.englishExplanation),
    },
    examples: seed.examples.map((example) => ({
      banglaExplanation: example.banglaExplanation,
      englishExplanation: example.englishExplanation,
      germanSentence: example.germanSentence,
    })),
    generateSlug: false,
    name: seed.name,
    relatedWords,
    review: {
      banglaReviewed: seed.bangla?.reviewed ?? false,
      englishReviewed: true,
      germanReviewed: true,
    },
    shortRule: seed.shortRule,
    slug: seed.slug,
    topicTags,
  }
}

function matchesCanonicalData(
  doc: GrammarTopic,
  data: GrammarTopicData,
): boolean {
  const docTopics = doc.topicTags?.map(relationshipID) ?? []
  const dataTopics = (data.topicTags ?? []).map((tag) =>
    typeof tag === 'number' ? tag : tag.id,
  )
  const docRelated = doc.relatedWords?.map(relationshipID) ?? []
  const dataRelated = (data.relatedWords ?? []).map((word) =>
    typeof word === 'number' ? word : word.id,
  )

  return (
    doc._status === data._status &&
    doc.name === data.name &&
    doc.slug === data.slug &&
    doc.generateSlug === data.generateSlug &&
    doc.cefrLevel === data.cefrLevel &&
    doc.shortRule === data.shortRule &&
    JSON.stringify(docTopics) === JSON.stringify(dataTopics) &&
    JSON.stringify(docRelated) === JSON.stringify(dataRelated) &&
    sameRichText(doc.english.explanation, data.english.explanation) &&
    JSON.stringify(stringRows(doc.english.commonMistakes, 'mistake')) ===
      JSON.stringify(stringRows(data.english.commonMistakes, 'mistake')) &&
    sameRichText(doc.bangla?.explanation, data.bangla?.explanation) &&
    JSON.stringify(stringRows(doc.bangla?.commonMistakes, 'mistake')) ===
      JSON.stringify(stringRows(data.bangla?.commonMistakes, 'mistake')) &&
    JSON.stringify(stringRows(doc.examples, 'germanSentence')) ===
      JSON.stringify(stringRows(data.examples, 'germanSentence')) &&
    JSON.stringify(stringRows(doc.examples, 'englishExplanation')) ===
      JSON.stringify(stringRows(data.examples, 'englishExplanation')) &&
    JSON.stringify(stringRows(doc.examples, 'banglaExplanation')) ===
      JSON.stringify(stringRows(data.examples, 'banglaExplanation')) &&
    doc.review?.germanReviewed === data.review?.germanReviewed &&
    doc.review?.englishReviewed === data.review?.englishReviewed &&
    doc.review?.banglaReviewed === data.review?.banglaReviewed
  )
}

export function assertUniqueGrammarTopicSeedSlugs(
  seeds: readonly GrammarTopicSeed[],
): void {
  const seen = new Set<string>()

  for (const seed of seeds) {
    if (seen.has(seed.slug)) {
      throw new Error(`Duplicate grammar topic seed slug: ${seed.slug}`)
    }
    seen.add(seed.slug)
  }
}

export function assertValidGrammarTopicSeedRelations(
  seeds: readonly GrammarTopicSeed[],
): void {
  for (const seed of seeds) {
    const seen = new Set<string>()

    for (const relatedSlug of seed.relatedSlugs) {
      if (seen.has(relatedSlug)) {
        throw new Error(
          `Duplicate related word seed ${relatedSlug} for grammar topic ${seed.slug}`,
        )
      }
      seen.add(relatedSlug)
    }
  }
}

async function resolveBySlug(
  payload: Payload,
  collection: 'topic-tags' | 'words',
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

  for (const doc of result.docs as (TopicTag | Word)[]) {
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

async function findStoredGrammarTopic(
  payload: Payload,
  seed: GrammarTopicSeed,
): Promise<GrammarTopic | undefined> {
  const result = await payload.find({
    collection: 'grammar-topics',
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
    throw new Error(`Duplicate stored grammar topic seed slug: ${seed.slug}`)
  }

  return result.docs[0] as GrammarTopic | undefined
}

export async function seedGrammarTopics(
  payload: Payload,
  seeds: readonly GrammarTopicSeed[] = grammarTopicSeeds,
): Promise<SeedSummary> {
  assertUniqueGrammarTopicSeedSlugs(seeds)
  assertValidGrammarTopicSeedRelations(seeds)

  const topicIDs = await resolveBySlug(
    payload,
    'topic-tags',
    [...new Set(seeds.flatMap((seed) => seed.topicSlugs))],
    (slug) => `Missing topic tag seed for grammar topic: ${slug}`,
  )
  const wordIDs = await resolveBySlug(
    payload,
    'words',
    [...new Set(seeds.flatMap((seed) => seed.relatedSlugs))],
    (slug) => `Missing related word seed for grammar topic: ${slug}`,
  )

  const summary: SeedSummary = { created: 0, unchanged: 0, updated: 0 }

  for (const seed of seeds) {
    const data = canonicalData(
      seed,
      seed.topicSlugs.map((slug) => topicIDs.get(slug) as number),
      seed.relatedSlugs.map((slug) => wordIDs.get(slug) as number),
    )
    const existing = await findStoredGrammarTopic(payload, seed)

    if (!existing) {
      summary.created += 1
      await payload.create({
        collection: 'grammar-topics',
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
      collection: 'grammar-topics',
      data,
      draft: false,
      id: existing.id,
      overrideAccess: true,
    })
  }

  return summary
}
