# Phase 07 Implementation Log

## What was achieved

- Reorganized the Words editor into five schema-neutral content tabs and a
  persistent review and publishing sidebar without changing stored field paths.
- Added field guidance, stable slug controls, an archive-first removal message,
  and actionable publish blockers tied to the relevant admin sections.
- Added a non-blocking duplicate warning for normalized lemma and word type
  matches across draft, published, active, and archived editorial records.
- Added saved English and Bangla preview links for active published words and a
  minimal localized public preview page for both UI locales.

## How it was implemented

- Wrapped existing fields in unnamed Payload tabs and a presentational sidebar
  collapsible so the generated API and database shape remain compatible.
- Moved publication enforcement to `beforeValidate`, ahead of Payload's generic
  required-field validation, while retaining partial-update merging and draft
  bypass behavior.
- Used Payload form and document hooks in client UI fields. The duplicate check
  waits 300 ms, aborts stale requests, uses the authenticated collection API,
  filters normalized candidates, excludes the current document, and never
  blocks saving when the request fails.
- Derived preview links from the currently saved document rather than unsaved
  form state. Draft and archived records receive corrective guidance instead.
- Added a narrow preview query that explicitly requires `_status: published`
  through the shared helper and `lifecycleStatus: active`, then maps only lemma,
  slug, word type, and CEFR into the public view model.
- Added `@payloadcms/ui` as a direct dependency and regenerated Payload types and
  the admin import map. No migration or seed-data changes were necessary.

## Tests added or updated

- Covered form organization, unchanged paths, admin component registration,
  slug labels, lifecycle access, descriptions, and actionable publish messages.
- Covered duplicate normalization, query construction, debounce behavior, stale
  request cancellation, current-record exclusion, draft and archived matches,
  linked warnings, and non-blocking request failures.
- Covered saved preview-link eligibility, corrective guidance, preview-safe data
  mapping, active/published filtering, both localized routes, and missing words.
- Retained the Payload admin and API smoke coverage, including draft, archive,
  and pending-Bangla leak protections.

## Verification

- `pnpm generate:types`
- `pnpm generate:importmap`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed`
- `pnpm test:e2e`
- `CI=true pnpm run ci` against a fresh disposable PostgreSQL database
- Agent-browser visual inspection of English and Bangla preview pages

The final suite contains 111 passing unit tests and 18 passing Playwright tests.
The disposable CI database created all five topic tags and ten words from empty,
and was removed after the successful run.

## What can be learned

- Payload's unnamed tabs and presentational fields can substantially improve an
  editorial form without introducing a data migration.
- Advisory duplicate detection belongs in the admin experience, while stable
  database constraints remain responsible for hard uniqueness guarantees.
- Publication validation produces better editorial feedback when it runs before
  generic field validation and reports stable paths into grouped content.
- Preview links should describe saved public state; deriving them from unsaved
  form values can create links that do not resolve or expose the wrong lifecycle.

## Known follow-ups

- Phase 10 will replace the narrow identity preview with the complete localized
  word detail model, metadata, learner support, examples, and optional sections.
- Phase 22 will replace simple review flags with the complete multilingual review
  workflow while preserving Bangla visibility guarantees.
