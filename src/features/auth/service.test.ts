import { describe, expect, test, vi } from 'vitest'

const { createLocalReq, logoutOperation } = vi.hoisted(() => ({
  createLocalReq: vi.fn().mockResolvedValue({ user: { id: 7 } }),
  logoutOperation: vi.fn().mockResolvedValue(true),
}))

vi.mock('payload', () => ({ createLocalReq, logoutOperation }))

const { getPayloadClient } = vi.hoisted(() => ({
  getPayloadClient: vi.fn(),
}))

vi.mock('@/lib/payload', () => ({
  createDocument: vi.fn(),
  createDocumentAs: vi.fn(),
  findOneAs: vi.fn(),
  getPayloadClient,
  updateDocumentAs: vi.fn(),
}))

import { AuthService, OnboardingService } from './service'

const signup = {
  displayName: 'Rifat',
  email: 'rifat@example.com',
  password: 'a-long-enough-password',
  uiLocale: 'en',
}

function apiError(status: number, data?: unknown) {
  return Object.assign(new Error(`status ${status}`), { data, status })
}

function users(createLearner = vi.fn().mockResolvedValue(undefined)) {
  return { createLearner, updatePreferences: vi.fn() }
}

describe('AuthService.signup', () => {
  test('creates a learner and reports success', async () => {
    const repo = users()
    const result = await new AuthService(repo as never).signup(signup)

    expect(result).toEqual({ kind: 'success' })
    expect(repo.createLearner).toHaveBeenCalled()
  })

  test('derives the initial support mode from the chosen interface language', async () => {
    const repo = users()

    await new AuthService(repo as never).signup({ ...signup, uiLocale: 'bn' })

    const [data] = repo.createLearner.mock.calls[0]
    expect(data.supportMode).toBe('bn')
  })

  test('returns field errors without touching the repository', async () => {
    const repo = users()
    const result = await new AuthService(repo as never).signup({
      ...signup,
      password: 'short',
    })

    expect(result).toMatchObject({ kind: 'invalid' })
    expect(repo.createLearner).not.toHaveBeenCalled()
  })

  test('reports a taken email against the email field', async () => {
    const repo = users(
      vi.fn().mockRejectedValue(
        apiError(400, { errors: [{ path: 'email', message: 'duplicate' }] }),
      ),
    )

    const result = await new AuthService(repo as never).signup(signup)

    expect(result).toMatchObject({
      fieldErrors: { email: 'errorEmailTaken' },
      kind: 'invalid',
    })
  })

  test('maps the rate-limit status the hook raises', async () => {
    const repo = users(vi.fn().mockRejectedValue(apiError(429)))

    expect(await new AuthService(repo as never).signup(signup)).toEqual({
      kind: 'rate-limited',
    })
  })

  test('rethrows an error it does not understand', async () => {
    const repo = users(vi.fn().mockRejectedValue(apiError(500)))

    await expect(
      new AuthService(repo as never).signup(signup),
    ).rejects.toThrow()
  })

  test('never sends role or account status even if they are supplied', async () => {
    const repo = users()

    await new AuthService(repo as never).signup({
      ...signup,
      accountStatus: 'active',
      role: 'admin',
    })

    const [data] = repo.createLearner.mock.calls[0]
    expect(data).not.toHaveProperty('role')
    expect(data).not.toHaveProperty('accountStatus')
  })
})

describe('AuthService.login', () => {
  function payloadWith(login: ReturnType<typeof vi.fn>) {
    return vi.fn().mockResolvedValue({ login })
  }

  test('returns the token for valid credentials', async () => {
    const service = new AuthService(
      users() as never,
      payloadWith(vi.fn().mockResolvedValue({ token: 'jwt' })) as never,
    )

    expect(
      await service.login({ email: 'rifat@example.com', password: 'secret' }),
    ).toEqual({ kind: 'success', token: 'jwt' })
  })

  test('reports bad credentials without saying which half was wrong', async () => {
    const service = new AuthService(
      users() as never,
      payloadWith(vi.fn().mockRejectedValue(apiError(401))) as never,
    )

    expect(
      await service.login({ email: 'rifat@example.com', password: 'nope' }),
    ).toEqual({ kind: 'invalid-credentials' })
  })

  test('reports a suspended account exactly like bad credentials', async () => {
    // `rejectSuspendedLogin` raises the generic AuthenticationError on purpose;
    // this keeps the service from undoing that by reporting the real reason.
    const service = new AuthService(
      users() as never,
      payloadWith(vi.fn().mockRejectedValue(apiError(401))) as never,
    )
    const suspended = await service.login({
      email: 'suspended@example.com',
      password: 'secret',
    })

    expect(suspended).toEqual({ kind: 'invalid-credentials' })
  })

  test('reports a locked account the same way too', async () => {
    const service = new AuthService(
      users() as never,
      payloadWith(vi.fn().mockRejectedValue(apiError(403))) as never,
    )

    expect(
      await service.login({ email: 'rifat@example.com', password: 'secret' }),
    ).toEqual({ kind: 'invalid-credentials' })
  })

  test('treats a missing token as a failed login', async () => {
    const service = new AuthService(
      users() as never,
      payloadWith(vi.fn().mockResolvedValue({})) as never,
    )

    expect(
      await service.login({ email: 'rifat@example.com', password: 'secret' }),
    ).toEqual({ kind: 'invalid-credentials' })
  })

  test('refuses an empty password before reaching Payload', async () => {
    const login = vi.fn()
    const service = new AuthService(users() as never, payloadWith(login) as never)

    expect(
      await service.login({ email: 'rifat@example.com', password: '' }),
    ).toMatchObject({ kind: 'invalid' })
    expect(login).not.toHaveBeenCalled()
  })
})

describe('AuthService.logout', () => {
  test('revokes the session server-side, not just the cookie', async () => {
    logoutOperation.mockClear()
    const auth = vi.fn().mockResolvedValue({ user: { id: 7 } })
    const payload = { auth, collections: { users: {} } }

    await new AuthService(
      users() as never,
      vi.fn().mockResolvedValue(payload) as never,
    ).logout(new Headers())

    // Deleting the cookie alone would leave the JWT valid for its full lifetime
    // and its `users_sessions` row live.
    expect(logoutOperation).toHaveBeenCalled()
  })

  test('does nothing when nobody is signed in', async () => {
    logoutOperation.mockClear()
    const payload = {
      auth: vi.fn().mockResolvedValue({ user: null }),
      collections: { users: {} },
    }

    await new AuthService(
      users() as never,
      vi.fn().mockResolvedValue(payload) as never,
    ).logout(new Headers())

    expect(logoutOperation).not.toHaveBeenCalled()
  })
})

describe('OnboardingService', () => {
  const answers = {
    dailyStudyTarget: '20',
    germanLevel: 'A2',
    learningGoal: 'travel',
    practiceStyle: 'mixed',
    primarySupportLanguage: 'bn',
    uiLocale: 'bn',
  }

  function profiles(existing: { id: number } | null = null) {
    return {
      createForUser: vi.fn().mockResolvedValue(undefined),
      findByUser: vi.fn().mockResolvedValue(existing),
      updateForUser: vi.fn().mockResolvedValue(undefined),
    }
  }

  const actor = { headers: undefined, user: { id: 7 }, userId: 7 }

  test('splits the answers across account and profile', async () => {
    const profileRepo = profiles()
    const userRepo = users()

    await new OnboardingService(
      profileRepo as never,
      userRepo as never,
    ).submit(answers, actor)

    const [, preferences] = userRepo.updatePreferences.mock.calls[0]
    expect(preferences).toEqual({ supportMode: 'bn', uiLocale: 'bn' })

    const [profileData] = profileRepo.createForUser.mock.calls[0]
    // uiLocale belongs to the account, because every role has one.
    expect(profileData).not.toHaveProperty('uiLocale')
    expect(profileData.learningGoal).toBe('travel')
  })

  test('derives `both` when a second language is chosen', async () => {
    const userRepo = users()

    await new OnboardingService(profiles() as never, userRepo as never).submit(
      { ...answers, secondarySupportLanguage: 'en' },
      actor,
    )

    const [, preferences] = userRepo.updatePreferences.mock.calls[0]
    expect(preferences.supportMode).toBe('both')
  })

  test('updates an existing profile instead of creating a second one', async () => {
    const profileRepo = profiles({ id: 3 })

    await new OnboardingService(
      profileRepo as never,
      users() as never,
    ).submit(answers, actor)

    expect(profileRepo.updateForUser).toHaveBeenCalledWith(
      3,
      expect.anything(),
      expect.anything(),
    )
    expect(profileRepo.createForUser).not.toHaveBeenCalled()
  })

  test('refuses an anonymous submission before writing anything', async () => {
    const profileRepo = profiles()
    const userRepo = users()

    const result = await new OnboardingService(
      profileRepo as never,
      userRepo as never,
    ).submit(answers, { ...actor, user: null })

    expect(result).toEqual({ kind: 'unauthenticated' })
    expect(userRepo.updatePreferences).not.toHaveBeenCalled()
    expect(profileRepo.createForUser).not.toHaveBeenCalled()
  })

  test('returns field errors without writing anything', async () => {
    const profileRepo = profiles()
    const userRepo = users()

    const result = await new OnboardingService(
      profileRepo as never,
      userRepo as never,
    ).submit({ ...answers, germanLevel: 'D9' }, actor)

    expect(result).toMatchObject({ kind: 'invalid' })
    expect(userRepo.updatePreferences).not.toHaveBeenCalled()
    expect(profileRepo.createForUser).not.toHaveBeenCalled()
  })

  test('never lets onboarding write the completion stamp or an owner', async () => {
    const profileRepo = profiles()

    await new OnboardingService(
      profileRepo as never,
      users() as never,
    ).submit(
      { ...answers, onboardingCompletedAt: '1999-01-01', user: 99 },
      actor,
    )

    const [profileData] = profileRepo.createForUser.mock.calls[0]
    expect(profileData).not.toHaveProperty('user')
    expect(profileData).not.toHaveProperty('onboardingCompletedAt')
  })
})
