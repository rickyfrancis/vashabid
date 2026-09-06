# Phase 13 Implementation Log

## What was achieved

- Added the `Scenarios` collection so real-world German dialogues are editorial
  content with the same publishing and review rules as words and grammar.
- Added localized public pages at `/[locale]/scenarios` and
  `/[locale]/scenarios/[slug]` with CEFR, situation, and topic filters,
  six-per-page pagination, and full English, Bangla, and side-by-side support.
- Modelled the dialogue as an aligned transcript: each line carries a German
  speaker, the German line, a required English explanation, and a review-gated
  Bangla explanation.
- Connected scenarios in both directions: a header nav entry, a real link from
  the last dead home-page placeholder, a capped scenario section in search, and
  reverse links from both word detail and grammar detail pages.
- Seeded eight deterministic scenarios across A1 to B1 spanning seven situation
  types, one of which keeps Bangla unapproved so fallback and search gating stay
  exercised.
- Kept drafts, editorial metadata, source data, database identifiers, and
  pending Bangla out of every public view model.

## How it was implemented

- Built the collection entirely from the existing field factories:
  `createSlugField`, `createCefrField`, the English and Bangla learner groups,
  review metadata, and source metadata. Access reuses `publishedOrEditorial`
  (not `publishedActiveOrEditorial` — scenarios have no `lifecycleStatus`, the
  same choice grammar made), and Bangla stays gated by
  `canReadBanglaLearnerContent` at both the group and the dialogue-line level.
- Reused `createPublicationIntentHook` and `createPublicationValidationHook`
  from `collections/hooks/content.ts`. Scenario publishing additionally requires
  at least one dialogue line carrying both a German line and an English
  explanation, using the array predicate shape the word hooks already
  established for `english.meanings`.
- Put cultural notes *inside* the English and Bangla learner groups rather than
  at the top level, so Bangla cultural notes inherit review gating for free.
- Mirrored the words and grammar feature layer: a repository with an injectable
  `find`, a service with constructor-injected collaborators, mappers that return
  `null` so unusable documents are filtered out, a `react.cache` detail loader
  shared with `generateMetadata`, and query normalization that redirects to a
  canonical URL before querying.
- Scenarios are the first content type relating to two other collections, so the
  ordering and de-duplication logic that words and grammar each spelled out
  inline became one generic `orderedRelated` helper in the scenario service.
- Added `GrammarRepository.findPublishedByIDs`, which did not exist yet, so the
  scenario service could hydrate related grammar topics through a repository
  rather than a sibling service.
- Extracted `WordSummaryCard` once scenario detail became the third surface
  rendering the same word card, and added `ScenarioSummaryCard` for the two
  reverse-link surfaces.
- Extended search rather than reshaping it: scenarios join grammar as a capped
  secondary section computed only for the first page of word results, so the
  existing pagination contract is untouched.

## Tests added or updated

- Covered the collection as a config object: tab order, indexed identity fields,
  the exact situation-type option set, the required English explanation against
  an optional Bangla one, aligned dialogue rows, the access matrix, editor
  draft-only enforcement, and every publish-validation error path including the
  empty and half-written dialogue cases.
- Covered the repository call shapes for both reverse lookups and the
  three-filter page query, including that topic ID zero is a real filter.
- Covered the service: the full four-key canonicalization matrix, Bangla gating
  at card, explanation, cultural-note, and dialogue-line level, relationship
  ordering and de-duplication across both relationship types, and `null` returns
  for unusable documents.
- Covered both components in all three support modes, including the fallback
  notice, omitted optional sections, real link targets, the inert learning-queue
  placeholder, and an explicit assertion that withheld Bangla never renders in
  any mode.
- Covered seeding for creation, idempotence, drift repair, reordered rich-text
  keys, duplicate slugs, duplicate and missing references across all three
  reference collections, and the exact Bangla review state per seed.
- Added Playwright coverage for the scenario workbook and detail pages, and
  extended the search, home, word-detail, and grammar-detail specs for the new
  cross-links.

The suite is 506 passing unit tests (up from 364) and 75 passing Playwright
tests (up from 53).

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed` twice against local PostgreSQL — the second run reported all five
  topic tags, ten words, eight grammar topics, and eight scenarios unchanged
- Migration up, down, and up again against a disposable PostgreSQL database
- `pnpm test:e2e` — four consecutive clean runs (three parallel, one with
  `--workers=1` as CI runs it)
- Manual checks of Bangla gating through the running server for every support
  mode on browse, detail, and search

## What can be learned

- The third implementation is where the abstraction earns itself. Words and
  grammar each inlined relationship ordering and the related-word card, and that
  was the right call at two call sites. At three, `orderedRelated` and
  `WordSummaryCard` stopped being speculative and started removing real
  duplication.
- A dependency rule needs restating when the graph grows. "Point at the
  repository, never the sibling service" was a two-feature convention in Phase
  12; with three cross-linking features it is the thing keeping the import graph
  acyclic, so it now lives in `docs/architecture.md` as a general rule.
- Test fixtures are not documentation. Three e2e assertions failed because they
  used strings from the *unit-test* fixtures rather than the actual seed data.
  The page was correct every time; the tests were describing a product that did
  not exist.
- New content can break an old test without breaking the code. The pre-existing
  search spec asserted `getByRole('link', { name: 'essen' })`, and Playwright
  matches accessible names as substrings, so the new scenario "Freunde zum
  **Essen** einladen" made the locator ambiguous. The fix was to make the old
  locator exact, not to change the new content.
- Reproduce before diagnosing. A soft-navigation test failure looked like a
  scenario bug until the same navigation passed in isolation and on grammar and
  words routes, which located it in the pre-existing streaming defect under
  parallel load instead.

## Known follow-ups

- `next start` still logs `TypeError: controller[kState].transformAlgorithm is
  not a function`, carried over from Phase 12. It is now known to have a visible
  effect: under parallel Playwright workers it can drop an RSC payload and leave
  `<main>` empty after a client-side navigation. The two navigation tests
  therefore assert link targets instead of clicking through. Worth tracing to a
  Next or Node streaming change before it hides a real error.
- `notFound()` returns HTTP 200 on every detail route (words, grammar, and
  scenarios alike). The localized not-found page renders correctly, so this is
  cosmetic for users but wrong for crawlers. Pre-existing and not scenario
  specific.
- Scenarios have no duplicate-title admin warning. Phase 7 built one for words
  only; the equivalent for grammar and scenarios remains deferred.
- `createReviewMetadataField` is called with only German, English, and Bangla
  because no audio or quiz content exists for scenarios yet.
- The "add vocabulary to learning queue" action is an inert disabled button until
  learner accounts land in Phase 16 and the queue in Phase 17.
- `docs/implementation-log/phase-11.md` is still missing even though Phase 11 is
  merged, which leaves the Phase 11 record short of the plan's definition of
  done.
- Local development note: `node_modules` was missing `lucide-react` and
  `@payloadcms/ui` at the start of this phase and needed a reinstall, and the
  `vashabid_pgdata` volume's `payload` role password no longer matched
  `.env.local`. Neither is caused by this phase, but both block a cold start.
