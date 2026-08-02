import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.CI ? 3000 : process.env.PORT || 3000
const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : process.env.CI
      ? {
          command: 'pnpm start',
          url: BASE_URL,
          reuseExistingServer: false,
          timeout: 120_000,
        }
      : {
          command: 'pnpm dev',
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
  outputDir: './test-results',
})
