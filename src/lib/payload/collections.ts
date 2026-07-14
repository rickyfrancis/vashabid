import { getPayloadClient } from './getPayload'

interface FindOptions {
  depth?: number
  limit?: number
  page?: number
  sort?: string
  where?: Record<string, unknown>
}

export async function findPublished(
  collection: string,
  options: FindOptions = {},
) {
  const payload = await getPayloadClient()

  const baseWhere: Record<string, unknown> = options.where
    ? { ...options.where }
    : {}

  const result = await payload.find({
    collection: collection as 'users',
    ...options,
    where: {
      ...baseWhere,
      _status: { equals: 'published' },
    },
  } as any)

  return result
}

export async function findBySlug(
  collection: string,
  slug: string,
  options: Omit<FindOptions, 'where'> = {},
) {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: collection as 'users',
    ...options,
    limit: 1,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
  } as any)

  return result.docs[0] ?? null
}

export { getPayloadClient } from './getPayload'
