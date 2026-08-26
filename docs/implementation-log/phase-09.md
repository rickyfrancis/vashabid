# Phase 09 Implementation Log

## What was achieved

- Added a localized public word catalogue at `/[locale]/words`.
- Added single-value CEFR, word-type, and topic filters backed by canonical URL
  query parameters.
- Added stable six-word pagination across published active vocabulary.
- Added learner-safe word cards with noun articles, CEFR and word-type labels,
  approved support meanings, and published topic tags.
- Added a shared Words navigation entry, responsive filter ledger, empty state,
  and browse-shaped loading UI.

## How it was implemented

- Extended `WordRepository` with an injectable, depth-zero Payload query that
  composes active, CEFR, word-type, and topic constraints while continuing to
  use the access-enforced `findPublished` helper.
- Moved `TopicTagRepository` out of the home feature and added an unpaginated,
  editorially ordered query for every published browse option.
- Extended `WordService` to normalize untrusted search parameters, resolve only
  published topic slugs, map safe card view models, and return canonical
  redirects for invalid or out-of-range URLs.
- Kept topic IDs, review flags, sources, and raw Payload documents on the server.
  Only approved Bangla values and published topic labels enter client props.
- Reused the existing cookie-backed support preference. Support changes update
  meanings immediately without adding a second browse-only preference or query
  parameter.
- Refactored learner-support rendering and word-type labels into shared feature
  boundaries used by both the homepage and catalogue.
- Extended the editorial-workbook visual system with a desktop filter ledger,
  compact index cards, deliberate article typography, and a mobile reading order
  of context, filters, then results.

## Tests added or updated

- Covered Payload browse query composition, pagination controls, anonymous
  access enforcement, stable ordering, and published topic option loading.
- Covered URL normalization, repeated and invalid values, unknown topics,
  canonical page bounds, safe card mapping, article handling, optional fields,
  and Bangla review gating.
- Covered localized filter state, Apply/Clear controls, retained pagination
  filters, card rendering, empty state behavior, and live support switching.
- Added Playwright coverage for English and Bangla routes, seeded pagination,
  combined filters, canonical redirects, pending-Bangla protection, responsive
  layout, touch targets, and dark mode.

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed`
- `pnpm test:e2e`
- `CI=true pnpm run ci` using the production Next.js server
- Agent-browser visual inspection at English desktop and Bangla mobile sizes

The final suite contains 159 passing unit tests and 26 passing Playwright tests.
The seed command reported all five topic tags and ten words unchanged.

## What can be learned

- URL normalization is part of the public interface: canonical redirects make
  shared filter and pagination links deterministic.
- Resolving a public relationship through the published option set keeps raw IDs
  and inaccessible tags out of view models without requiring relationship depth.
- A server-rendered native GET form can provide durable, accessible filtering
  while keeping the route and client JavaScript surface small.
- Responsive source order matters as much as grid styling; mobile learners need
  page context before filter controls even when the desktop filter is a sidebar.

## Known follow-ups

- Phase 10 will replace compact preview destinations with complete learner-facing
  word detail pages.
- Phase 11 will add vocabulary search without changing the Phase 9 filter URL
  contract.
- Logged-in support preferences remain deferred to the learner account phases.
