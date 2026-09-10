import type { Payload } from 'payload'

import { SEED_CONTEXT_FLAG } from '../../../../collections/hooks/users'
import type { LearnerProfile, User } from '../../../../payload-types'
import { userSeeds, type UserSeed } from './data/users'
import type { SeedSummary } from './types'

export interface UserSeedEnvironment {
  env?: Record<string, string | undefined>
  isProduction?: boolean
}

function emailFor(seed: UserSeed, env: Record<string, string | undefined>) {
  const configured = seed.emailEnvVar ? env[seed.emailEnvVar] : undefined

  return configured?.trim() || seed.fallbackEmail
}

/**
 * Resolves the password for a seeded account, or refuses.
 *
 * The development defaults in `data/users.ts` are published in the repository,
 * so an admin created with one in production would be an account anybody could
 * sign into. Rather than quietly seeding a weak credential, the seeder stops and
 * says what to set. Non-privileged learner fixtures are simply skipped in
 * production instead, since nothing there needs them.
 */
function passwordFor(
  seed: UserSeed,
  env: Record<string, string | undefined>,
  isProduction: boolean,
): string | null {
  const configured = seed.passwordEnvVar ? env[seed.passwordEnvVar] : undefined

  if (configured && configured.trim() !== '') return configured

  if (!isProduction) return seed.developmentPassword

  if (seed.role === 'admin') {
    throw new Error(
      `Refusing to seed ${seed.fallbackEmail} with a development password. ` +
        `Set ${seed.passwordEnvVar ?? 'a password env var'} before seeding in production.`,
    )
  }

  return null
}

function profileMatches(
  existing: LearnerProfile,
  seed: NonNullable<UserSeed['profile']>,
): boolean {
  return (
    existing.dailyStudyTarget === seed.dailyStudyTarget &&
    existing.germanLevel === seed.germanLevel &&
    existing.learningGoal === seed.learningGoal &&
    existing.practiceStyle === seed.practiceStyle &&
    existing.primarySupportLanguage === seed.primarySupportLanguage &&
    (existing.secondarySupportLanguage ?? undefined) ===
      seed.secondarySupportLanguage
  )
}

async function seedProfile(
  payload: Payload,
  seed: NonNullable<UserSeed['profile']>,
  userId: number,
  summary: SeedSummary,
): Promise<void> {
  const result = await payload.find({
    collection: 'learner-profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { user: { equals: userId } },
  })

  const existing = result.docs[0] as LearnerProfile | undefined

  if (!existing) {
    summary.created += 1
    await payload.create({
      collection: 'learner-profiles',
      data: { ...seed, user: userId },
      overrideAccess: true,
    })
    return
  }

  if (profileMatches(existing, seed)) {
    summary.unchanged += 1
    return
  }

  summary.updated += 1
  await payload.update({
    collection: 'learner-profiles',
    data: seed,
    id: existing.id,
    overrideAccess: true,
  })
}

/**
 * Provisions the accounts the app and its tests need.
 *
 * Runs first in the orchestrator, before any content is seeded, so that an
 * admin exists as early as possible. Matching is by email, and an existing
 * account keeps its password: rerunning the seed must not silently reset a
 * credential somebody has already changed.
 *
 * `overrideAccess: true` is deliberate and is the one place it is right. This
 * is trusted operator tooling running from a shell, not a request — and it is
 * the only path in the project that may set `role: 'admin'`, precisely because
 * nothing reachable over HTTP can.
 */
export async function seedUsers(
  payload: Payload,
  options: UserSeedEnvironment = {},
): Promise<SeedSummary> {
  const env = options.env ?? process.env
  const isProduction =
    options.isProduction ?? process.env.NODE_ENV === 'production'
  const summary: SeedSummary = { created: 0, unchanged: 0, updated: 0 }

  for (const seed of userSeeds) {
    const email = emailFor(seed, env)
    const password = passwordFor(seed, env, isProduction)

    if (password === null) continue

    const result = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 2,
      overrideAccess: true,
      pagination: false,
      where: { email: { equals: email } },
    })

    if (result.docs.length > 1) {
      throw new Error(`Duplicate seeded user email: ${email}`)
    }

    const existing = result.docs[0] as User | undefined
    let userId: number

    if (!existing) {
      summary.created += 1
      const created = await payload.create({
        collection: 'users',
        // Without this flag `forceLearnerDefaults` would demote the admin it is
        // this seeder's entire job to create.
        context: { [SEED_CONTEXT_FLAG]: true },
        data: {
          accountStatus: 'active',
          displayName: seed.displayName,
          email,
          password,
          role: seed.role,
          supportMode: seed.supportMode,
          uiLocale: seed.uiLocale,
        },
        overrideAccess: true,
      })
      userId = created.id
    } else {
      userId = existing.id
      const drifted =
        existing.role !== seed.role ||
        existing.accountStatus !== 'active' ||
        existing.displayName !== seed.displayName

      if (drifted) {
        summary.updated += 1
        // The password is deliberately absent: a rerun restores the intended
        // role and status without touching a credential.
        await payload.update({
          collection: 'users',
          data: {
            accountStatus: 'active',
            displayName: seed.displayName,
            role: seed.role,
          },
          id: existing.id,
          overrideAccess: true,
        })
      } else {
        summary.unchanged += 1
      }
    }

    if (seed.profile) {
      await seedProfile(payload, seed.profile, userId, summary)
    }
  }

  return summary
}
