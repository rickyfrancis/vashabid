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
