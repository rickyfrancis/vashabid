import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.CI ? 3000 : process.env.PORT || 3000
const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`

/**
 * The feedback rate limit is process-wide and, on localhost, every request lands
 * in the same "no forwarded address" bucket. Left at its production default the
 * suite would exhaust the window part-way through and fail later specs for the
 * wrong reason — and a retry would make it worse. The limit itself is covered by
 * the hook unit tests, which drive it with an injected clock, so the browser
 * suite raises it out of the way instead.
 *
 * An externally started server (`PLAYWRIGHT_TEST_BASE_URL`) has to set this
 * itself.
 */
const E2E_ENV = { FEEDBACK_RATE_LIMIT: '1000' }

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
          env: E2E_ENV,
          url: BASE_URL,
          reuseExistingServer: false,
          timeout: 120_000,
        }
      : {
          command: 'pnpm dev',
          env: E2E_ENV,
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
  outputDir: './test-results',
})
