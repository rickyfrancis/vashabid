# Phase 06 Implementation Log

## What was achieved

- Added the draft-enabled `words` collection as the core German vocabulary
  model with indexed identity fields, CEFR metadata, noun details, register,
  usefulness score, topic tags, review metadata, and source licensing.
- Added required English learner meanings, optional Bangla learner support, and
  aligned German examples with English and review-gated Bangla explanations.
- Added an active/archived lifecycle independent from Payload's publish status.
- Added ten deterministic published A1/A2 words with English examples and a mix
  of approved, pending, and missing Bangla support.

## How it was implemented

- Reused the Phase 5 slug, CEFR, learner-language, review, source, and version
  field factories so the generated schema stays consistent across collections.
- Generalized editor draft enforcement for Topic Tags and Words. Editors can
  save drafts; admins retain publish, restore, archive, and delete authority.
- Added a publication-intent hook and a pure validator that merges partial
  updates with stored values before checking lemma, word type, CEFR, and English
  meanings. Incomplete drafts remain valid.
- Constrained public and learner reads to active published words. Field access
  removes pending Bangla groups and example explanations from responses.
- Upserted words by stable slug, resolved canonical topic IDs first, compared
  before writing, rejected duplicates or missing relationships, and preserved
  unrelated content.
- Regenerated Payload types after registering `words`. No migration was created
  because development and CI still use disposable databases with schema push.

## Tests added or updated

- Covered collection fields, enum options, defaults, noun conditions,
  relationships, score validation, drafts, lifecycle access, and role matrices.
- Covered every publication blocker, whitespace-only meanings, partial updates,
  incomplete drafts, valid publication, and restored-version intent.
- Covered seed creation, topic resolution, Bangla review distribution,
  repeat-run idempotence, canonical repairs, duplicates, missing tags, and
  preservation of unrelated words.
- Added a browser API test proving public word reads cannot request drafts or
  archived records and cannot see pending Bangla support.

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed` twice against local PostgreSQL
- `pnpm test:e2e`
- `pnpm run ci` against a fresh disposable PostgreSQL database

The second local seed run reported all five topic tags and all ten words
unchanged. The focused test suite contains 98 passing unit tests, and all 15
Playwright tests pass.

## What can be learned

- Draft validation and publication validation are separate concerns: drafts can
  remain incomplete while every publish path still enforces domain invariants.
- A lifecycle field can hide archived content without overloading Payload's
  version-aware `_status` field.
- Field access is necessary for independently reviewed nested content; filtering
  only the parent document would still leak pending translations.
- Deterministic relationship seeding requires resolving stable external keys to
  database IDs before comparing or writing documents.

## Known follow-ups

- Phase 7 will polish the word admin form, slug and archive controls, duplicate
  warnings, validation guidance, and preview links without changing these stored
  field shapes.
- Phase 8 will add repositories, services, and view models for public home-page
  reads while retaining active/published filtering.
- Phase 22 will replace simple review flags with the complete multilingual review
  workflow while preserving Bangla visibility guarantees.
