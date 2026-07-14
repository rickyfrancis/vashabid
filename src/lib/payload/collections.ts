import { getPayloadClient } from './getPayload'
import type { CollectionSlug, Where } from 'payload'

interface FindOptions {
  depth?: number
  limit?: number
  page?: number
  sort?: string
  where?: Where
}

export async function findPublished(
  collection: CollectionSlug,
  options: FindOptions = {},
) {
  const payload = await getPayloadClient()

  const baseWhere: Where = options.where ? { ...options.where } : {}

  const result = await payload.find({
    collection,
    ...options,
    where: {
      ...baseWhere,
      _status: { equals: 'published' },
    },
  })

  return result
}

export async function findBySlug(
  collection: CollectionSlug,
  slug: string,
  options: Omit<FindOptions, 'where'> = {},
) {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection,
    ...options,
    limit: 1,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
  })

  return result.docs[0] ?? null
}

export { getPayloadClient } from './getPayload'
