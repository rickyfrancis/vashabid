import { expect, test } from '@playwright/test'

// Seeded by `src/lib/payload/seed/data/users.ts`, so these credentials exist in
// every environment the suite runs against.
const LEARNER = {
  email: 'learner@vashabid.local',
  password: 'seeded-learner-password',
}

const PASSWORD = 'a-long-enough-password'

/** A fresh address per run, so signup specs never collide with each other. */
function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signIn(
  page: import('@playwright/test').Page,
  credentials = LEARNER,
) {
  await page.goto('/en/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByTestId('login-submit').click()
}

test('a visitor can create an account and lands on onboarding', async ({
  page,
}) => {
  await page.goto('/en/signup')

  await page.getByRole('textbox', { name: 'Display name' }).fill('New Learner')
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail('signup'))
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(page).toHaveURL(/\/en\/onboarding$/)
  await expect(page.getByTestId('onboarding-form')).toBeVisible()
  // Signing up signs you in, so the header should already show the account.
  await expect(page.getByTestId('account-signed-in')).toBeVisible()
})

test('signing up with an existing email is refused inline', async ({ page }) => {
  await page.goto('/en/signup')

  await page.getByRole('textbox', { name: 'Display name' }).fill('Duplicate')
  await page.getByRole('textbox', { name: 'Email' }).fill(LEARNER.email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(
    page.getByText(
      'An account with this email already exists. Try signing in instead.',
    ),
  ).toBeVisible()
  // The typed name survives the rejection.
  await expect(page.getByRole('textbox', { name: 'Display name' })).toHaveValue(
    'Duplicate',
  )
})

test('a short password is refused by the server', async ({ page }) => {
  await page.goto('/en/signup')

  await page.getByRole('textbox', { name: 'Display name' }).fill('Short')
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail('short'))
  // Long enough to clear the browser's own check, short enough to fail ours.
  await page.getByLabel('Password').fill('shortpw')
  await page.getByTestId('signup-submit').click()

  await expect(page.getByText('Use at least 10 characters.')).toBeVisible()
})

test('a learner can sign in and out again', async ({ page }) => {
  await signIn(page)

  await expect(page.getByTestId('account-signed-in')).toBeVisible()

  await page.getByTestId('logout').click()

  await expect(page.getByTestId('account-signed-out')).toBeVisible()
  await expect(page.getByTestId('account-signed-in')).toHaveCount(0)
})

test('bad credentials are refused without saying which half was wrong', async ({
  page,
}) => {
  await signIn(page, { email: LEARNER.email, password: 'not-the-password' })

  await expect(page.getByTestId('login-error')).toBeVisible()
  await expect(page.getByTestId('login-error')).toContainText(
    'do not match an account',
  )
  await expect(page.getByTestId('account-signed-in')).toHaveCount(0)
})

test('an unknown email fails exactly like a wrong password', async ({
  page,
}) => {
  await signIn(page, {
    email: uniqueEmail('nobody'),
    password: 'not-the-password',
  })

  // Same message, so the form cannot be used to discover who has an account.
  await expect(page.getByTestId('login-error')).toContainText(
    'do not match an account',
  )
})

test('onboarding refuses anonymous visitors', async ({ page }) => {
  await page.goto('/en/onboarding')

  await expect(page).toHaveURL(/\/en\/login$/)
})

test('a signed-in learner is sent away from signup and login', async ({
  page,
}) => {
  await signIn(page)
  await expect(page.getByTestId('account-signed-in')).toBeVisible()

  await page.goto('/en/login')
  await expect(page).toHaveURL(/\/en$/)

  await page.goto('/en/signup')
  await expect(page).toHaveURL(/\/en$/)
})

test('signing out ends the session on the server, not just in the browser', async ({
  page,
}) => {
  await signIn(page)
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('account-signed-out')).toBeVisible()

  // Sessions are enabled, so a revoked token must be refused even though the
  // browser has simply dropped the cookie.
  await page.goto('/en/onboarding')
  await expect(page).toHaveURL(/\/en\/login$/)
})

test('anonymous visitors can still browse public content', async ({ page }) => {
  await page.goto('/en/words')

  await expect(page.getByTestId('account-signed-out')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.goto('/en/words/das-brot')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the sign-in page works in Bangla', async ({ page }) => {
  await page.goto('/bn/login')

  await expect(page.getByTestId('login-form')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'আবার স্বাগতম',
  )
})

test('learner profiles are unreadable to anonymous callers', async ({
  request,
}) => {
  const response = await request.get('/api/learner-profiles?limit=1')

  expect(response.status()).toBe(403)
})
