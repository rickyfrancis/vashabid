import { describe, expect, test } from 'vitest'

import { getActivePayloadUser } from '@/lib/payload/access/values'
import type { SessionUser } from './types'

const sessionUser: SessionUser = {
  accountStatus: 'active',
  displayName: 'Rifat',
  email: 'rifat@example.com',
  id: 7,
  role: 'learner',
  supportMode: 'bn',
  uiLocale: 'bn',
}

describe('the session user as a write actor', () => {
  test('satisfies the gate every access policy runs it through', () => {
    // Learned the hard way: without `accountStatus` this returns null, every
    // policy fails closed, and onboarding silently refuses to save.
    const actor = { ...sessionUser, collection: 'users' as const }

    expect(getActivePayloadUser(actor)).not.toBeNull()
  })

  test('is rejected if any part of the identity is dropped', () => {
    const actor: Record<string, unknown> = {
      ...sessionUser,
      collection: 'users',
    }

    for (const field of ['accountStatus', 'role', 'id', 'collection']) {
      const incomplete = { ...actor }
      delete incomplete[field]

      expect(getActivePayloadUser(incomplete)).toBeNull()
    }
  })

  test('carries nothing a client component should not see', () => {
    // A view model, not the Payload document: no password hash, no session
    // array, no `_sid`.
    for (const field of ['hash', 'salt', 'password', 'sessions', '_sid']) {
      expect(sessionUser).not.toHaveProperty(field)
    }
  })
})
