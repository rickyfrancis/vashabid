import { createHash } from 'node:crypto'

/** Shared bucket for requests that arrive without any usable client address. */
export const UNKNOWN_CLIENT_KEY = 'unknown'

const DEFAULT_FORWARDED_HEADER = 'x-forwarded-for'

/**
 * Derives a stable, non-reversible bucket key for one client.
 *
 * `x-forwarded-for` is a list that each proxy appends to, so the *first* entry
 * is whatever the client claimed and the *last* is the hop our own proxy saw.
 * We read the last entry, because the first one is trivially spoofable.
 *
 * The address is hashed immediately: nothing here or downstream ever holds a
 * raw IP, and the key is never written to the database.
 */
export function resolveClientKey(
  headers: Headers | undefined,
  forwardedHeader = process.env.RATE_LIMIT_FORWARDED_HEADER ||
    DEFAULT_FORWARDED_HEADER,
): string {
  const address =
    lastForwardedHop(headers?.get(forwardedHeader)) ??
    firstNonEmpty(headers?.get('x-real-ip'))

  return address ? hash(address) : UNKNOWN_CLIENT_KEY
}

function lastForwardedHop(value: null | string | undefined): null | string {
  if (!value) return null

  const hops = value
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean)

  return hops.at(-1) ?? null
}

function firstNonEmpty(value: null | string | undefined): null | string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32)
}
