import { expect, test } from '@playwright/test'

const PASSWORD = 'a-long-enough-password'

function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

/**
 * Each spec registers its own learner, so onboarding always starts from a
 * profile that does not exist yet and the specs stay independent of each other.
 */
/**
 * The segmented control's radios are `sr-only`, so a real user clicks the
 * visible label. That is what the existing home-page specs do too.
 */
async function chooseOption(
  page: import('@playwright/test').Page,
  group: string,
  option: string,
) {
  await page
    .getByRole('group', { name: group })
    .getByText(option, { exact: true })
    .click()
}

async function registerAndReachOnboarding(
  page: import('@playwright/test').Page,
  label: string,
) {
  await page.goto('/en/signup')
  await page.getByRole('textbox', { name: 'Display name' }).fill('Onboarder')
  await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail(label))
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(page.getByTestId('onboarding-form')).toBeVisible()
}

test('a new learner can complete onboarding', async ({ page }) => {
  await registerAndReachOnboarding(page, 'complete')

  await chooseOption(page, 'Your German level right now', 'B1')
  await page
    .getByRole('combobox', { name: 'Why are you learning German?' })
    .selectOption('work')
  await page
    .getByRole('combobox', { name: 'What would you like to practise most?' })
    .selectOption('conversation')
  await page
    .getByRole('combobox', {
      name: 'How long do you want to study each day?',
    })
    .selectOption('30')
  await page.getByTestId('onboarding-submit').click()

  await expect(page).toHaveURL(/\/en$/)
})

test('answers are stored and shown again when onboarding is revisited', async ({
  page,
}) => {
  await registerAndReachOnboarding(page, 'persist')

  await chooseOption(page, 'Your German level right now', 'B2')
  await page.getByTestId('onboarding-submit').click()
  await expect(page).toHaveURL(/\/en$/)

  await page.goto('/en/onboarding')

  // Revisiting edits the existing profile rather than starting a second one.
  await expect(page.getByRole('radio', { name: 'B2', exact: true })).toBeChecked()
})

test('choosing a second language turns the account support mode into both', async ({
  page,
}) => {
  await registerAndReachOnboarding(page, 'both')

  await chooseOption(page, 'Also show a second language', 'বাংলা')
  await page.getByTestId('onboarding-submit').click()
  await expect(page).toHaveURL(/\/en$/)

  // The stored preference now drives the switcher, without the cookie having
  // been touched by the learner at all.
  await expect(
    page
      .getByRole('group', { name: 'Learning support' })
      .getByRole('radio', { name: 'English + বাংলা', exact: true }),
  ).toBeChecked()
})

test('the stored preference survives signing out and back in', async ({
  page,
}) => {
  const email = uniqueEmail('survives')

  await page.goto('/en/signup')
  await page.getByRole('textbox', { name: 'Display name' }).fill('Survivor')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('signup-submit').click()
  await expect(page.getByTestId('onboarding-form')).toBeVisible()

  await chooseOption(page, 'Also show a second language', 'বাংলা')
  await page.getByTestId('onboarding-submit').click()
  await expect(page).toHaveURL(/\/en$/)

  await page.getByTestId('logout').click()
  await expect(page.getByTestId('account-signed-out')).toBeVisible()

  // Clearing cookies proves the preference came back from the account rather
  // than from this browser.
  await page.context().clearCookies()

  await page.goto('/en/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('account-signed-in')).toBeVisible()

  await expect(
    page
      .getByRole('group', { name: 'Learning support' })
      .getByRole('radio', { name: 'English + বাংলা', exact: true }),
  ).toBeChecked()
})

test('onboarding works in Bangla', async ({ page }) => {
  await page.goto('/bn/signup')
  await page.getByRole('textbox', { name: 'প্রদর্শিত নাম' }).fill('বাংলা শিক্ষার্থী')
  await page.getByRole('textbox', { name: 'ইমেইল' }).fill(uniqueEmail('bn'))
  await page.getByLabel('পাসওয়ার্ড').fill(PASSWORD)
  await page.getByTestId('signup-submit').click()

  await expect(page).toHaveURL(/\/bn\/onboarding$/)
  await expect(page.getByText('আপনি কেন জার্মান শিখছেন?')).toBeVisible()

  await page.getByTestId('onboarding-submit').click()
  await expect(page).toHaveURL(/\/bn$/)
})
