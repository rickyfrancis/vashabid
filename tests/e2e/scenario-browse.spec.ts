import { expect, test } from '@playwright/test'

const PENDING_BANGLA = 'ট্রেনের টিকিট কিনতে গন্তব্য'

test('English and Bangla routes render the published scenario workbook', async ({
  page,
}) => {
  await page.goto('/en/scenarios')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Practise German where it actually happens.',
    }),
  ).toBeVisible()
  await expect(page.getByTestId('scenario-browse-grid')).toBeVisible()
  await expect(page.locator('[data-testid^="browse-scenario-"]')).toHaveCount(6)
  await expect(page.getByText('8 published scenarios')).toBeVisible()

  await page.goto('/bn/scenarios')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'বাস্তব পরিস্থিতিতে জার্মান চর্চা করুন।',
    }),
  ).toBeVisible()
  await expect(page.locator('[data-testid^="browse-scenario-"]')).toHaveCount(6)
})

test('pagination traverses every seeded scenario and preserves filter state', async ({
  page,
}) => {
  await page.goto('/en/scenarios')
  await page.getByRole('link', { name: 'Next' }).click()

  await expect(page).toHaveURL(/\/en\/scenarios\?page=2$/)
  await expect(page.locator('[data-testid^="browse-scenario-"]')).toHaveCount(2)
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Previous' })).toHaveAttribute(
    'href',
    '/en/scenarios',
  )
})

test('level, situation, and topic filters combine through the URL', async ({
  page,
}) => {
  await page.goto('/en/scenarios')
  await page.getByLabel('CEFR level').selectOption('A1')
  await page.getByLabel('Situation', { exact: true }).selectOption('travel')
  await page.getByLabel('Learning topic', { exact: true }).selectOption('reisen')
  await page.getByRole('button', { name: 'Apply filters' }).click()

  await expect(page).toHaveURL(
    /\/en\/scenarios\?level=A1&situation=travel&topic=reisen$/,
  )
  await expect(page.locator('[data-testid^="browse-scenario-"]')).toHaveCount(1)
  await expect(
    page.getByTestId('browse-scenario-nach-dem-weg-fragen'),
  ).toBeVisible()
})

test('the situation filter alone narrows to that everyday domain', async ({
  page,
}) => {
  await page.goto('/en/scenarios?situation=work')

  await expect(page.locator('[data-testid^="browse-scenario-"]')).toHaveCount(1)
  await expect(
    page.getByTestId('browse-scenario-sich-im-buero-vorstellen'),
  ).toBeVisible()
  await expect(page.getByText('1 published scenario')).toBeVisible()
})

test('an unmatched filter combination explains how to recover', async ({
  page,
}) => {
  await page.goto('/en/scenarios?level=C2')

  await expect(
    page.getByRole('heading', { name: 'No scenarios match this workbook' }),
  ).toBeVisible()
  await expect(page.getByTestId('scenario-browse-grid')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Clear filters' }).first(),
  ).toHaveAttribute('href', '/en/scenarios')
})

test('non-canonical query state redirects to a clean URL', async ({ page }) => {
  await page.goto('/en/scenarios?page=01&level=NOPE&extra=value')
  await expect(page).toHaveURL('/en/scenarios')

  await page.goto('/en/scenarios?page=99')
  await expect(page).toHaveURL(/\/en\/scenarios\?page=2$/)

  await page.goto('/en/scenarios?topic=does-not-exist')
  await expect(page).toHaveURL('/en/scenarios')

  await page.goto('/en/scenarios?situation=holiday')
  await expect(page).toHaveURL('/en/scenarios')
})

test('unapproved Bangla never reaches the public workbook', async ({ page }) => {
  await page.goto('/bn/scenarios?page=2')

  await expect(
    page.getByTestId('browse-scenario-fahrkarte-am-schalter-kaufen'),
  ).toBeVisible()
  await expect(page.locator('body')).not.toContainText(PENDING_BANGLA)
})

test('the header offers a scenario entry in both locales', async ({ page }) => {
  await page.goto('/en')
  await expect(
    page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Scenarios' }),
  ).toHaveAttribute('href', '/en/scenarios')

  await page.goto('/bn')
  await expect(
    page
      .getByRole('navigation', { name: 'প্রধান ন্যাভিগেশন' })
      .getByRole('link', { name: 'পরিস্থিতি' }),
  ).toHaveAttribute('href', '/bn/scenarios')
})

test('the workbook stays usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/scenarios')

  await expect(page.getByTestId('scenario-browse-grid')).toBeVisible()
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
