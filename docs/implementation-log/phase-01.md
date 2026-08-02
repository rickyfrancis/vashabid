# Phase 01 Implementation Log

## What was achieved

- Added Vitest, React Testing Library, jest-dom, jsdom, and Playwright.
- Added unit, watch, end-to-end, and full CI package scripts.
- Added deterministic unit helpers and smoke coverage for the public homepage and Payload admin route.
- Added a GitHub Actions workflow with PostgreSQL and Chromium provisioning.
- Removed local package-store files and premature migration output from version control.

## How it was implemented

- Vitest runs `src/**/*.test.{ts,tsx}` in jsdom and loads shared matcher and cleanup setup.
- Shared test utilities provide deterministic fixture creation and React Testing Library exports.
- Playwright starts the Next.js development server locally and the production server in CI, while `PLAYWRIGHT_TEST_BASE_URL` supports an externally managed server.
- GitHub Actions installs the pinned Node and pnpm versions, starts disposable PostgreSQL, installs Chromium, and runs `pnpm run ci`.

## Tests added

- Unit coverage for jest-dom setup and deterministic fixture behavior.
- Browser smoke coverage for the public homepage title and primary heading.
- Browser smoke coverage that confirms `/admin` responds without requiring seeded CMS content.

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `CI=true pnpm run ci`

All Phase 1 verification commands passed. The CI-mode command was verified with
the production server path and both browser smoke tests.

## What can be learned

- Unit and browser tests have different responsibilities and environment costs.
- Deterministic fixtures make tests repeatable and safe to run in parallel.
- CI must provision every external dependency, including PostgreSQL and browser binaries.
- Payload schema push is suitable for a disposable test database; production migrations remain a separate deployment concern.

## Known follow-ups

- Phase 2 should add locale-routing tests for `/en` and `/bn`.
- Later feature phases should add component, access-policy, and draft-leak tests to the existing stack.
