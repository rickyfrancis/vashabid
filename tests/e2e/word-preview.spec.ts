import { expect, test } from '@playwright/test'

test('English published word preview renders public identity data', async ({
  page,
}) => {
  const response = await page.goto('/en/words/der-termin')

  expect(response?.ok()).toBe(true)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('der Termin')
  await expect(page.getByText('Published word preview')).toBeVisible()
})

test('Bangla published word preview uses localized interface text', async ({
  page,
}) => {
  const response = await page.goto('/bn/words/der-termin')

  expect(response?.ok()).toBe(true)
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('der Termin')
  await expect(page.getByText('প্রকাশিত শব্দের প্রিভিউ')).toBeVisible()
})

test('unknown words render the localized not-found state', async ({ page }) => {
  await page.goto('/en/words/not-a-real-word')

  await expect(page).toHaveURL('/en/words/not-a-real-word')
  await expect(page.getByText('Page not found')).toBeVisible()
})
