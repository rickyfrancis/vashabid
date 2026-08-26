import { expect, test } from '@playwright/test'

test('English word detail renders the complete published learning page', async ({
  page,
}) => {
  const response = await page.goto('/en/words/der-termin')

  expect(response?.ok()).toBe(true)
  await expect(page).toHaveTitle('der Termin — German word | Vashabid')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('derTermin')
  await expect(page.getByText('appointment', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Ich habe morgen einen Termin.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('die Termine', { exact: true })).toBeVisible()
  await expect(
    page.getByText(
      'Use einen Termin for the accusative form; do not keep the article as der.',
      { exact: true },
    ),
  ).toBeVisible()
  await expect(page.getByText('Audio not available yet')).toBeVisible()
  await expect(page.getByRole('link', { name: 'arbeiten' })).toHaveAttribute(
    'href',
    '/en/words/arbeiten',
  )
})

test('Bangla detail uses localized UI and approved learner content', async ({
  page,
}) => {
  const response = await page.goto('/bn/words/der-termin')

  expect(response?.ok()).toBe(true)
  await expect(page).toHaveTitle('der Termin — জার্মান শব্দ | ভাষাবিদ')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(page.getByText('অ্যাপয়েন্টমেন্ট / নির্ধারিত সময়')).toBeVisible()
  await expect(
    page.getByText('আগামীকাল আমার একটি অ্যাপয়েন্টমেন্ট আছে।'),
  ).toBeVisible()
  await expect(page.getByText('শেষ অংশে দীর্ঘ “ই” ধ্বনি দিন: টেয়ার-মীন।')).toBeVisible()
  await expect(page.getByText('শব্দভাণ্ডারের ডেস্ক থেকে')).toBeVisible()
})

test('combined support mode shows English and approved Bangla together', async ({
  page,
}) => {
  await page.goto('/en/words/machen')
  await page
    .getByRole('group', { name: 'Learning support' })
    .getByText('English + বাংলা', { exact: true })
    .click()

  const detail = page.getByTestId('word-detail-machen')
  await expect(
    detail.getByText('to do; to make', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    detail.getByText('করা / তৈরি করা', { exact: true }).first(),
  ).toBeVisible()
  await expect(detail.getByText('What are you doing today?').first()).toBeVisible()
  await expect(detail.getByText('তুমি আজ কী করছ?').first()).toBeVisible()
})

test('pending and missing Bangla fall back without leaking hidden content', async ({
  page,
}) => {
  await page.goto('/bn/words/das-brot')
  await expect(page.getByText('bread', { exact: true })).toBeVisible()
  await expect(page.getByText('রুটি / পাউরুটি')).toHaveCount(0)
  await expect(page.getByText('পাউরুটিটি টাটকা।')).toHaveCount(0)
  await expect(
    page.getByText(
      'এই অংশের বাংলা সহায়তা এখনও পাওয়া যায়নি, তাই ইংরেজি দেখানো হচ্ছে।',
    ).first(),
  ).toBeVisible()

  await page.goto('/bn/words/reisen')
  await expect(page.getByText('to travel', { exact: true })).toBeVisible()
  await expect(
    page.getByText(
      'এই অংশের বাংলা সহায়তা এখনও পাওয়া যায়নি, তাই ইংরেজি দেখানো হচ্ছে।',
    ).first(),
  ).toBeVisible()
})

test('related words navigate within the active locale', async ({ page }) => {
  await page.goto('/en/words/essen')
  await page.getByRole('link', { name: 'trinken', exact: true }).click()

  await expect(page).toHaveURL('/en/words/trinken')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('trinken')
})

test('unknown words render the localized not-found state', async ({ page }) => {
  await page.goto('/en/words/not-a-real-word')

  await expect(page).toHaveURL('/en/words/not-a-real-word')
  await expect(page.getByText('Page not found')).toBeVisible()
})

test('detail layout remains usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/words/der-termin')

  await expect(page.getByTestId('word-detail-der-termin')).toBeVisible()
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
  expect(layout.linkHeight).toBeGreaterThanOrEqual(44)
})
