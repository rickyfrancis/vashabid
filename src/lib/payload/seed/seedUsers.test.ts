import type { Payload } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { seedUsers } from './seedUsers'

interface StoredUser {
  accountStatus: string
  displayName: string
  email: string
  id: number
  role: string
}

interface StoredProfile {
  germanLevel: string
  id: number
  primarySupportLanguage: string
  user: number
  [key: string]: unknown
}

/**
 * A tiny in-memory stand-in for the two collections the seeder touches. No test
 * in this project talks to a real database.
 */
function createPayloadFixture(
  users: StoredUser[] = [],
  profiles: StoredProfile[] = [],
) {
  const userRows = users.map((row) => structuredClone(row))
  const profileRows = profiles.map((row) => structuredClone(row))
  let nextId = 100

  const find = vi.fn(
    async ({
      collection,
      where,
    }: {
      collection: string
      where: Record<string, { equals: unknown }>
    }) => {
      if (collection === 'users') {
        return {
          docs: userRows.filter((row) => row.email === where.email?.equals),
        }
      }

      return {
        docs: profileRows.filter((row) => row.user === where.user?.equals),
      }
    },
  )

  const create = vi.fn(
    async ({
      collection,
      data,
    }: {
      collection: string
      data: Record<string, unknown>
    }) => {
      const row = { ...data, id: (nextId += 1) }

      if (collection === 'users') userRows.push(row as unknown as StoredUser)
      else profileRows.push(row as unknown as StoredProfile)

      return row
    },
  )

  const update = vi.fn(
    async ({
      collection,
      data,
      id,
    }: {
      collection: string
      data: Record<string, unknown>
      id: number
    }) => {
      const rows = collection === 'users' ? userRows : profileRows
      const row = rows.find((candidate) => candidate.id === id)
      Object.assign(row as object, data)
      return row
    },
  )

  return {
    create,
    find,
    payload: { create, find, update } as unknown as Payload,
    profileRows,
    update,
    userRows,
  }
}

const devEnv = {}

describe('seedUsers', () => {
  test('creates an admin and a learner on an empty database', async () => {
    const fixture = createPayloadFixture()

    const summary = await seedUsers(fixture.payload, {
      env: devEnv,
      isProduction: false,
    })

    const roles = fixture.userRows.map((row) => row.role)
    expect(roles).toEqual(['admin', 'learner'])
    expect(summary.created).toBeGreaterThanOrEqual(2)
  })

  test('is the only path that may mint an admin, and does so explicitly', async () => {
    const fixture = createPayloadFixture()

    await seedUsers(fixture.payload, { env: devEnv, isProduction: false })

    const [adminCall] = fixture.create.mock.calls
    expect(adminCall[0].data).toMatchObject({
      accountStatus: 'active',
      role: 'admin',
    })
    // Trusted operator tooling, not a request: this is the one place
    // `overrideAccess` is right.
    expect(adminCall[0].overrideAccess).toBe(true)
  })

  test('gives the seeded learner a completed profile', async () => {
    const fixture = createPayloadFixture()

    await seedUsers(fixture.payload, { env: devEnv, isProduction: false })

    expect(fixture.profileRows).toHaveLength(1)
    expect(fixture.profileRows[0]).toMatchObject({
      germanLevel: 'A2',
      primarySupportLanguage: 'bn',
    })
  })

  test('reports everything unchanged on a rerun', async () => {
    const fixture = createPayloadFixture()

    await seedUsers(fixture.payload, { env: devEnv, isProduction: false })
    const second = await seedUsers(fixture.payload, {
      env: devEnv,
      isProduction: false,
    })

    expect(second.created).toBe(0)
    expect(second.updated).toBe(0)
    expect(second.unchanged).toBeGreaterThan(0)
  })

  test('never resets the password of an account that already exists', async () => {
    const fixture = createPayloadFixture([
      {
        accountStatus: 'active',
        displayName: 'Vashabid Admin',
        email: 'admin@vashabid.local',
        id: 1,
        role: 'admin',
      },
    ])

    await seedUsers(fixture.payload, { env: devEnv, isProduction: false })

    const passwordWrites = fixture.update.mock.calls.filter(
      (call) => 'password' in (call[0].data as object),
    )
    // Rerunning the seed must not silently undo a password somebody changed.
    expect(passwordWrites).toHaveLength(0)
  })

  test('restores a demoted or suspended admin', async () => {
    const fixture = createPayloadFixture([
      {
        accountStatus: 'suspended',
        displayName: 'Vashabid Admin',
        email: 'admin@vashabid.local',
        id: 1,
        role: 'learner',
      },
    ])

    await seedUsers(fixture.payload, { env: devEnv, isProduction: false })

    expect(fixture.userRows[0]).toMatchObject({
      accountStatus: 'active',
      role: 'admin',
    })
  })

  test('honours configured admin credentials', async () => {
    const fixture = createPayloadFixture()

    await seedUsers(fixture.payload, {
      env: {
        SEED_ADMIN_EMAIL: 'ops@example.com',
        SEED_ADMIN_PASSWORD: 'a-real-production-password',
      },
      isProduction: true,
    })

    const [adminCall] = fixture.create.mock.calls
    expect(adminCall[0].data).toMatchObject({
      email: 'ops@example.com',
      password: 'a-real-production-password',
    })
  })

  test('refuses to seed a production admin with the published dev password', async () => {
    const fixture = createPayloadFixture()

    // The development default is in the repository, so seeding it in
    // production would create an account anybody could sign into.
    await expect(
      seedUsers(fixture.payload, { env: {}, isProduction: true }),
    ).rejects.toThrow(/SEED_ADMIN_PASSWORD/)
  })

  test('skips the learner fixture in production', async () => {
    const fixture = createPayloadFixture()

    await seedUsers(fixture.payload, {
      env: {
        SEED_ADMIN_EMAIL: 'ops@example.com',
        SEED_ADMIN_PASSWORD: 'a-real-production-password',
      },
      isProduction: true,
    })

    expect(fixture.userRows.map((row) => row.role)).toEqual(['admin'])
    expect(fixture.profileRows).toHaveLength(0)
  })

  test('refuses to guess when two accounts share a seeded email', async () => {
    const duplicate = {
      accountStatus: 'active',
      displayName: 'Vashabid Admin',
      email: 'admin@vashabid.local',
      role: 'admin',
    }
    const fixture = createPayloadFixture([
      { ...duplicate, id: 1 },
      { ...duplicate, id: 2 },
    ])

    await expect(
      seedUsers(fixture.payload, { env: devEnv, isProduction: false }),
    ).rejects.toThrow(/Duplicate/)
  })
})
