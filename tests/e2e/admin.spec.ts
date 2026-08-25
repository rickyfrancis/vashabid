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

test('anonymous visitors cannot create users through the collection API', async ({
  request,
}) => {
  const response = await request.post('/api/users', {
    data: {
      email: 'anonymous@example.com',
      password: 'not-used-because-access-is-denied',
    },
  })

  expect(response.status()).toBe(403)
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
