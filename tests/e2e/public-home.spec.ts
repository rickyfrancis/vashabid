import { expect, test } from '@playwright/test'

test('root locale negotiation uses browser language and English fallback', async ({
  browser,
}, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string

  const banglaContext = await browser.newContext({
    baseURL,
    locale: 'bn-BD',
  })
  const banglaPage = await banglaContext.newPage()
  await banglaPage.goto('/')
  await expect(banglaPage).toHaveURL(/\/bn$/)
  await banglaContext.close()

  const unsupportedContext = await browser.newContext({
    baseURL,
    locale: 'fr-FR',
  })
  const fallbackPage = await unsupportedContext.newPage()
  await fallbackPage.goto('/')
  await expect(fallbackPage).toHaveURL(/\/en$/)
  await unsupportedContext.close()
})

test('saved locale takes precedence over browser language', async ({
  browser,
}, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string
  const context = await browser.newContext({ baseURL, locale: 'bn-BD' })
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: 'en', url: baseURL },
  ])

  const page = await context.newPage()
  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
  await context.close()
})

test('English and Bangla routes render localized UI and document language', async ({
  page,
}) => {
  await page.goto('/en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Learn German through the language you know.',
    }),
  ).toBeVisible()

  await page.goto('/bn')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'আপনার পরিচিত ভাষার মাধ্যমে জার্মান শিখুন।',
    }),
  ).toBeVisible()
})

test('localized home pages render published Payload words and topics', async ({
  page,
}) => {
  await page.goto('/en')
  await expect(
    page.getByRole('heading', { name: 'Newest published word' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Beginner words for A1 and A2' }),
  ).toBeVisible()
  await expect(page.getByText('Alltag', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('searchbox', { name: 'Search German vocabulary' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('link', { name: 'Open word page' }),
  ).toHaveAttribute('href', /\/en\/words\//)

  await page.goto('/bn')
  await expect(
    page.getByRole('heading', { name: 'সর্বশেষ প্রকাশিত শব্দ' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'A1 ও A2 স্তরের প্রাথমিক শব্দ' }),
  ).toBeVisible()
  await expect(
    page.getByRole('searchbox', { name: 'জার্মান শব্দভাণ্ডারে খুঁজুন' }),
  ).toBeDisabled()
})

test('support switching updates snippets and never reveals pending Bangla', async ({
  page,
}) => {
  await page.goto('/en')

  const approvedCard = page.getByTestId('word-card-machen').first()
  const pendingCard = page.getByTestId('word-card-das-brot').first()
  await expect(approvedCard).toContainText('to do; to make')
  await expect(pendingCard).toContainText('bread')

  await page
    .getByRole('group', { name: 'Learning support' })
    .getByText('English + বাংলা', { exact: true })
    .click()

  await expect(
    page.getByRole('radio', { name: 'English + বাংলা', exact: true }),
  ).toBeChecked()
  const updatedApprovedCard = page
    .getByTestId('word-card-machen')
    .filter({ hasText: 'করা / তৈরি করা' })
  const updatedPendingCard = page
    .getByTestId('word-card-das-brot')
    .filter({ has: page.getByRole('note') })
  await expect(updatedApprovedCard).toBeVisible()
  await expect(updatedPendingCard).toContainText('bread')
  await expect(updatedPendingCard).not.toContainText('রুটি / পাউরুটি')
  await expect(updatedPendingCard.getByRole('note')).toHaveText(
    'Bangla is still under review, so English is shown for now.',
  )
})

test('language switch preserves location and remembers the explicit locale', async ({
  page,
  context,
}) => {
  await page.goto('/en?source=e2e#top')
  await page
    .getByRole('combobox', { name: /Interface language/ })
    .selectOption('bn')

  await expect(page).toHaveURL(/\/bn\?source=e2e#top$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')

  const localeCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'NEXT_LOCALE',
  )
  expect(localeCookie?.value).toBe('bn')

  await page.goto('/')
  await expect(page).toHaveURL(/\/bn$/)
})

test('support mode defaults from locale and persists independently', async ({
  page,
  context,
}) => {
  await page.goto('/en')
  const englishSupport = page.getByRole('radio', { name: 'English', exact: true })
  await expect(englishSupport).toBeChecked()
  await page
    .getByRole('group', { name: 'Learning support' })
    .getByText('English + বাংলা', { exact: true })
    .click()

  const supportCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'vashabid_support_mode',
  )
  expect(supportCookie?.value).toBe('both')

  await page.reload()
  await expect(
    page.getByRole('radio', { name: 'English + বাংলা', exact: true }),
  ).toBeChecked()

  await page
    .getByRole('combobox', { name: /Interface language/ })
    .selectOption('bn')
  await expect(page).toHaveURL(/\/bn$/)
  await expect(
    page.getByRole('radio', { name: 'ইংরেজি + বাংলা', exact: true }),
  ).toBeChecked()
})

test('invalid support mode cookie falls back to the route locale', async ({
  browser,
}, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string
  const context = await browser.newContext({ baseURL })
  await context.addCookies([
    {
      name: 'vashabid_support_mode',
      value: 'invalid',
      url: baseURL,
    },
  ])

  const page = await context.newPage()
  await page.goto('/bn')
  await expect(
    page.getByRole('radio', { name: 'বাংলা', exact: true }),
  ).toBeChecked()
  await context.close()
})

for (const viewport of [
  { height: 844, locale: 'bn', width: 390 },
  { height: 800, locale: 'en', width: 1280 },
] as const) {
  test(`${viewport.locale} shell is usable at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    await page.goto(`/${viewport.locale}`)

    await expect(page.getByTestId('site-header')).toBeVisible()
    await expect(page.getByTestId('site-footer')).toBeVisible()
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('combobox')).toBeEnabled()
    await expect(page.getByRole('group')).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)

    const controlsMeetTouchTarget = await page.evaluate(() => {
      const select = document.querySelector('select')
      const radioLabel = document.querySelector('input[type="radio"] + label')
      return Boolean(
        select &&
          radioLabel &&
          select.getBoundingClientRect().height >= 44 &&
          radioLabel.getBoundingClientRect().height >= 44,
      )
    })
    expect(controlsMeetTouchTarget).toBe(true)
  })
}

test('system dark mode applies the semantic dark palette', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/en')

  await expect(page.getByTestId('site-header')).toBeVisible()
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const body = getComputedStyle(document.body)
    return {
      colorScheme: root.colorScheme,
      background: body.backgroundColor,
      foreground: body.color,
    }
  })

  expect(palette.colorScheme).toBe('dark')
  expect(palette.background).not.toBe('rgba(0, 0, 0, 0)')
  expect(palette.foreground).not.toBe(palette.background)
})

test('unknown localized routes render the matching translated 404', async ({
  page,
}) => {
  await page.goto('/bn/does-not-exist')
  await expect(
    page.getByRole('heading', { name: 'পাতাটি পাওয়া যায়নি' }),
  ).toBeVisible()
  await expect(page.getByText('Page not found')).toHaveCount(0)
})
