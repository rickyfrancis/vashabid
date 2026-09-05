# Phase 12 Implementation Log

## What was achieved

- Added the `GrammarTopics` collection so German grammar patterns are editorial
  content with the same publishing rules as vocabulary.
- Added localized public pages at `/[locale]/grammar` and
  `/[locale]/grammar/[slug]` with CEFR and topic filters, six-per-page
  pagination, and full English, Bangla, and side-by-side support.
- Made English explanations rich text through a deliberately narrow Lexical
  feature set, while keeping Bangla review-gated at every surface.
- Connected grammar to the rest of the product: a header nav entry, a real link
  from the previously dead home-page placeholder, reverse links from word detail
  pages, and grammar results in search.
- Seeded eight deterministic grammar topics across A1 to B1, one of which keeps
  Bangla unapproved so fallback and search gating stay exercised.
- Kept drafts, editorial metadata, source data, database identifiers, and
  pending Bangla out of every public view model.

## How it was implemented

- Built the collection from the existing field factories rather than new schema:
  `createSlugField`, `createCefrField`, the English and Bangla learner groups,
  review metadata, and source metadata. Access reuses `publishedOrEditorial`,
  and Bangla stays gated by `canReadBanglaLearnerContent` at both the group and
  the individual example level.
- Generalized the word publish-gating hooks into
  `createPublicationIntentHook` and `createPublicationValidationHook` in
  `collections/hooks/content.ts`, then reimplemented the word hooks on top of
  them without changing their exported signatures.
- Added `src/lib/payload/fields/rich-text.ts` with a restricted editor, a
  deterministic paragraph builder for seeds and tests, and a hand-written
  plain-text flattener. The flattener is hand-written rather than delegated so
  search normalization and metadata stay stable across Payload releases.
- Mirrored the words feature layer: a repository with an injectable `find`, a
  service with constructor-injected collaborators, mappers that return `null` so
  unusable documents are filtered out, a `react.cache` detail loader shared with
  `generateMetadata`, and query normalization that redirects to a canonical URL
  before querying.
- Kept the two-way word and grammar link acyclic by having `WordService` depend
  on `GrammarRepository` rather than `GrammarService`.
- Extended search instead of reshaping it. Words remain the paginated primary
  list and grammar renders as a capped secondary section on the first page only,
  so the existing pagination contract is untouched.
- Promoted `cleanText` and `cleanRows` out of the words service into
  `src/lib/content/text.ts` now that a second feature needs them.

## Tests added or updated

- Covered the collection as a config object: tab order, indexed identity fields,
  the required English explanation against an optional Bangla one, aligned
  examples, bounded relationships, the access matrix, editor draft-only
  enforcement, and every publish-validation error path.
- Covered the rich-text helpers for nested nodes, malformed roots, non-string
  text, whitespace collapsing, and Bangla and German characters.
- Covered seeding for creation, idempotence, drift repair, duplicate slugs,
  duplicate and missing references, and reordered rich-text keys.
- Covered the repository call shapes, the full query-canonicalization matrix,
  Bangla gating at each surface, related-word ordering and deduplication, and
  metadata language selection and clipping.
- Covered both components in all three support modes, including the fallback
  notice, omitted optional sections, real link targets, and an explicit
  assertion that withheld Bangla never renders.
- Added Playwright coverage for the workbook and detail pages and extended the
  search and word-detail specs for the new cross-links.

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed` repeatedly against local PostgreSQL
- Migration up, down, and up again against a disposable PostgreSQL database
- `pnpm test:e2e`
- Manual checks of Bangla gating through the running server for every support
  mode on browse, detail, and search

The final suite contains 364 passing unit tests and 53 passing Playwright tests.
The repeated local seed reported all five topic tags, ten words, and eight
grammar topics unchanged.

## What can be learned

- Reusing content patterns is a schema decision before it is a code decision.
  Because grammar adopted the existing field factories and access helpers,
  review gating and draft safety came for free rather than being reimplemented
  and re-audited.
- A generated migration is a draft, not an artifact. The generated `down`
  dropped tables with `CASCADE` and then tried to drop a constraint that the
  cascade had already removed, so the migration could not reverse until the
  follow-up drops were made conditional.
- Storage format leaks into equality. Rich text round-trips through `jsonb`,
  which does not preserve key order, so an order-sensitive comparison made
  reseeding report drift forever. Comparing canonical serializations fixed it.
- Verification tooling needs verifying too. An early Bangla leak check used
  `grep`, which silently matched nothing on Bengali text; the same check against
  a known-good page proved the tool was at fault, not the code.
- Two features that link to each other need an explicit dependency direction.
  Pointing the word service at the grammar repository, never the grammar
  service, kept the graph acyclic without weakening either boundary.

## Known follow-ups

- Phase 13 will add scenarios and can reuse the grammar collection shape, the
  rich-text helpers, and the publish-hook factories directly.
- The home page still shows a scenarios placeholder; Phase 13 replaces it the
  same way this phase replaced the grammar placeholder.
- Grammar has no duplicate-name admin warning. Phase 7 built one for words only,
  and the equivalent component for grammar remains deferred.
- `createReviewMetadataField` is called with only German, English, and Bangla
  because no audio or quiz content exists for grammar yet.
- `docs/implementation-log/phase-11.md` is still missing even though Phase 11 is
  merged, which leaves the Phase 11 record short of the plan's definition of
  done.
- `next start` logs `TypeError: controller[kState].transformAlgorithm is not a
  function` during Playwright runs. It predates this phase: it reproduces with
  only the Phase 8 and Phase 10 specs, never appears for grammar routes, and no
  test fails because of it. Worth tracing to a Next or Node streaming change
  before it hides a real error.
