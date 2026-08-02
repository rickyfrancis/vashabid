import { expect, test } from '@playwright/test'

test('homepage renders successfully', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBe(true)
  await expect(page).toHaveTitle(/Vashabid/)
  await expect(
    page.getByRole('heading', { name: /To get started/ }),
  ).toBeVisible()
})
