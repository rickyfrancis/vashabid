import type {
  Payload,
  RequiredDataFromCollectionSlug,
} from 'payload'

import type { TopicTag } from '../../../../payload-types'
import { topicTagSeeds } from './data/topicTags'
import type { TopicTagSeed } from './data/topicTags'

type TopicTagData = RequiredDataFromCollectionSlug<'topic-tags'>

export interface SeedSummary {
  created: number
  unchanged: number
  updated: number
}

function relationshipID(value: TopicTag['parent']): number | null {
  if (typeof value === 'number') return value
  return value?.id ?? null
}

function canonicalData(
  seed: TopicTagSeed,
  parent: number | null,
): TopicTagData {
  return {
    _status: 'published',
    bangla: {
      description: seed.banglaDescription,
    },
    english: {
      description: seed.englishDescription,
    },
    generateSlug: false,
    name: seed.name,
    parent,
    review: {
      banglaReviewed: true,
      englishReviewed: true,
      germanReviewed: true,
    },
    slug: seed.slug,
    sortOrder: seed.sortOrder,
  }
}

function matchesCanonicalData(doc: TopicTag, data: TopicTagData): boolean {
  return (
    doc._status === data._status &&
    doc.name === data.name &&
    doc.slug === data.slug &&
    doc.generateSlug === data.generateSlug &&
    doc.english.description === data.english.description &&
    doc.bangla?.description === data.bangla?.description &&
    doc.sortOrder === data.sortOrder &&
    relationshipID(doc.parent) === data.parent &&
    doc.review?.germanReviewed === data.review?.germanReviewed &&
    doc.review?.englishReviewed === data.review?.englishReviewed &&
    doc.review?.banglaReviewed === data.review?.banglaReviewed
  )
}

async function seedTag(
  payload: Payload,
  seed: TopicTagSeed,
  parent: number | null,
  summary: SeedSummary,
): Promise<TopicTag> {
  const data = canonicalData(seed, parent)
  const result = await payload.find({
    collection: 'topic-tags',
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
    throw new Error(`Duplicate topic tag seed slug: ${seed.slug}`)
  }

  const existing = result.docs[0] as TopicTag | undefined

  if (!existing) {
    summary.created += 1
    return payload.create({
      collection: 'topic-tags',
      data,
      draft: false,
      overrideAccess: true,
    })
  }

  if (matchesCanonicalData(existing, data)) {
    summary.unchanged += 1
    return existing
  }

  summary.updated += 1
  return payload.update({
    collection: 'topic-tags',
    data,
    draft: false,
    id: existing.id,
    overrideAccess: true,
  })
}

export async function seedTopicTags(
  payload: Payload,
): Promise<SeedSummary> {
  const summary: SeedSummary = { created: 0, unchanged: 0, updated: 0 }
  const idsBySlug = new Map<string, number>()
  const roots = topicTagSeeds.filter((seed) => seed.parentSlug === null)
  const children = topicTagSeeds.filter((seed) => seed.parentSlug !== null)

  for (const seed of roots) {
    const doc = await seedTag(payload, seed, null, summary)
    idsBySlug.set(seed.slug, doc.id)
  }

  for (const seed of children) {
    const parent = idsBySlug.get(seed.parentSlug as string)

    if (parent === undefined) {
      throw new Error(
        `Missing parent seed ${seed.parentSlug} for topic tag ${seed.slug}`,
      )
    }

    const doc = await seedTag(payload, seed, parent, summary)
    idsBySlug.set(seed.slug, doc.id)
  }

  return summary
}
