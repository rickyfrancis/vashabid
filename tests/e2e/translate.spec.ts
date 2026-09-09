import { expect, test } from '@playwright/test'

// 'das Brot' is seeded with Bangla that is deliberately left unapproved, so it
// is the fixture for every Bangla visibility assertion.
const PENDING_BANGLA = 'রুটি'
const PENDING_ROMANIZED = 'ruti'

test('English and Bangla routes render the translator shell', async ({
  page,
}) => {
  await page.goto('/en/translate')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Read German with your vocabulary at hand.',
    }),
  ).toBeVisible()
  await expect(page.getByTestId('translate-form')).toBeVisible()

  await page.goto('/bn/translate')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'নিজের শব্দভাণ্ডার সঙ্গে নিয়ে জার্মান পড়ুন।',
    }),
  ).toBeVisible()
})

test('the idle page does not claim machine translation', async ({ page }) => {
  await page.goto('/en/translate')

  await expect(
    page.getByRole('heading', { name: 'A dictionary-assisted reading view' }),
  ).toBeVisible()
  await expect(
    page.getByText(/does not translate whole sentences yet/i),
  ).toBeVisible()
  await expect(page.getByTestId('translate-reading-view')).toHaveCount(0)
})

test('submitting German text detects and links known words', async ({
  page,
}) => {
  await page.goto('/en/translate')
  await page
    .getByRole('textbox', { name: 'Text to look up' })
    .fill('Das Brot ist frisch.')
  await page.getByRole('button', { name: 'Look up' }).click()

  await expect(page).toHaveURL(/\/en\/translate\?text=Das\+Brot\+ist\+frisch/)
  await expect(page.getByTestId('translate-reading-view')).toContainText(
    'Das Brot ist frisch.',
  )
  await expect(page.getByTestId('translate-token-das-brot')).toHaveAttribute(
    'href',
    '/en/words/das-brot',
  )
  await expect(page.getByTestId('translate-word-das-brot')).toBeVisible()
})

test('output is always labelled as dictionary-assisted', async ({ page }) => {
  await page.goto('/en/translate?text=Das+Brot+ist+frisch.')

  await expect(page.getByTestId('translate-dictionary-notice')).toBeVisible()
  await expect(
    page.getByText('Dictionary-assisted, not machine translation'),
  ).toBeVisible()
})

test('conservative inflection folding finds the base verb', async ({
  page,
}) => {
  await page.goto('/en/translate?text=Ich+esse+Brot')

  await expect(page.getByTestId('translate-token-essen')).toHaveAttribute(
    'href',
    '/en/words/essen',
  )
  await expect(page.getByTestId('translate-token-das-brot')).toBeVisible()
})

test('folding never invents a word outside the dictionary', async ({
  page,
}) => {
  await page.goto('/en/translate?text=Ich+schwimme+gern')

  await expect(
    page.getByRole('heading', { name: 'No known words in this text yet' }),
  ).toBeVisible()
  await expect(page.locator('[data-testid^="translate-token-"]')).toHaveCount(0)
})

test('reverse lookup finds German words from English meanings', async ({
  page,
}) => {
  await page.goto('/en/translate?text=bread&from=en&to=de')

  await expect(page.getByTestId('translate-word-das-brot')).toBeVisible()
  await expect(page.getByTestId('translate-token-das-brot')).toHaveAttribute(
    'href',
    '/en/words/das-brot',
  )
})

test('reverse lookup finds German words from approved Bangla', async ({
  page,
}) => {
  await page.goto(
    `/en/translate?text=${encodeURIComponent('খাওয়া')}&from=bn&to=de`,
  )
  await expect(page.getByTestId('translate-word-essen')).toBeVisible()

  await page.goto('/en/translate?text=khaoa&from=bn&to=de')
  await expect(page.getByTestId('translate-word-essen')).toBeVisible()
})

test('unapproved Bangla cannot be discovered or displayed', async ({
  page,
}) => {
  for (const text of [PENDING_BANGLA, PENDING_ROMANIZED]) {
    await page.goto(
      `/en/translate?text=${encodeURIComponent(text)}&from=bn&to=de`,
    )

    await expect(
      page.getByRole('heading', { name: 'No known words in this text yet' }),
    ).toBeVisible()
    await expect(page.getByTestId('translate-word-das-brot')).toHaveCount(0)
  }

  // The pending translation must not leak into the German reading view either.
  await page.goto('/en/translate?text=Das+Brot+ist+frisch.&from=de&to=bn')
  await expect(page.getByTestId('translate-word-das-brot')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(PENDING_BANGLA)
})

test('translator canonicalizes invalid URL state', async ({ page }) => {
  await page.goto('/en/translate?text=%20Das%20Brot%20&extra=value')
  await expect(page).toHaveURL(/\/en\/translate\?text=Das\+Brot$/)

  // An unsupported language pair falls back to the default direction.
  await page.goto('/en/translate?text=Brot&from=en&to=bn')
  await expect(page).toHaveURL(/\/en\/translate\?text=Brot$/)

  // The default direction is implicit, so it is stripped from the URL.
  await page.goto('/en/translate?text=Brot&from=de&to=en')
  await expect(page).toHaveURL(/\/en\/translate\?text=Brot$/)
})

test('sentence mining stays an inert placeholder until learner accounts exist', async ({
  page,
}) => {
  await page.goto('/en/translate?text=Das+Brot+ist+frisch.')

  const action = page.getByTestId('translate-save-sentence')
  await expect(action).toBeVisible()
  await expect(action).toBeDisabled()
})

test('Bangla UI follows support mode without exposing pending content', async ({
  page,
}) => {
  await page.goto('/bn/translate?text=Wir+essen+zusammen.')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')

  const card = page.getByTestId('translate-word-essen')
  await page
    .getByRole('group', { name: 'শেখার সহায়ক ভাষা' })
    .getByText('ইংরেজি + বাংলা', { exact: true })
    .click()

  // The switch swaps a client subtree, so both the old and new card can be in
  // the DOM for a frame. Settling on exactly one card is also the assertion
  // that the word is never listed twice.
  await expect(card).toHaveCount(1)
  await expect(card).toContainText('to eat')
  await expect(card).toContainText('খাওয়া')
})

test('the header links to the translator from every page', async ({ page }) => {
  await page.goto('/en')

  // Asserting the target rather than clicking, because a client-side
  // navigation can drop its RSC payload under parallel workers.
  await expect(
    page.getByTestId('site-header').getByRole('link', { name: 'Translate' }),
  ).toHaveAttribute('href', '/en/translate')
})

test('translator remains usable on mobile and in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/bn/translate')

  await expect(page.getByTestId('translate-form')).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)

  const layout = await page.evaluate(() => {
    const textarea = document.querySelector('#translate-text')
    const root = getComputedStyle(document.documentElement)
    return {
      colorScheme: root.colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      textareaHeight: textarea?.getBoundingClientRect().height ?? 0,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
  expect(layout.textareaHeight).toBeGreaterThanOrEqual(44)
})
