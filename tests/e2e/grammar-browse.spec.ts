import { expect, test } from '@playwright/test'

test('English and Bangla routes render the published grammar workbook', async ({
  page,
}) => {
  await page.goto('/en/grammar')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Learn the patterns behind German.',
    }),
  ).toBeVisible()
  await expect(page.getByTestId('grammar-browse-grid')).toBeVisible()
  await expect(page.locator('[data-testid^="browse-grammar-"]')).toHaveCount(6)
  await expect(page.getByText('8 published topics')).toBeVisible()

  await page.goto('/bn/grammar')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'জার্মানের পেছনের নিয়মগুলো শিখুন।',
    }),
  ).toBeVisible()
  await expect(page.locator('[data-testid^="browse-grammar-"]')).toHaveCount(6)
})

test('pagination traverses every seeded topic and preserves the filter state', async ({
  page,
}) => {
  await page.goto('/en/grammar')
  await page.getByRole('link', { name: 'Next' }).click()

  await expect(page).toHaveURL(/\/en\/grammar\?page=2$/)
  await expect(page.locator('[data-testid^="browse-grammar-"]')).toHaveCount(2)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Previous' })).toHaveAttribute(
    'href',
    '/en/grammar',
  )
})

test('CEFR and topic filters combine through the URL', async ({ page }) => {
  await page.goto('/en/grammar')
  await page.getByLabel('CEFR level').selectOption('A2')
  await page.getByLabel('Learning topic', { exact: true }).selectOption(
    'arbeit-und-studium',
  )
  await page.getByRole('button', { name: 'Apply filters' }).click()

  await expect(page).toHaveURL(
    /\/en\/grammar\?level=A2&topic=arbeit-und-studium$/,
  )
  await expect(page.locator('[data-testid^="browse-grammar-"]')).toHaveCount(1)
  await expect(page.getByTestId('browse-grammar-trennbare-verben')).toBeVisible()
})

test('an unmatched filter combination explains how to recover', async ({
  page,
}) => {
  await page.goto('/en/grammar?level=C2')

  await expect(
    page.getByRole('heading', { name: 'No topics match this workbook' }),
  ).toBeVisible()
  await expect(page.getByTestId('grammar-browse-grid')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Clear filters' }).first(),
  ).toHaveAttribute('href', '/en/grammar')
})

test('non-canonical query state redirects to a clean URL', async ({ page }) => {
  await page.goto('/en/grammar?page=01&level=NOPE&extra=value')
  await expect(page).toHaveURL('/en/grammar')

  await page.goto('/en/grammar?page=99')
  await expect(page).toHaveURL(/\/en\/grammar\?page=2$/)

  await page.goto('/en/grammar?topic=does-not-exist')
  await expect(page).toHaveURL('/en/grammar')
})

test('unapproved Bangla never reaches the public workbook', async ({ page }) => {
  await page.goto('/bn/grammar?page=2')

  await expect(page.getByTestId('browse-grammar-trennbare-verben')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('বিচ্ছেদ্য উপসর্গ')
})

test('the workbook stays usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/grammar')

  await expect(page.getByTestId('grammar-browse-grid')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)

  const layout = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      colorScheme: root.colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
})
