import { expect, test } from '@playwright/test'

const APPROVED_BANGLA = 'সহায়ক ক্রিয়া haben বা sein'
const PENDING_BANGLA = 'বিচ্ছেদ্য উপসর্গ'

test('English detail pages present the rule, explanation, and examples', async ({
  page,
}) => {
  await page.goto('/en/grammar/perfekt-mit-haben-und-sein')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Perfekt mit haben und sein' }),
  ).toBeVisible()
  await expect(
    page.getByText('Das Perfekt bildet man mit haben oder sein'),
  ).toBeVisible()
  await expect(
    page.getByText('The Perfekt is the normal way to talk about the past'),
  ).toBeVisible()
  await expect(page.getByText('Ich bin nach Berlin gereist.')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Common mistakes' }),
  ).toBeVisible()
})

test('support mode switches between English, Bangla, and both', async ({
  page,
}) => {
  await page.goto('/en/grammar/perfekt-mit-haben-und-sein')
  const support = page.getByRole('group', { name: 'Learning support' })
  await expect(page.locator('body')).not.toContainText(APPROVED_BANGLA)

  await support.getByText('বাংলা', { exact: true }).click()
  await expect(page.locator('body')).toContainText(APPROVED_BANGLA)
  await expect(page.locator('body')).not.toContainText(
    'The Perfekt is the normal way',
  )

  await support.getByText('English + বাংলা', { exact: true }).click()
  await expect(page.locator('body')).toContainText(APPROVED_BANGLA)
  await expect(page.locator('body')).toContainText(
    'The Perfekt is the normal way',
  )
})

test('a topic with pending Bangla falls back to English with a notice', async ({
  page,
}) => {
  await page.goto('/bn/grammar/trennbare-verben')

  await expect(page.getByTestId('grammar-detail-trennbare-verben')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(PENDING_BANGLA)
  await expect(page.locator('body')).toContainText(
    'Separable verbs are built from a prefix',
  )
  await expect(
    page.getByText('এই অংশের জন্য বাংলা নির্দেশনা এখনও নেই'),
  ).toBeVisible()
})

test('related words and the index link navigate correctly', async ({ page }) => {
  await page.goto('/en/grammar/perfekt-mit-haben-und-sein')

  await page
    .getByTestId('grammar-related-word-reisen')
    .getByRole('link', { name: 'reisen' })
    .click()
  await expect(page).toHaveURL('/en/words/reisen')

  await page.goto('/en/grammar/perfekt-mit-haben-und-sein')
  await page.getByRole('link', { name: 'Back to grammar index' }).click()
  await expect(page).toHaveURL('/en/grammar')
})

test('a word links back to the grammar patterns that use it', async ({
  page,
}) => {
  await page.goto('/en/words/das-brot')

  await expect(
    page.getByRole('heading', { name: 'Grammar behind this word' }),
  ).toBeVisible()
  await page
    .getByTestId('word-grammar-bestimmter-artikel')
    .getByRole('link')
    .click()
  await expect(page).toHaveURL('/en/grammar/bestimmter-artikel')
})

test('unknown topics render the localized not-found state', async ({ page }) => {
  await page.goto('/en/grammar/not-a-real-topic')

  await expect(page).toHaveURL('/en/grammar/not-a-real-topic')
  await expect(page.getByText('Page not found')).toBeVisible()
})

test('detail layout remains usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/grammar/modalverben')

  await expect(page.getByTestId('grammar-detail-modalverben')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)

  const layout = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const backLink = document.querySelector('main a')
    return {
      colorScheme: root.colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      linkHeight: backLink?.getBoundingClientRect().height ?? 0,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
  expect(layout.linkHeight).toBeGreaterThan(0)
})
