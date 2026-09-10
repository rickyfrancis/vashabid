import { getPayloadClient } from './getPayload'
import type {
  CollectionSlug,
  Payload,
  RequiredDataFromCollectionSlug,
  Sort,
  Where,
} from 'payload'

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

/**
 * A signed-in user on whose behalf a write is made.
 *
 * Typed loosely on purpose: this is whatever `payload.auth()` returned, and the
 * helpers below hand it straight back to Payload rather than interpreting it.
 */
type ActingUser = NonNullable<Parameters<Payload['create']>[0]['user']>

interface ActingOptions {
  headers?: Headers
  user: ActingUser
}

/**
 * A partial document for an update.
 *
 * Payload types its own update payload as `DeepPartial<...>` from
 * `ts-essentials`, a transitive dependency this project does not declare. The
 * shape is reproduced here so callers get a real, checked type, and the single
 * unavoidable cast is confined to the boundary call below.
 */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

type UpdateData<TSlug extends CollectionSlug> = DeepPartial<
  RequiredDataFromCollectionSlug<TSlug>
>

/**
 * Writes as a signed-in user, with that user's own permissions.
 *
 * The Local API defaults `overrideAccess` to `true`, which would ignore the
 * caller's permissions entirely, so both `user` and `overrideAccess: false` are
 * pinned here. A learner writing their own profile therefore passes exactly the
 * same access policies a REST request from that learner would.
 */
export async function createDocumentAs<TSlug extends CollectionSlug>(
  collection: TSlug,
  data: RequiredDataFromCollectionSlug<TSlug>,
  options: ActingOptions,
) {
  const payload = await getPayloadClient()

  return payload.create({
    collection,
    data,
    overrideAccess: false,
    user: options.user,
    ...(options.headers ? { req: { headers: options.headers } } : {}),
  })
}

/** The update sibling of `createDocumentAs`, under the same access rules. */
export async function updateDocumentAs<TSlug extends CollectionSlug>(
  collection: TSlug,
  id: number | string,
  data: UpdateData<TSlug>,
  options: ActingOptions,
) {
  const payload = await getPayloadClient()

  return payload.update({
    collection,
    // Structurally identical to Payload's own `DeepPartial`, but TypeScript
    // cannot prove that while `TSlug` is still generic.
    data: data as never,
    id,
    overrideAccess: false,
    user: options.user,
    ...(options.headers ? { req: { headers: options.headers } } : {}),
  })
}

/**
 * Reads a single document as a signed-in user.
 *
 * Access control turns "not yours" into an empty result rather than an error,
 * which is what lets a caller ask for "my profile" without first knowing
 * whether one exists.
 */
export async function findOneAs<TSlug extends CollectionSlug>(
  collection: TSlug,
  where: Where,
  options: ActingOptions & { depth?: number },
) {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection,
    depth: options.depth ?? 0,
    limit: 1,
    overrideAccess: false,
    user: options.user,
    where,
  })

  return result.docs[0] ?? null
}

export { getPayloadClient } from './getPayload'
