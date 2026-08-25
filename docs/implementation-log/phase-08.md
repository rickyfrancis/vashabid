# Phase 08 Implementation Log

## What was achieved

- Replaced the localized starter page with a real homepage backed by published
  Payload words and topic tags.
- Added a newest-word feature, six A1/A2 word cards, topic cards, a transparent
  Phase 11 search preview, and grammar and scenario placeholders.
- Made English, Bangla, and side-by-side learner snippets update immediately
  when support mode changes.
- Added independent empty states and a homepage-shaped loading skeleton.

## How it was implemented

- Hardened public Local API helpers with `overrideAccess: false`, preserving
  explicit published filtering while also applying anonymous collection and
  field access rules.
- Added injectable `WordRepository`, `TopicTagRepository`, `WordService`, and
  `HomeService` layers. Repositories own deterministic queries; services compose
  the page and map Payload documents into narrow UI-safe view models.
- Selected the newest active published word by creation time, then loaded seven
  A1/A2 candidates so the service can exclude the feature and return six cards.
  Topic tags use their editorial sort order with name as a stable tie-breaker.
- Gated Bangla again during mapping as defense in depth. Unapproved values,
  review flags, sources, IDs, and other raw document fields never enter client
  props.
- Kept the route as an async server component and isolated support-mode state in
  a small client component. English fallback is silent in Bangla mode and
  explained with localized text in side-by-side mode.
- Extended the existing editorial-workbook visual system rather than adding a
  new component library, dependency, schema change, migration, or seed record.

## Tests added or updated

- Covered anonymous Local API enforcement, published/active filters, limits,
  relationship depth, and deterministic word and topic ordering.
- Covered safe word/topic mapping, missing and pending Bangla, malformed English
  content, feature de-duplication, and fully empty repositories.
- Covered all support modes, live switching, fallback messaging, localized
  preview links, independent empty states, and disabled search semantics.
- Extended Playwright coverage for real English and Bangla homepage content,
  word links, support switching, pending-Bangla protection, responsive layout,
  and dark mode.

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed`
- `pnpm test:e2e`
- `CI=true pnpm run ci` using the production Next.js server
- Agent-browser visual inspection at English desktop and Bangla mobile sizes

The final suite contains 133 passing unit tests and 20 passing Playwright tests.
The seed command reported all five topic tags and ten words unchanged.

## What can be learned

- Payload Local API calls need `overrideAccess: false` when public reads are
  expected to honor collection and field access rules.
- A narrow server-created view model is a security boundary as well as a UI
  convenience: reviewed content can be interactive without exposing the raw
  document.
- Small client islands preserve server-side data loading while allowing an
  anonymous preference such as support mode to update the page immediately.
- Deterministic queries and dependency injection make CMS-backed empty,
  fallback, and de-duplication behavior straightforward to test.

## Known follow-ups

- Phase 9 will turn the word collection into a filterable, paginated browse page.
- Phase 10 will replace compact preview links with complete learner-facing word
  detail pages.
- Phase 11 will activate the homepage search entry point.
- Phase 22 will replace simple Bangla review flags with the full multilingual
  review workflow while retaining the same public safety boundary.
