import type {
  CollectionBeforeLoginHook,
  PayloadRequest,
  SelectField,
} from 'payload'
import { AuthenticationError } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { Users } from '../../../collections/Users'
import {
  createSignupRateLimitHook,
  enforceSignupSubmission,
  forceLearnerDefaults,
  rejectSuspendedLogin,
  SEED_CONTEXT_FLAG,
} from '../../../collections/hooks/users'
import { PASSWORD_MIN_LENGTH } from '../../features/auth/constants'

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

describe('users collection auth config', () => {
  test('states the login defences the signup rules lean on', () => {
    const auth = Users.auth

    if (typeof auth !== 'object') throw new Error('auth must be configured')
    expect(auth.maxLoginAttempts).toBe(5)
    expect(auth.lockTime).toBe(10 * 60 * 1000)
    // No email adapter is configured, so switching verification on would lock
    // every new learner out behind a mail that only reaches the console.
    expect(auth.verify).toBe(false)
  })

  test('no longer promotes anybody on an empty database', () => {
    // The old `promoteFirstUser` made the first created account an admin. That
    // was harmless while `create` was admin-only, and a privilege-escalation
    // hazard the moment signup went public: the first stranger to sign up on a
    // fresh deploy would have been promoted by our own hook.
    const names = (Users.hooks?.beforeValidate ?? []).map((hook) => hook.name)

    expect(names).not.toContain('promoteFirstUser')
    expect(names).toEqual(['enforceSignupSubmission', 'forceLearnerDefaults'])
  })
})

describe('signup rate limiting', () => {
  function request(user: unknown = null): PayloadRequest {
    return { headers: new Headers(), user } as unknown as PayloadRequest
  }

  test('refuses an anonymous create once the window is exhausted', () => {
    const hook = createSignupRateLimitHook({
      consume: vi.fn().mockReturnValue({ allowed: false, retryAfterMs: 4000 }),
    })

    expect(() =>
      hook({ args: {}, operation: 'create', req: request() } as never),
    ).toThrow(expect.objectContaining({ status: 429 }))
  })

  test('lets an allowed request through untouched', () => {
    const hook = createSignupRateLimitHook({
      consume: vi.fn().mockReturnValue({ allowed: true, retryAfterMs: 0 }),
    })
    const args = { data: {} }

    expect(
      hook({ args, operation: 'create', req: request() } as never),
    ).toBe(args)
  })

  test('exempts editorial users, who create accounts from the admin panel', () => {
    const consume = vi.fn()
    const hook = createSignupRateLimitHook({ consume })

    hook({
      args: {},
      operation: 'create',
      req: request({
        accountStatus: 'active',
        collection: 'users',
        id: 1,
        role: 'admin',
      }),
    } as never)

    expect(consume).not.toHaveBeenCalled()
  })

  test('does not exempt a suspended admin', () => {
    const consume = vi
      .fn()
      .mockReturnValue({ allowed: true, retryAfterMs: 0 })
    const hook = createSignupRateLimitHook({ consume })

    hook({
      args: {},
      operation: 'create',
      req: request({
        accountStatus: 'suspended',
        collection: 'users',
        id: 1,
        role: 'admin',
      }),
    } as never)

    expect(consume).toHaveBeenCalled()
  })

  test('ignores operations other than create', () => {
    const consume = vi.fn()
    const hook = createSignupRateLimitHook({ consume })

    hook({ args: {}, operation: 'update', req: request() } as never)

    expect(consume).not.toHaveBeenCalled()
  })
})

describe('signup validation', () => {
  const valid = {
    displayName: 'Rifat',
    email: 'rifat@example.com',
    password: 'a-long-enough-password',
    uiLocale: 'en',
  }

  function anonymous(data: Record<string, unknown>) {
    return {
      data,
      operation: 'create' as const,
      req: { user: null } as unknown as PayloadRequest,
    }
  }

  test('accepts a well-formed anonymous signup', () => {
    expect(
      enforceSignupSubmission(anonymous(valid) as never),
    ).toBeDefined()
  })

  test('enforces the password minimum Payload does not', () => {
    // Payload ships no minimum password length, so a direct REST post would
    // otherwise be free to set a one-character password.
    expect(() =>
      enforceSignupSubmission(
        anonymous({ ...valid, password: 'x'.repeat(PASSWORD_MIN_LENGTH - 1) }) as never,
      ),
    ).toThrow()
  })

  test.each([
    ['a malformed email', { email: 'learner@localhost@x' }],
    ['a blank display name', { displayName: '  ' }],
  ])('refuses %s on the REST path too', (_label, override) => {
    expect(() =>
      enforceSignupSubmission(anonymous({ ...valid, ...override }) as never),
    ).toThrow()
  })

  test('leaves an editorial create to the admin form rules', () => {
    const data = { email: 'x' }

    expect(
      enforceSignupSubmission({
        data,
        operation: 'create',
        req: {
          user: {
            accountStatus: 'active',
            collection: 'users',
            id: 1,
            role: 'admin',
          },
        } as unknown as PayloadRequest,
      } as never),
    ).toBe(data)
  })
})

describe('forceLearnerDefaults', () => {
  function result(data: Record<string, unknown>, user: unknown = null) {
    return forceLearnerDefaults({
      data,
      operation: 'create',
      req: { user } as unknown as PayloadRequest,
    } as never) as Record<string, unknown>
  }

  test('stores an injected admin role as an ordinary learner', () => {
    // Field access has already stripped this by the time the hook runs; the
    // hook sets the trusted value rather than racing the attacker's.
    const data = result({ role: 'admin', accountStatus: 'suspended' })

    expect(data.role).toBe('learner')
    expect(data.accountStatus).toBe('active')
  })

  test('keeps the rest of the submission intact', () => {
    const data = result({ displayName: 'Rifat', email: 'r@example.com' })

    expect(data.displayName).toBe('Rifat')
    expect(data.email).toBe('r@example.com')
  })

  test('lets an admin assign an editorial role deliberately', () => {
    const data = result({ role: 'editor' }, {
      accountStatus: 'active',
      collection: 'users',
      id: 1,
      role: 'admin',
    })

    expect(data.role).toBe('editor')
  })

  test.each([
    ['an editor', 'editor'],
    ['a learner', 'learner'],
  ])('does not let %s mint an admin', (_label, role) => {
    const data = result({ role: 'admin' }, {
      accountStatus: 'active',
      collection: 'users',
      id: 1,
      role,
    })

    expect(data.role).toBe('learner')
  })

  test('lets the seeder mint an admin through an unforgeable context flag', () => {
    // Found the hard way: without this the seeder created its admin and the
    // hook immediately demoted it to a learner. `createPayloadRequest`
    // hardcodes `context: {}`, so no REST client can set this.
    const data = forceLearnerDefaults({
      context: { [SEED_CONTEXT_FLAG]: true },
      data: { role: 'admin' },
      operation: 'create',
      req: { user: null } as unknown as PayloadRequest,
    } as never) as Record<string, unknown>

    expect(data.role).toBe('admin')
  })

  test.each([
    ['an absent context', undefined],
    ['an empty context, as REST always supplies', {}],
    ['a falsy flag', { [SEED_CONTEXT_FLAG]: false }],
    ['a string that merely looks right', { [SEED_CONTEXT_FLAG]: 'true' }],
  ])('still forces a learner for %s', (_label, context) => {
    const data = forceLearnerDefaults({
      context,
      data: { role: 'admin' },
      operation: 'create',
      req: { user: null } as unknown as PayloadRequest,
    } as never) as Record<string, unknown>

    expect(data.role).toBe('learner')
  })

  test('leaves updates alone', () => {
    const data = { role: 'admin' }

    expect(
      forceLearnerDefaults({
        data,
        operation: 'update',
        req: { user: null } as unknown as PayloadRequest,
      } as never),
    ).toBe(data)
  })
})

describe('users collection hooks', () => {
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
