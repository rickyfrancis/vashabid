import { expect, test } from '@playwright/test'

test('admin route responds without server error', async ({ page }) => {
  const response = await page.goto('/admin')
  expect(response?.ok()).toBe(true)
  await expect(page).toHaveURL(/\/admin(?:\/|$)/)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('Payload API is not intercepted and protects user reads', async ({ request }) => {
  const response = await request.get('/api/users?limit=1')
  expect(response.status()).toBe(403)
  expect(response.url()).toContain('/api/users')
  expect(response.url()).not.toMatch(/\/(?:en|bn)\/api/)
})

test('anonymous visitors can create an account, but only ever a learner', async ({
  request,
}) => {
  // Phase 16 opened this deliberately: signup must not require an account, and
  // Payload cannot disable its REST endpoint per collection, so the rules live
  // in the collection hooks and apply here exactly as they do to the form.
  const response = await request.post('/api/users', {
    data: {
      accountStatus: 'suspended',
      displayName: 'REST Signup',
      email: `rest-signup-${Date.now()}@example.com`,
      password: 'a-long-enough-password',
      role: 'admin',
      uiLocale: 'en',
    },
  })

  expect(response.ok()).toBe(true)

  const body = await response.json()

  // Field access strips the injected values and `forceLearnerDefaults` sets the
  // trusted ones, so the privilege never lands.
  expect(body.doc.role).toBe('learner')
  expect(body.doc.accountStatus).toBe('active')
})

test('a signup that breaks the rules is refused over REST too', async ({
  request,
}) => {
  // Payload enforces no password minimum of its own; this proves the shared
  // schema in the hook is what closes that gap on the endpoint as well.
  const response = await request.post('/api/users', {
    data: {
      displayName: 'Too Short',
      email: `rest-short-${Date.now()}@example.com`,
      password: 'short',
      uiLocale: 'en',
    },
  })

  expect(response.ok()).toBe(false)
})

test('topic tags API remains public and outside locale routing', async ({
  request,
}) => {
  const response = await request.get('/api/topic-tags?limit=5')
  const body = await response.json()

  expect(response.status()).toBe(200)
  expect(response.url()).toContain('/api/topic-tags')
  expect(response.url()).not.toMatch(/\/(?:en|bn)\/api/)
  expect(body.docs).toBeInstanceOf(Array)
  expect(
    body.docs.every((doc: { _status?: string }) => doc._status === 'published'),
  ).toBe(true)
})

test('words API exposes only active published content and hides pending Bangla', async ({
  request,
}) => {
  const response = await request.get('/api/words?draft=true&limit=20&depth=0')
  const body = await response.json()

  expect(response.status()).toBe(200)
  expect(response.url()).toContain('/api/words')
  expect(response.url()).not.toMatch(/\/(?:en|bn)\/api/)
  expect(body.docs).toBeInstanceOf(Array)
  expect(body.docs.length).toBeGreaterThanOrEqual(10)
  expect(
    body.docs.every(
      (doc: { _status?: string; lifecycleStatus?: string }) =>
        doc._status === 'published' && doc.lifecycleStatus === 'active',
    ),
  ).toBe(true)

  const pendingResponse = await request.get(
    '/api/words?where[slug][equals]=das-brot&limit=1&depth=0',
  )
  const pendingBody = await pendingResponse.json()
  const pendingWord = pendingBody.docs[0] as {
    bangla?: unknown
    examples?: { banglaExplanation?: unknown }[]
    slug: string
  }

  expect(pendingResponse.status()).toBe(200)
  expect(pendingWord.slug).toBe('das-brot')
  expect(pendingWord).not.toHaveProperty('bangla')
  expect(pendingWord.examples?.[0]).not.toHaveProperty('banglaExplanation')
})
