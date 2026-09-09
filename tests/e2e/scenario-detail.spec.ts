import { expect, test } from '@playwright/test'

const APPROVED_BANGLA = 'ক্যাফেতে অর্ডার করার সময় প্রথমে অভিবাদন'
const APPROVED_ENGLISH = 'Ordering in a German café follows a fixed shape'
const PENDING_BANGLA = 'ট্রেনের টিকিট কিনতে গন্তব্য'

test('a scenario detail page renders its German dialogue and identity', async ({
  page,
}) => {
  await page.goto('/en/scenarios/im-cafe-bestellen')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Im Café bestellen' }),
  ).toBeVisible()
  await expect(page.getByTestId('scenario-detail-im-cafe-bestellen')).toBeVisible()
  await expect(
    page.getByText(
      'Ich kann in einem Café höflich ein Getränk bestellen und die Rechnung verlangen.',
    ),
  ).toBeVisible()
  await expect(page.getByTestId('scenario-dialogue-lines')).toBeVisible()
  await expect(
    page.getByTestId('scenario-dialogue-lines').getByRole('listitem'),
  ).toHaveCount(4)
  await expect(
    page.getByText('Ich hätte gern einen Kaffee, bitte.'),
  ).toBeVisible()
})

test('support mode switches between English, Bangla, and both', async ({
  page,
}) => {
  await page.goto('/en/scenarios/im-cafe-bestellen')
  const support = page.getByRole('group', { name: 'Learning support' })

  await expect(page.locator('body')).not.toContainText(APPROVED_BANGLA)

  await support.getByText('বাংলা', { exact: true }).click()
  await expect(page.locator('body')).toContainText(APPROVED_BANGLA)
  await expect(page.locator('body')).not.toContainText(APPROVED_ENGLISH)

  await support.getByText('English + বাংলা', { exact: true }).click()
  await expect(page.locator('body')).toContainText(APPROVED_BANGLA)
  await expect(page.locator('body')).toContainText(APPROVED_ENGLISH)
})

test('a scenario with pending Bangla falls back to English with a notice', async ({
  page,
}) => {
  await page.goto('/bn/scenarios/fahrkarte-am-schalter-kaufen')

  await expect(
    page.getByTestId('scenario-detail-fahrkarte-am-schalter-kaufen'),
  ).toBeVisible()
  await expect(page.locator('body')).not.toContainText(PENDING_BANGLA)
  await expect(page.locator('body')).toContainText(
    'Buying a train ticket needs three pieces of information',
  )
  await expect(
    page.getByText('এই অংশের জন্য বাংলা নির্দেশনা এখনও নেই'),
  ).toBeVisible()
})

test('key vocabulary and related grammar link into their own pages', async ({
  page,
}) => {
  await page.goto('/en/scenarios/im-cafe-bestellen')

  await expect(page.getByTestId('scenario-word-das-brot')).toBeVisible()
  await page
    .getByTestId('scenario-word-das-brot')
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL('/en/words/das-brot')

  await page.goto('/en/scenarios/im-cafe-bestellen')
  await page
    .getByTestId('scenario-grammar-bestimmter-artikel')
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL('/en/grammar/bestimmter-artikel')
})

test('word and grammar pages link back to the scenarios that use them', async ({
  page,
}) => {
  await page.goto('/en/words/das-brot')
  await expect(
    page.getByTestId('word-scenario-im-cafe-bestellen'),
  ).toBeVisible()
  await page
    .getByTestId('word-scenario-im-cafe-bestellen')
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL('/en/scenarios/im-cafe-bestellen')

  await page.goto('/en/grammar/bestimmter-artikel')
  await expect(
    page.getByTestId('grammar-scenario-im-cafe-bestellen'),
  ).toBeVisible()
})

test('the learning-queue action is present but inert', async ({ page }) => {
  await page.goto('/en/scenarios/im-cafe-bestellen')

  const action = page.getByTestId('scenario-save-vocabulary')

  await expect(action).toBeVisible()
  await expect(action).toBeDisabled()
  await expect(page.getByText('Coming soon')).toBeVisible()
})

test('an unknown scenario slug renders the localized not-found state', async ({
  page,
}) => {
  await page.goto('/en/scenarios/does-not-exist')

  await expect(page).toHaveURL('/en/scenarios/does-not-exist')
  await expect(page.getByText('Page not found')).toBeVisible()
  await expect(page.locator('[data-testid^="scenario-detail-"]')).toHaveCount(0)
})

test('draft scenarios never leak through the public API', async ({
  request,
}) => {
  const response = await request.get(
    '/api/scenarios?draft=true&limit=20&depth=0',
  )

  expect(response.ok()).toBe(true)

  const body = (await response.json()) as {
    docs: { _status: string; slug: string }[]
  }

  expect(body.docs.length).toBeGreaterThan(0)
  for (const doc of body.docs) {
    expect(doc._status).toBe('published')
  }
})

test('detail layout remains usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/scenarios/im-cafe-bestellen')

  await expect(page.getByTestId('scenario-detail-im-cafe-bestellen')).toBeVisible()

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
