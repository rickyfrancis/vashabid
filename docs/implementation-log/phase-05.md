# Phase 05 Implementation Log

## What was achieved

- Added reusable Payload fields for slugs, CEFR levels, English and Bangla
  learner support, review metadata, source licensing, and content drafts.
- Added draft-enabled hierarchical topic tags with German names and separate
  English and Bangla descriptions.
- Added least-privilege taxonomy access for admins, editors, learners, suspended
  accounts, and anonymous visitors.
- Added deterministic, non-destructive topic-tag seeding and five reviewed,
  published starter tags.

## How it was implemented

- Centralized typed field factories under `src/lib/payload/fields/` so later
  words, grammar, and scenario collections share one schema vocabulary.
- Kept Payload's `_status` as the only publishing status and allowed incomplete
  drafts without weakening validation for publication.
- Added a server-side operation guard that limits editors to draft saves,
  including version restoration, while admins retain publish and delete control.
- Constrained learners and public visitors to published tags and used field
  access to omit unapproved Bangla support content from their responses.
- Validated parent relationships by walking ancestor IDs through the Local API,
  passing the active request so the validation stays inside the operation's
  transaction and can inspect drafts.
- Upserted seed records by slug in root/child passes, updating only changed
  canonical data and preserving unrelated records.
- Regenerated Payload types after registering `topic-tags`. No migration was
  created because local development still uses schema push.

## Tests added or updated

- Covered every reusable field helper, CEFR option, default, and Bangla read rule.
- Covered the Topic Tag schema, full access matrix, editor draft enforcement,
  integer sort order, and direct and indirect hierarchy cycles.
- Covered initial seed creation, parent resolution, repeat-run idempotence,
  canonical repairs, duplicate detection, and preservation of unrelated tags.
- Added a browser API smoke test proving `/api/topic-tags` remains public and is
  not intercepted by locale routing.

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm seed` twice against local PostgreSQL

The database contained one record for each canonical slug. All five records were
published, and `essen-und-trinken` referenced `alltag` as its parent.

## What can be learned

- Field factories keep generated Payload types and admin forms consistent across
  collections without forcing collection configs into an object-oriented shape.
- Draft UI controls are not authorization; publish restrictions must also run on
  the server for REST, Local API, bulk, and version operations.
- Hierarchies need cycle validation in addition to a self-referencing field.
- Compare-before-write upserts provide deterministic fixtures without deleting
  manually entered development content or creating needless versions.

## Known follow-ups

- Phase 6 will reuse these helpers and topic relationships for the Words MVP and
  add ten deterministic A1/A2 word seeds.
- Phase 7 can add richer editorial admin components without changing the stored
  field shapes established here.
- Phase 22 will replace simple review flags with the complete multilingual review
  workflow while preserving Bangla visibility guarantees.
