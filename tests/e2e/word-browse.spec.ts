import { expect, test } from '@playwright/test'

test('English and Bangla routes render the published word catalogue', async ({
  page,
}) => {
  await page.goto('/en/words')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Browse the German word desk.',
    }),
  ).toBeVisible()
  await expect(page.getByTestId('word-browse-grid')).toBeVisible()
  await expect(page.locator('[data-testid^="browse-word-"]')).toHaveCount(6)
  await expect(page.getByText('10 published words')).toBeVisible()

  await page.goto('/bn/words')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'জার্মান শব্দের ডেস্ক ঘুরে দেখুন।',
    }),
  ).toBeVisible()
  await expect(page.locator('[data-testid^="browse-word-"]')).toHaveCount(6)
})

test('pagination preserves filter state and traverses all seeded words', async ({
  page,
}) => {
  await page.goto('/en/words')
  await page.getByRole('link', { name: 'Next' }).click()

  await expect(page).toHaveURL(/\/en\/words\?page=2$/)
  await expect(page.locator('[data-testid^="browse-word-"]')).toHaveCount(4)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Previous' })).toHaveAttribute(
    'href',
    '/en/words',
  )
})

test('CEFR, word type, and topic filters combine through the URL', async ({
  page,
}) => {
  await page.goto('/en/words')
  await page.getByLabel('CEFR level').selectOption('A1')
  await page.getByLabel('Word type').selectOption('noun')
  await page.getByLabel('Learning topic', { exact: true }).selectOption('reisen')
  await page.getByRole('button', { name: 'Apply filters' }).click()

  await expect(page).toHaveURL(
    /\/en\/words\?level=A1&type=noun&topic=reisen$/,
  )
  await expect(page.locator('[data-testid^="browse-word-"]')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'der Bahnhof' })).toBeVisible()

  await page.getByRole('link', { name: 'Clear filters' }).click()
  await expect(page).toHaveURL(/\/en\/words$/)
  await expect(page.locator('[data-testid^="browse-word-"]')).toHaveCount(6)
})

test('invalid and out-of-range query state redirects to canonical URLs', async ({
  page,
}) => {
  await page.goto(
    '/en/words?level=a1&type=article&topic=private&page=01&extra=value',
  )
  await expect(page).toHaveURL(/\/en\/words$/)

  await page.goto('/en/words?page=99')
  await expect(page).toHaveURL(/\/en\/words\?page=2$/)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
})

test('support switching updates cards without exposing pending Bangla', async ({
  page,
}) => {
  await page.goto('/en/words?topic=essen-und-trinken')

  const approvedCard = page.getByTestId('browse-word-essen').first()
  const pendingCard = page.getByTestId('browse-word-das-brot').first()
  await expect(approvedCard).toContainText('to eat')
  await expect(pendingCard).toContainText('bread')

  await page
    .getByRole('group', { name: 'Learning support' })
    .getByText('English + বাংলা', { exact: true })
    .click()

  await expect(approvedCard).toContainText('খাওয়া')
  await expect(pendingCard).not.toContainText('রুটি / পাউরুটি')
  await expect(pendingCard.getByRole('note')).toHaveText(
    'Bangla is still under review, so English is shown for now.',
  )
})

test('browse layout remains usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/words')

  await expect(page.getByTestId('word-browse-grid')).toBeVisible()
  await expect(page.getByLabel('CEFR স্তর')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)

  const layout = await page.evaluate(() => {
    const select = document.querySelector('#word-filter-level')
    const root = getComputedStyle(document.documentElement)
    return {
      colorScheme: root.colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      selectHeight: select?.getBoundingClientRect().height ?? 0,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
  expect(layout.selectHeight).toBeGreaterThanOrEqual(44)
})
