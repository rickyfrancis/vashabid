# Phase 10 Implementation Log

## What was achieved

- Replaced the compact published-word preview with complete localized detail
  pages at `/[locale]/words/[slug]`.
- Added English, Bangla, and side-by-side learner support for meanings,
  explanations, examples, common mistakes, and Bangla pronunciation guidance.
- Added noun details, IPA, CEFR, register, usefulness, topic links, an honest
  unavailable-audio state, localized metadata, and detail-specific loading UI.
- Added ordered related-word relationships to the Words collection and safe
  learner-facing related-word cards.
- Kept drafts, archived documents, pending Bangla, review flags, source data,
  and database identifiers outside the public detail view model.

## How it was implemented

- Added a depth-limited, many-value self-relationship to the existing Payload
  Words relationship tab, regenerated types, and created a reversible Postgres
  migration for current and versioned relationship tables.
- Refactored deterministic word seeding into two passes: create or locate every
  canonical word first, then resolve related slugs to stable IDs and apply the
  complete canonical records. Missing, duplicate, and self references fail
  before relationships are written.
- Added exact-slug and related-ID repository queries that continue through the
  access-enforced published helper with `depth: 0` and active lifecycle filters.
- Extended `WordService` with defensive trimming, noun headword splitting,
  review-gated support mapping, aligned example mapping, published topic
  resolution, and ordered deduplication of related words.
- Shared one cached detail loader between the route and metadata generation so
  a request does not repeat the same Payload orchestration unnecessarily.
- Extended the editorial-workbook visual language into a reference-spread
  layout with a large German headword, fact ledger, language panels, numbered
  examples, contextual side notes, and responsive related-word cards.
- Updated shared learner snippets so Bangla mode explains English fallback as
  clearly as combined mode.

## Tests added or updated

- Covered relationship schema and migration SQL, type generation, seed
  relationship resolution, invalid references, order, repairs, and idempotence.
- Covered published detail queries, empty related queries, safe view-model
  mapping, optional fields, Bangla review gating, related-word filtering, and
  English/Bangla metadata selection.
- Covered component rendering in all support modes, semantic language tags,
  section fallback notices, noun and pronunciation notes, optional-section
  omission, real links, and the non-interactive audio state.
- Replaced preview Playwright tests with complete English and Bangla detail
  flows, combined support, pending-content protection, related navigation,
  localized 404s, mobile sizing, dark mode, and overflow checks.

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed` twice against local PostgreSQL
- Migration up and down against a disposable PostgreSQL database
- `pnpm test:e2e`
- `CI=true pnpm run ci` against a fresh migrated PostgreSQL database
- Agent-browser visual inspection of English desktop and Bangla mobile dark
  layouts

The final suite contains 174 passing unit tests and 30 passing Playwright tests.
The repeated local seed reported all five topic tags and ten words unchanged.

## What can be learned

- A public view model is a security boundary: relationship IDs and review flags
  are useful on the server but do not belong in a client component contract.
- Self-relationships need both storage depth limits and explicit public queries;
  relying on automatic relationship population makes cycles and draft leakage
  harder to reason about.
- Content-level fallback is more resilient than document-level fallback because
  an approved language group can still omit an individual example or note.
- Two-pass seeding is a simple way to make deterministic relationships work on
  both empty and already-populated databases.

## Known follow-ups

- Phase 11 will add search without changing the word-detail URL or view-model
  safety boundary.
- Structured verb and adjective morphology remains deferred until the content
  model provides reviewed typed fields.
- Real audio and quizzes remain deferred; the existing audio and quiz review
  flags do not imply that playable or interactive content exists.
