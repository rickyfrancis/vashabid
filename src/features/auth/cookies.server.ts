import 'server-only'

import { cookies } from 'next/headers'
import {
  generateExpiredPayloadCookie,
  generatePayloadCookie,
} from 'payload/shared'

import { getPayloadClient } from '@/lib/payload'

/**
 * Builds the auth cookie with Payload's own generator rather than by hand.
 *
 * `payload.login()` returns a token but sets no cookie, so establishing the
 * session is our job. The attributes that matter — name, `httpOnly`, `sameSite`,
 * `secure`, `path`, and an expiry derived from `tokenExpiration` — all come from
 * the collection's sanitized auth config, so a change to `cookiePrefix` or the
 * token lifetime in `payload.config.ts` is picked up here automatically instead
 * of drifting away from a hardcoded copy.
 */
async function authCookieConfig() {
  const payload = await getPayloadClient()

  return {
    collectionAuthConfig: payload.collections.users.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookie = generatePayloadCookie({
    ...(await authCookieConfig()),
    returnCookieAsObject: true,
    token,
  })

  const store = await cookies()

  store.set(cookie.name, cookie.value ?? '', {
    domain: cookie.domain,
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
    httpOnly: cookie.httpOnly,
    path: cookie.path,
    sameSite: cookie.sameSite?.toLowerCase() as
      | 'lax'
      | 'none'
      | 'strict'
      | undefined,
    secure: cookie.secure,
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookie = generateExpiredPayloadCookie({
    ...(await authCookieConfig()),
    returnCookieAsObject: true,
  })

  const store = await cookies()

  store.set(cookie.name, '', {
    domain: cookie.domain,
    expires: new Date(0),
    httpOnly: cookie.httpOnly,
    path: cookie.path,
    sameSite: cookie.sameSite?.toLowerCase() as
      | 'lax'
      | 'none'
      | 'strict'
      | undefined,
    secure: cookie.secure,
  })
}
