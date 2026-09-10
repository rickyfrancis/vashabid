import { getPayloadClient } from './getPayload'
import type { CollectionSlug, RequiredDataFromCollectionSlug, Sort, Where } from 'payload'

interface FindOptions {
  depth?: number
  limit?: number
  page?: number
  pagination?: boolean
  sort?: Sort
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
    overrideAccess: false,
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
    overrideAccess: false,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
  })

  return result.docs[0] ?? null
}

interface CreateOptions {
  /**
   * Incoming request headers, forwarded so collection hooks see the real client.
   *
   * Payload's `createLocalReq` only substitutes an empty `Headers` when none is
   * supplied, so passing these through is what lets a rate-limit hook derive
   * the same client key on the Local API path as on the REST path.
   */
  headers?: Headers
}

/**
 * The one write path into Payload from application code.
 *
 * Like `findPublished`, it pins `overrideAccess: false` — and here that matters
 * more, because the Local API defaults it to `true`. Running writes under access
 * control means collection and field policies apply to a server action exactly
 * as they do to a REST request, so there is no privileged back door.
 */
export async function createDocument<TSlug extends CollectionSlug>(
  collection: TSlug,
  data: RequiredDataFromCollectionSlug<TSlug>,
  options: CreateOptions = {},
) {
  const payload = await getPayloadClient()

  return payload.create({
    collection,
    data,
    overrideAccess: false,
    ...(options.headers ? { req: { headers: options.headers } } : {}),
  })
}

export { getPayloadClient } from './getPayload'
