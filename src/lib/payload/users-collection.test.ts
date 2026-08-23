import type {
  CollectionBeforeLoginHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
  SelectField,
} from 'payload'
import { AuthenticationError } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { Users } from '../../../collections/Users'
import {
  promoteFirstUser,
  rejectSuspendedLogin,
} from '../../../collections/hooks/users'

function findSelectField(name: string): SelectField {
  const field = Users.fields.find(
    (candidate) => 'name' in candidate && candidate.name === name,
  )

  if (!field || field.type !== 'select') {
    throw new Error(`Missing select field: ${name}`)
  }

  return field
}

describe('users collection schema', () => {
  test.each([
    ['role', 'learner', ['admin', 'editor', 'learner'], true],
    ['accountStatus', 'active', ['active', 'suspended'], true],
    ['uiLocale', 'en', ['en', 'bn'], false],
    ['supportMode', 'en', ['en', 'bn', 'both'], false],
  ] as const)(
    'configures %s with its allowed values and default',
    (name, defaultValue, values, savesToJWT) => {
      const field = findSelectField(name)
      const configuredValues = field.options.map((option) =>
        typeof option === 'string' ? option : option.value,
      )

      expect(field.defaultValue).toBe(defaultValue)
      expect(field.required).toBe(true)
      expect(field.saveToJWT === true).toBe(savesToJWT)
      expect(configuredValues).toEqual(values)
    },
  )

  test('keeps display name optional and exposes useful admin columns', () => {
    const displayName = Users.fields.find(
      (field) => 'name' in field && field.name === 'displayName',
    )

    if (!displayName || displayName.type !== 'text') {
      throw new Error('Missing text field: displayName')
    }

    expect(displayName.required).toBeUndefined()
    expect(Users.admin?.defaultColumns).toEqual([
      'email',
      'displayName',
      'role',
      'accountStatus',
    ])
  })
})

describe('users collection hooks', () => {
  test('forces the first registered user to active admin', async () => {
    const count = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const data = { role: 'learner' as const, accountStatus: 'suspended' as const }

    const result = await promoteFirstUser({
      data,
      operation: 'create',
      req: { payload: { count } } as unknown as PayloadRequest,
    } as Parameters<CollectionBeforeValidateHook>[0])

    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        overrideAccess: true,
      }),
    )
    expect(result).toEqual({ role: 'admin', accountStatus: 'active' })
  })

  test('leaves later users on their requested/default role and status', async () => {
    const data = { role: 'editor' as const, accountStatus: 'active' as const }

    const result = await promoteFirstUser({
      data,
      operation: 'create',
      req: {
        payload: {
          count: vi.fn().mockResolvedValue({ totalDocs: 1 }),
        },
      } as unknown as PayloadRequest,
    } as Parameters<CollectionBeforeValidateHook>[0])

    expect(result).toEqual(data)
  })

  test('allows active accounts to log in', () => {
    const user = { id: 7, accountStatus: 'active' as const }

    expect(
      rejectSuspendedLogin({
        req: {} as PayloadRequest,
        user,
      } as Parameters<CollectionBeforeLoginHook>[0]),
    ).toBe(user)
  })

  test('rejects suspended and untyped accounts with a generic auth error', () => {
    const req = {
      t: vi.fn(() => 'Email or password incorrect.'),
    } as unknown as PayloadRequest

    expect(() =>
      rejectSuspendedLogin({
        req,
        user: { id: 7, accountStatus: 'suspended' },
      } as Parameters<CollectionBeforeLoginHook>[0]),
    ).toThrow(AuthenticationError)
    expect(() =>
      rejectSuspendedLogin({
        req,
        user: { id: 7 },
      } as Parameters<CollectionBeforeLoginHook>[0]),
    ).toThrow(AuthenticationError)
  })
})
