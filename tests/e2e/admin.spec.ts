import { expect, test } from '@playwright/test'

test('admin route responds without server error', async ({ page }) => {
  const response = await page.goto('/admin')
  expect(response?.ok()).toBe(true)
  await expect(page.locator('body')).not.toBeEmpty()
})
