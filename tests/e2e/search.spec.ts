import { expect, test } from '@playwright/test'

test('homepage search opens localized English results', async ({ page }) => {
  await page.goto('/en')
  await page
    .getByRole('searchbox', { name: 'Search German vocabulary' })
    .fill('appointment')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/en\/search\?q=appointment$/)
  await expect(
    page.getByRole('heading', { name: 'Results for “appointment”' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'der Termin' })).toBeVisible()
})

test('search supports German articles, Bangla, and romanized Bangla', async ({
  page,
}) => {
  await page.goto('/en/search?q=der+Termin')
  await expect(page.getByRole('link', { name: 'der Termin' })).toBeVisible()

  await page.goto(`/en/search?q=${encodeURIComponent('খাওয়া')}`)
  await expect(page.getByRole('link', { name: 'essen' })).toBeVisible()

  await page.goto('/en/search?q=khaoa')
  await expect(page.getByRole('link', { name: 'essen' })).toBeVisible()
})

test('CEFR, word type, and published topic terms compose useful results', async ({
  page,
}) => {
  await page.goto('/en/search?q=A1+verbs')
  await expect(page.getByRole('link', { name: 'reisen' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'der Bahnhof' })).not.toBeVisible()

  await page.goto('/en/search?q=destinations')
  await expect(page.getByRole('link', { name: 'der Bahnhof' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'reisen' })).toBeVisible()
})

test('pending Bangla cannot be discovered through search', async ({ page }) => {
  await page.goto(`/en/search?q=${encodeURIComponent('রুটি')}`)

  await expect(
    page.getByRole('heading', { name: 'No published words matched' }),
  ).toBeVisible()
  await expect(page.getByTestId('search-word-das-brot')).toHaveCount(0)
})

test('search canonicalizes invalid and out-of-range URL state', async ({
  page,
}) => {
  await page.goto('/en/search?q=%20appointment%20&page=01&extra=value')
  await expect(page).toHaveURL(/\/en\/search\?q=appointment$/)

  await page.goto('/en/search?q=appointment&page=99')
  await expect(page).toHaveURL(/\/en\/search\?q=appointment$/)
})

test('Bangla search UI follows support mode without exposing pending content', async ({
  page,
}) => {
  await page.goto(`/bn/search?q=${encodeURIComponent('খাওয়া')}`)
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'আপনার প্রয়োজনের জার্মান শব্দটি খুঁজুন।',
    }),
  ).toBeVisible()

  const result = page.getByTestId('search-word-essen')
  await page
    .getByRole('group', { name: 'শেখার সহায়ক ভাষা' })
    .getByText('ইংরেজি + বাংলা', { exact: true })
    .click()
  await expect(result).toContainText('to eat')
  await expect(result).toContainText('খাওয়া')
})

test('search remains usable on mobile and in dark mode', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/search')

  await expect(page.getByRole('search')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)

  const layout = await page.evaluate(() => {
    const searchbox = document.querySelector('#search-query')
    const root = getComputedStyle(document.documentElement)
    return {
      colorScheme: root.colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      searchHeight: searchbox?.getBoundingClientRect().height ?? 0,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
  expect(layout.searchHeight).toBeGreaterThanOrEqual(44)
})

test('grammar topics are searchable in German, English, and approved Bangla', async ({
  page,
}) => {
  await page.goto('/en/search?q=Perfekt')
  await expect(page.getByTestId('search-grammar-grid')).toBeVisible()
  await expect(
    page.getByTestId('search-grammar-perfekt-mit-haben-und-sein'),
  ).toBeVisible()

  await page.goto('/en/search?q=modal%20verbs')
  await expect(page.getByTestId('search-grammar-modalverben')).toBeVisible()

  await page.goto('/en/search?q=%E0%A6%B8%E0%A6%B9%E0%A6%BE%E0%A7%9F%E0%A6%95')
  await expect(
    page.getByTestId('search-grammar-perfekt-mit-haben-und-sein'),
  ).toBeVisible()
})

test('unapproved Bangla grammar content is not discoverable through search', async ({
  page,
}) => {
  await page.goto(
    '/en/search?q=%E0%A6%AC%E0%A6%BF%E0%A6%9A%E0%A7%8D%E0%A6%9B%E0%A7%87%E0%A6%A6%E0%A7%8D%E0%A6%AF',
  )

  await expect(page.getByTestId('search-grammar-grid')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('বিচ্ছেদ্য উপসর্গ')
})
