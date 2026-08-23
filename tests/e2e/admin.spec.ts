import { expect, test } from '@playwright/test'

test('admin route responds without server error', async ({ page }) => {
  const response = await page.goto('/admin')
  expect(response?.ok()).toBe(true)
  await expect(page).toHaveURL(/\/admin(?:\/|$)/)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('Payload API is not intercepted by locale routing', async ({ request }) => {
  const response = await request.get('/api/users?limit=1')
  expect(response.status()).toBeLessThan(500)
  expect(response.url()).toContain('/api/users')
  expect(response.url()).not.toMatch(/\/(?:en|bn)\/api/)
})
