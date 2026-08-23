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
  const englishSupport = page.getByRole('combobox', {
    name: /Learning support/,
  })
  await expect(englishSupport).toHaveValue('en')
  await englishSupport.selectOption('both')

  const supportCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'vashabid_support_mode',
  )
  expect(supportCookie?.value).toBe('both')

  await page.reload()
  await expect(englishSupport).toHaveValue('both')

  await page
    .getByRole('combobox', { name: /Interface language/ })
    .selectOption('bn')
  await expect(page).toHaveURL(/\/bn$/)
  await expect(
    page.getByRole('combobox', { name: /শেখার সহায়ক ভাষা/ }),
  ).toHaveValue('both')
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
    page.getByRole('combobox', { name: /শেখার সহায়ক ভাষা/ }),
  ).toHaveValue('bn')
  await context.close()
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
