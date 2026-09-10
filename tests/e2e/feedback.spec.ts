import { expect, test } from '@playwright/test'

// A valid report has to clear the 10-character minimum, so every spec that
// expects success writes a realistic sentence rather than a token string.
const REPORT = 'The CEFR level looks too low for this entry.'

async function openForm(page: import('@playwright/test').Page, path: string) {
  await page.goto(path)
  await page.getByTestId('feedback-disclosure').click()
  await expect(page.getByTestId('feedback-form')).toBeVisible()
}

test('a reader can report a problem on a word page', async ({ page }) => {
  await openForm(page, '/en/words/das-brot')

  await page
    .getByRole('combobox', { name: 'What kind of problem is it?' })
    .selectOption('wrong-cefr')
  await page.getByRole('textbox', { name: 'What went wrong?' }).fill(REPORT)
  await page.getByTestId('feedback-submit').click()

  await expect(page.getByTestId('feedback-success')).toBeVisible()
  await expect(page.getByTestId('feedback-success')).toContainText(
    'your report was sent',
  )
  // The form is replaced, so the same report cannot be sent twice by accident.
  await expect(page.getByTestId('feedback-form')).toHaveCount(0)
})

test('an optional email is accepted alongside the report', async ({ page }) => {
  await openForm(page, '/en/words/essen')

  await page.getByRole('textbox', { name: 'What went wrong?' }).fill(REPORT)
  await page
    .getByRole('textbox', { name: 'Email (optional)' })
    .fill('learner@example.com')
  await page.getByTestId('feedback-submit').click()

  await expect(page.getByTestId('feedback-success')).toBeVisible()
})

test('a too-short report is refused and keeps what was typed', async ({ page }) => {
  await openForm(page, '/en/grammar/bestimmter-artikel')

  const field = page.getByRole('textbox', { name: 'What went wrong?' })
  // `novalidate` is not set, so the browser would block an empty submit; a
  // short-but-present value is what reaches the server rules.
  await field.fill('too short')
  await page.getByTestId('feedback-submit').click()

  await expect(
    page.getByText('Describe the problem in a little more detail.'),
  ).toBeVisible()
  await expect(field).toHaveValue('too short')
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByTestId('feedback-success')).toHaveCount(0)
})

test('server rules catch an address the browser lets through', async ({ page }) => {
  await openForm(page, '/en/grammar/modalverben')

  await page.getByRole('textbox', { name: 'What went wrong?' }).fill(REPORT)
  // Chrome's own `type="email"` check accepts a bare host, so this submits
  // successfully from the browser's point of view and is refused server-side.
  // That is the point: the shared schema is the authority, not the browser.
  await page.getByRole('textbox', { name: 'Email (optional)' }).fill('learner@localhost')
  await page.getByTestId('feedback-submit').click()

  await expect(
    page.getByText('Enter a valid email address, or leave the field blank.'),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'What went wrong?' })).toHaveValue(
    REPORT,
  )
  await expect(page.getByTestId('feedback-success')).toHaveCount(0)
})

test('a scenario page reports in Bangla', async ({ page }) => {
  await page.goto('/bn/scenarios/im-cafe-bestellen')
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn')

  await page.getByTestId('feedback-disclosure').click()
  await expect(page.getByTestId('feedback-form')).toBeVisible()
  await page
    .getByRole('textbox', { name: 'কী সমস্যা হয়েছে?' })
    .fill('এই সংলাপে বাংলা ব্যাখ্যাটি স্পষ্ট নয়।')
  await page.getByTestId('feedback-submit').click()

  await expect(page.getByTestId('feedback-success')).toContainText(
    'আপনার রিপোর্ট পাঠানো হয়েছে',
  )
})

test('a Bangla validation error is shown in Bangla', async ({ page }) => {
  await openForm(page, '/bn/words/der-termin')

  await page.getByRole('textbox', { name: 'কী সমস্যা হয়েছে?' }).fill('ছোট')
  await page.getByTestId('feedback-submit').click()

  await expect(
    page.getByText('সমস্যাটি আর একটু বিস্তারিতভাবে লিখুন।'),
  ).toBeVisible()
})

test('the form is available on all three content types', async ({ page }) => {
  for (const path of [
    '/en/words/das-brot',
    '/en/grammar/bestimmter-artikel',
    '/en/scenarios/im-cafe-bestellen',
  ]) {
    await page.goto(path)
    await expect(page.getByTestId('feedback-disclosure')).toBeVisible()
  }
})

test('the moderation queue is not readable by the public', async ({ request }) => {
  const response = await request.get('/api/feedback')

  expect(response.status()).toBe(403)
  const body = await response.text()
  // Nothing about a stored report may leak, not even a count.
  expect(body).not.toContain('relatedSlug')
  expect(body).not.toContain('adminNotes')
})

test('a direct REST submission obeys the same rules as the form', async ({
  request,
}) => {
  // Too short for the shared schema: the collection hook must refuse it even
  // though this request never touched the form.
  const rejected = await request.post('/api/feedback', {
    data: {
      contentType: 'word',
      feedbackType: 'wrong-cefr',
      message: 'short',
      related: { relationTo: 'words', value: 1 },
      relatedSlug: 'das-brot',
      submitterLocale: 'en',
    },
  })

  expect(rejected.status()).toBe(400)
})

test('a REST submission cannot pre-set its own moderation state', async ({
  request,
}) => {
  const response = await request.post('/api/feedback', {
    data: {
      adminNotes: 'injected note',
      contentType: 'word',
      feedbackType: 'wrong-cefr',
      message: 'A direct submission that tries to arrive already resolved.',
      related: { relationTo: 'words', value: 1 },
      relatedSlug: 'das-brot',
      status: 'resolved',
      submitterLocale: 'en',
    },
  })

  expect(response.ok()).toBe(true)
  const created = (await response.json()) as {
    doc?: { adminNotes?: unknown; status?: string }
  }
  expect(created.doc?.status).toBe('new')
  expect(created.doc?.adminNotes ?? null).toBeNull()
})

test('a REST submission cannot contradict its own content type', async ({
  request,
}) => {
  const response = await request.post('/api/feedback', {
    data: {
      contentType: 'word',
      feedbackType: 'wrong-cefr',
      message: 'A word report pointing at a scenario should be refused.',
      related: { relationTo: 'scenarios', value: 1 },
      relatedSlug: 'das-brot',
      submitterLocale: 'en',
    },
  })

  expect(response.status()).toBe(400)
})

test('the feedback form is usable on mobile and in dark mode', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await openForm(page, '/bn/words/das-brot')

  const layout = await page.evaluate(() => {
    const submit = document.querySelector('[data-testid="feedback-submit"]')
    return {
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      hasOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      submitHeight: submit?.getBoundingClientRect().height ?? 0,
    }
  })

  expect(layout.colorScheme).toBe('dark')
  expect(layout.hasOverflow).toBe(false)
  expect(layout.submitHeight).toBeGreaterThanOrEqual(44)
})
