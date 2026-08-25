import type {
  Payload,
  RequiredDataFromCollectionSlug,
} from 'payload'

import type { TopicTag, Word } from '../../../../payload-types'
import { wordSeeds } from './data/words'
import type { WordSeed } from './data/words'
import type { SeedSummary } from './types'

type WordData = RequiredDataFromCollectionSlug<'words'>

function relationshipID(value: number | TopicTag): number {
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

function sameOptional(left: unknown, right: unknown): boolean {
  return (left ?? null) === (right ?? null)
}

function canonicalData(
  seed: WordSeed,
  topicTags: number[],
): WordData {
  return {
    _status: 'published',
    bangla: seed.bangla
      ? {
          explanation: seed.bangla.explanation,
          meanings: [{ meaning: seed.bangla.meaning }],
          pronunciationHints: seed.bangla.pronunciationHint
            ? [{ hint: seed.bangla.pronunciationHint }]
            : [],
          romanizedHelper: seed.bangla.romanizedHelper,
        }
      : undefined,
    cefrLevel: seed.cefrLevel,
    english: {
      explanation: seed.englishExplanation,
      meanings: [{ meaning: seed.englishMeaning }],
    },
    examples: [
      {
        banglaExplanation: seed.example.banglaExplanation,
        englishExplanation: seed.example.englishExplanation,
        germanSentence: seed.example.germanSentence,
      },
    ],
    gender: seed.gender,
    generateSlug: false,
    ipa: seed.ipa,
    lemma: seed.lemma,
    lifecycleStatus: 'active',
    pluralForm: seed.pluralForm,
    register: seed.register,
    review: {
      audioReviewed: false,
      banglaReviewed: seed.bangla?.reviewed ?? false,
      englishReviewed: true,
      germanReviewed: true,
      quizReviewed: false,
    },
    slug: seed.slug,
    topicTags,
    usefulnessScore: seed.usefulnessScore,
    wordType: seed.wordType,
  }
}

function matchesCanonicalData(doc: Word, data: WordData): boolean {
  const docTopics = doc.topicTags?.map(relationshipID) ?? []
  const dataTopics = (data.topicTags ?? []).map((tag) =>
    typeof tag === 'number' ? tag : tag.id,
  )

  return (
    doc._status === data._status &&
    doc.lemma === data.lemma &&
    doc.slug === data.slug &&
    doc.generateSlug === data.generateSlug &&
    doc.wordType === data.wordType &&
    doc.cefrLevel === data.cefrLevel &&
    sameOptional(doc.gender, data.gender) &&
    sameOptional(doc.pluralForm, data.pluralForm) &&
    sameOptional(doc.ipa, data.ipa) &&
    doc.register === data.register &&
    doc.usefulnessScore === data.usefulnessScore &&
    doc.lifecycleStatus === data.lifecycleStatus &&
    JSON.stringify(docTopics) === JSON.stringify(dataTopics) &&
    JSON.stringify(stringRows(doc.english.meanings, 'meaning')) ===
      JSON.stringify(stringRows(data.english.meanings, 'meaning')) &&
    sameOptional(doc.english.explanation, data.english.explanation) &&
    JSON.stringify(stringRows(doc.bangla?.meanings, 'meaning')) ===
      JSON.stringify(stringRows(data.bangla?.meanings, 'meaning')) &&
    sameOptional(doc.bangla?.explanation, data.bangla?.explanation) &&
    JSON.stringify(stringRows(doc.bangla?.pronunciationHints, 'hint')) ===
      JSON.stringify(stringRows(data.bangla?.pronunciationHints, 'hint')) &&
    sameOptional(doc.bangla?.romanizedHelper, data.bangla?.romanizedHelper) &&
    JSON.stringify(stringRows(doc.examples, 'germanSentence')) ===
      JSON.stringify(stringRows(data.examples, 'germanSentence')) &&
    JSON.stringify(stringRows(doc.examples, 'englishExplanation')) ===
      JSON.stringify(stringRows(data.examples, 'englishExplanation')) &&
    JSON.stringify(stringRows(doc.examples, 'banglaExplanation')) ===
      JSON.stringify(stringRows(data.examples, 'banglaExplanation')) &&
    doc.review?.germanReviewed === data.review?.germanReviewed &&
    doc.review?.englishReviewed === data.review?.englishReviewed &&
    doc.review?.banglaReviewed === data.review?.banglaReviewed &&
    doc.review?.audioReviewed === data.review?.audioReviewed &&
    doc.review?.quizReviewed === data.review?.quizReviewed
  )
}

export function assertUniqueWordSeedSlugs(
  seeds: readonly WordSeed[],
): void {
  const seen = new Set<string>()

  for (const seed of seeds) {
    if (seen.has(seed.slug)) {
      throw new Error(`Duplicate word seed slug: ${seed.slug}`)
    }
    seen.add(seed.slug)
  }
}

async function resolveTopicTags(
  payload: Payload,
  seeds: readonly WordSeed[],
): Promise<Map<string, number>> {
  const expectedSlugs = [...new Set(seeds.flatMap((seed) => seed.topicSlugs))]
  const result = await payload.find({
    collection: 'topic-tags',
    depth: 0,
    draft: true,
    limit: Math.max(expectedSlugs.length * 2, 1),
    overrideAccess: true,
    pagination: false,
    where: {
      slug: {
        in: expectedSlugs,
      },
    },
  })

  const idsBySlug = new Map<string, number>()

  for (const tag of result.docs as TopicTag[]) {
    if (!expectedSlugs.includes(tag.slug)) continue
    if (idsBySlug.has(tag.slug)) {
      throw new Error(`Duplicate topic tag seed slug: ${tag.slug}`)
    }
    idsBySlug.set(tag.slug, tag.id)
  }

  for (const slug of expectedSlugs) {
    if (!idsBySlug.has(slug)) {
      throw new Error(`Missing topic tag seed for word: ${slug}`)
    }
  }

  return idsBySlug
}

async function seedWord(
  payload: Payload,
  seed: WordSeed,
  topicIDs: Map<string, number>,
  summary: SeedSummary,
): Promise<void> {
  const data = canonicalData(
    seed,
    seed.topicSlugs.map((slug) => topicIDs.get(slug) as number),
  )
  const result = await payload.find({
    collection: 'words',
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
    throw new Error(`Duplicate stored word seed slug: ${seed.slug}`)
  }

  const existing = result.docs[0] as Word | undefined

  if (!existing) {
    summary.created += 1
    await payload.create({
      collection: 'words',
      data,
      draft: false,
      overrideAccess: true,
    })
    return
  }

  if (matchesCanonicalData(existing, data)) {
    summary.unchanged += 1
    return
  }

  summary.updated += 1
  await payload.update({
    collection: 'words',
    data,
    draft: false,
    id: existing.id,
    overrideAccess: true,
  })
}

export async function seedWords(
  payload: Payload,
  seeds: readonly WordSeed[] = wordSeeds,
): Promise<SeedSummary> {
  assertUniqueWordSeedSlugs(seeds)

  const topicIDs = await resolveTopicTags(payload, seeds)
  const summary: SeedSummary = { created: 0, unchanged: 0, updated: 0 }

  for (const seed of seeds) {
    await seedWord(payload, seed, topicIDs, summary)
  }

  return summary
}
