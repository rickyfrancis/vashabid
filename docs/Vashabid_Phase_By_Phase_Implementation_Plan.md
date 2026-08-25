# Vashabid Phase-by-Phase Implementation Plan

## Purpose

This plan breaks Vashabid into small, runnable, Agile-style implementation phases that an AI coding agent can complete one phase at a time. Each phase must leave the application in a deliverable state, with tests and documentation updated before moving on.

Vashabid is a German learning platform for English and Bangla speakers. German is always the target language. English and Bangla are learner support languages from the beginning of the product architecture.

The project currently has:

- Next.js App Router.
- Payload CMS 3.
- PostgreSQL database connection.
- Basic `users` and `media` collections.
- Basic architecture documentation.
- A frontend starter page.

The revised strategy is to build vertical slices, not giant milestones. Every phase should teach one useful engineering lesson while moving the product forward.

## Product Direction

- Target language: German, using `de` and `de-DE` for Standard German where locale specificity matters.
- Learner support languages: English `en` and Bangla `bn`.
- UI locales: `/en` and `/bn` from the first public UI phase.
- Admin route: `/admin`, using Payload's built-in admin UI.
- Public visitors can browse published content without an account.
- Learners can later create accounts, choose support preferences, save progress, and review through FSRS.
- Admins and editors can create German content with English and Bangla learner support fields.
- English learner content is required for publishing.
- Bangla learner content is optional at first, but first-class in the data model and review workflow.
- AI-generated content must always be draft-only until a human reviews it.

## Language and Localization Rules

Vashabid must separate UI language from learning support language.

### UI locale

The UI locale controls navigation, buttons, empty states, labels, and system messages.

Supported values:

- `en`
- `bn`

Routing rules:

- `/` redirects to the preferred locale when known, otherwise `/en`.
- `/en/...` renders English UI.
- `/bn/...` renders Bangla UI.
- Payload admin remains `/admin`.

### Support mode

The support mode controls learner explanations and translations.

Supported values:

- `en`: show English learner explanation.
- `bn`: show Bangla learner explanation when approved, otherwise approved English fallback.
- `both`: show English and approved Bangla side by side.

For anonymous users, store support mode in a cookie or local storage. For logged-in learners, store it on the learner profile.

### Content fallback rules

- German source content must always remain visible.
- English learner content is required before public publishing.
- Bangla learner content can be entered from the first CMS phase.
- Bangla learner content must have an independent review state.
- If support mode is `bn` and Bangla is missing or unapproved, show English fallback.
- If support mode is `both`, show English and Bangla only when Bangla is approved; otherwise show English with a small localized fallback notice.

## Engineering Direction

Use a layered, teachable architecture. The goal is not to overengineer the app, but to make each responsibility easy to understand, test, and replace.

### Recommended layers

- Payload collections: persistence, admin forms, access rules, hooks, and draft/publish behavior.
- Access-policy helpers: reusable role checks and ownership checks.
- Repository classes: database reads and writes through Payload Local API.
- Service classes: business logic, validation orchestration, and workflow decisions.
- DTO/view-model mappers: convert Payload documents into UI-safe data.
- Provider interfaces: translation, AI, search upgrades, media sourcing, and FSRS scheduler boundaries.
- React components: present view models and handle interaction.
- Route handlers/server actions: thin adapters that call services.

### Object-oriented usage

Use classes where they improve clarity:

- `WordRepository`
- `WordService`
- `SearchService`
- `TranslatorService`
- `LearningQueueService`
- `ReviewSchedulerService`
- `AiDraftService`

Use interfaces for external or replaceable behavior:

- `TranslatorProvider`
- `AiContentProvider`
- `SearchProvider`
- `SchedulerProvider`
- `MediaSuggestionProvider`

Do not force OOP where it does not fit. Payload collection configs, React components, Zod schemas, and simple pure functions should remain idiomatic TypeScript.

### Dependency direction

- UI depends on feature services or view models.
- Services depend on repositories and provider interfaces.
- Repositories depend on Payload Local API helpers.
- Payload collections must not import React UI components except approved Payload admin custom components.
- Shared code should move to `src/lib` only when at least two features need it.

### Testing direction

Each phase must keep the app runnable with:

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
```

When a phase adds end-to-end behavior, it should also pass:

```bash
pnpm test:e2e
```

Use:

- Vitest for pure services, access policies, view-model mappers, validation, and provider contracts.
- React Testing Library for reusable components.
- Playwright for browser flows.
- Deterministic seed data for integration and e2e tests.
- Mock providers for AI, translation, media, and scheduler tests.

Public-content tests must verify that drafts and unapproved Bangla content do not leak.

## Definition of Done for Every Phase

Each phase is complete only when:

- The app runs locally.
- Existing functionality still works.
- New functionality has focused tests.
- `pnpm lint`, `pnpm test`, and `pnpm build` pass, unless the phase explicitly documents a temporary blocker.
- Public routes never expose draft content.
- Access rules protect admin-only and learner-owned data.
- Documentation is updated.
- A log exists at `docs/implementation-log/phase-XX.md`.

Each implementation log must include:

- What was achieved.
- How it was implemented.
- Tests added or updated.
- What can be learned from the phase.
- Known follow-ups.

## Revised Timeline

| Phase | Deliverable | Main tests | Learning focus |
|---:|---|---|---|
| 0 | Refresh roadmap and architecture around bilingual-first one-run phases. | `pnpm lint` | Planning, scope control, Agile slicing. |
| 1 | Add test stack, CI scripts, and smoke tests. | Vitest smoke, Playwright smoke, build | Test pyramid and CI readiness. |
| 2 | Add `/en` and `/bn` locale routing with message files and switchers. | Locale routing, `html lang`, switcher e2e | Internationalized routing. |
| 3 | Add shared UI/layout system. | Component tests, responsive e2e | Design systems. |
| 4 | Harden users with roles and access-policy helpers. | Access-policy unit tests | Auth and least privilege. |
| 5 | Add reusable multilingual CMS field patterns and topic tags. | Schema/helper tests, seed tests | CMS modeling. |
| 6 | Add words collection MVP with English required and Bangla optional. | Access and publish validation tests | Domain modeling. |
| 7 | Polish admin word workflow. | Hook and validation tests | Editorial workflows. |
| 8 | Build localized public home page from Payload data. | `/en` and `/bn` e2e, draft leak tests | Public CMS rendering. |
| 9 | Build localized word browse page. | Service/filter tests, e2e browse | Query composition. |
| 10 | Build localized word detail page. | View-model tests, e2e detail | Resilient UI mapping. |
| 11 | Add search v1. | Search service tests, e2e search | Search normalization. |
| 12 | Add grammar topics CMS and pages. | Collection and route tests | Reusable content patterns. |
| 13 | Add scenarios CMS and pages. | Relationship and e2e tests | Relational content. |
| 14 | Add translator shell with dictionary-assisted fallback. | Provider contract, tokenizer, e2e | Interface-driven design. |
| 15 | Add public feedback and admin moderation. | Form, access, e2e tests | User input moderation. |
| 16 | Add learner signup/login/logout and onboarding. | Auth e2e, profile tests | Learner identity. |
| 17 | Add learning queue and save/unsave words. | Queue service, ownership, e2e | Personalized state. |
| 18 | Add sentence mining for logged-in learners. | Sentence service, e2e | User-owned learning artifacts. |
| 19 | Add learner dashboard. | Aggregation tests, e2e | Progress summaries. |
| 20 | Add FSRS data model and scheduler service. | Scheduler unit tests | Algorithm isolation. |
| 21 | Add review UI and review logs. | Review flow e2e, persistence tests | Transactional workflows. |
| 22 | Add multilingual review workflow. | Review-state tests | Content governance. |
| 23 | Add glossary and translation memory basics. | Glossary lookup tests | Terminology consistency. |
| 24 | Add real translation provider integration. | Mock provider, fallback, rate-limit tests | External integration. |
| 25 | Add AI admin copilot. | Mock AI, schema validation, no-auto-publish tests | AI guardrails. |
| 26 | Add text AI tutor for scenarios. | Mock tutor, moderation tests | AI learning practice. |
| 27 | Add discovery feed after review data is stable. | Feed e2e, progress action tests | Personalized discovery. |

## Phase 0: Roadmap and Architecture Refresh

### Goal

Make the plan decision-complete enough that another agent can implement one phase at a time without reinterpreting product direction.

### Implementation direction

- Replace the old large-phase roadmap with this smaller vertical-slice roadmap.
- Update architecture documentation so it no longer says the UI starts English-only.
- Document the `/en` and `/bn` route strategy.
- Document support mode separately from UI locale.
- Document the layered architecture and when to use classes.
- Create the first implementation log.

### Exit criteria

- The roadmap clearly states the phase order.
- The architecture docs match bilingual-first delivery.
- Phase documentation format is established.

### Tests

- Run `pnpm lint`.
- Do not add app behavior in this phase.

### What to learn

- How to turn product ambition into small, safe, deliverable implementation slices.
- How architecture docs prevent future agents from creating conflicting patterns.

## Phase 1: Test Stack and CI Foundation

### Goal

Add the testing foundation before feature work expands.

### Implementation direction

- Install Vitest, React Testing Library, jsdom, Playwright, and related TypeScript types.
- Add scripts:
  - `test`
  - `test:unit`
  - `test:e2e`
  - `test:watch`
  - `ci`
- Add `vitest.config.ts` and `playwright.config.ts`.
- Add `src/test/` helpers for rendering components and creating test fixtures.
- Add one pure unit smoke test.
- Add one Playwright smoke test for the public homepage.
- Add one Playwright smoke test that confirms `/admin` responds.
- Keep tests deterministic and independent from manually entered CMS data.

### Exit criteria

- `pnpm test` works.
- `pnpm test:e2e` works when the dev server is available.
- `pnpm build` still works.
- CI script runs lint, tests, and build.

### Tests

- Unit smoke test.
- Browser smoke test for public route.
- Browser smoke test for admin route reachability.

### What to learn

- Difference between unit, component, integration, and e2e tests.
- Why test infrastructure belongs before feature complexity.

## Phase 2: Bilingual Routing and Locale Foundation

### Goal

Add route-based bilingual UI infrastructure before building public features.

### Implementation direction

- Install and configure `next-intl`.
- Create locale routes under `app/(frontend)/[locale]/`.
- Move the starter frontend page under the locale segment.
- Add middleware that redirects `/` to `/en` by default.
- Add supported locale config in `src/features/i18n/`.
- Add message files:
  - `messages/en.json`
  - `messages/bn.json`
- Add UI strings for navigation, common actions, empty states, errors, and language names.
- Add a language switcher that keeps the current path when switching between `/en` and `/bn`.
- Add support-mode preference infrastructure:
  - `en`
  - `bn`
  - `both`
- For anonymous users, store support mode in a cookie or local storage.
- Keep Payload admin outside locale routing.

### Exit criteria

- `/` redirects to `/en`.
- `/en` renders English UI.
- `/bn` renders Bangla UI.
- The root `<html lang>` matches the route locale.
- A viewer can switch UI language.
- Support mode can be selected and persisted for anonymous users.

### Tests

- Locale redirect test.
- `/en` and `/bn` render tests.
- Language switcher e2e test.
- `html lang` accessibility test.
- Support-mode persistence test.

### What to learn

- Route-based internationalization.
- Difference between UI localization and learner content localization.
- Correct language attributes for accessibility.

## Phase 3: Shared Layout and UI System

### Goal

Create a reusable application shell and design foundation.

### Implementation direction

- Build shared layout components:
  - `Header`
  - `Footer`
  - `AppShell`
  - `PageContainer`
  - `LanguageSwitcher`
  - `SupportModeSwitcher`
- Add reusable UI primitives:
  - `Button`
  - `Input`
  - `Badge`
  - `Card`
  - `Tabs` or segmented control for support mode
  - `Skeleton`
  - `EmptyState`
  - `ErrorState`
- Prefer shadcn/ui patterns if added; otherwise keep small accessible components.
- Use lucide-react icons where icons are needed.
- Use existing Tailwind theme tokens; avoid hardcoded hex colors.
- Keep cards to real repeated items or framed tools.

### Exit criteria

- Public pages share one consistent shell.
- Mobile and desktop layouts are usable.
- All visible text comes from message files where practical.
- Loading, not-found, and error states use shared UI.

### Tests

- Component tests for language and support-mode switchers.
- Component tests for empty and error states.
- Playwright responsive screenshot or viewport checks.

### What to learn

- Building a design system incrementally.
- Keeping UI reusable without creating unnecessary abstraction.

## Phase 4: Users, Roles, and Access Policies

### Goal

Prepare authentication and authorization for admins, editors, and future learners.

### Implementation direction

- Extend `users` collection with:
  - `role`: `admin`, `editor`, `learner`
  - `displayName`
  - `uiLocale`
  - `supportMode`
  - `accountStatus`
- Add reusable access helpers:
  - `isAdmin`
  - `isEditor`
  - `isAdminOrEditor`
  - `isLearner`
  - `isSelf`
  - `publishedOrAuthenticated`
- Keep Payload auth as the only auth system.
- Do not add NextAuth unless a later phase explicitly requires social login.
- Ensure admins can manage all users.
- Ensure editors cannot manage admin users.
- Keep learner-facing auth UI for Phase 16.

### Exit criteria

- User roles are represented in Payload.
- Access helpers are unit-tested.
- Future collections can reuse access helpers.

### Tests

- Role helper tests.
- Access behavior tests for admin, editor, learner, and anonymous contexts.
- Regression test that anonymous users cannot perform protected writes.

### What to learn

- Role-based access control.
- Why reusable access-policy helpers reduce security drift.

## Phase 5: CMS Foundations and Topic Tags

### Goal

Add reusable content modeling patterns and the first non-user content collection.

### Implementation direction

- Add shared field helpers for:
  - slug fields
  - CEFR select fields
  - publish/review metadata
  - English learner fields
  - Bangla learner fields
  - source/license metadata
- Add `TopicTags` collection.
- Add fields:
  - name
  - slug
  - localized description fields
  - parent tag
  - sort order
  - publish status
- Use Payload drafts where useful.
- Add seed strategy with deterministic topic tags.

### Exit criteria

- Admins can manage topic tags.
- Public reads only return published tags.
- Shared field helpers are documented and tested.

### Tests

- Field helper unit tests where practical.
- Access tests for topic tags.
- Seed test for deterministic tag creation.

### What to learn

- Reusable Payload field helpers.
- Hierarchical content modeling.

## Phase 6: Words Collection MVP

### Goal

Create the core German word database with English required and Bangla optional.

### Implementation direction

- Add `Words` collection.
- Add German identity fields:
  - lemma
  - slug
  - word type
  - CEFR level
  - gender for nouns
  - plural form
  - IPA
  - register
  - frequency/usefulness score
  - topic tags
  - active or archived lifecycle status
- Add English learner fields:
  - meanings
  - explanation
  - example sentence explanations
  - common mistakes
- Add Bangla learner fields:
  - meanings
  - explanation
  - pronunciation hints
  - common Bangla-speaker mistakes
  - optional romanized Bangla helper text
- Add review metadata:
  - German reviewed
  - English reviewed
  - Bangla reviewed
  - audio reviewed
  - quiz reviewed
- Add publish validation:
  - German lemma required.
  - Word type required.
  - CEFR required.
  - At least one English meaning required.
  - Bangla missing content must not block MVP publishing.
  - Unapproved Bangla must not be shown publicly.
- Store examples as aligned records with one German sentence, its required
  English explanation, and an optional review-gated Bangla explanation.
- Add 10 seed words with English and some Bangla content.

### Exit criteria

- Admins can create, edit, archive, and publish words.
- Editors can create and edit drafts.
- Public reads only return published words.
- Seed data creates at least 10 test words.

### Tests

- Access tests.
- Publish validation tests.
- Seed tests.
- Draft leak tests for word queries.

### What to learn

- Domain modeling for German vocabulary.
- How to make multilingual content first-class without blocking early publishing.

## Phase 7: Admin Word Workflow Polish

### Goal

Make word editing realistic for admins and editors.

### Implementation direction

- Organize the Words admin form with tabs or groups:
  - German identity
  - English support
  - Bangla support
  - Examples
  - Relationships
  - Review and publishing
- Polish the automatic lemma-to-slug controls established in Phase 6.
- Add duplicate warning for same lemma and word type.
- Add preview links to localized public word pages.
- Polish the Phase 6 archive controls and admin descriptions instead of relying
  on deletion as the normal removal workflow.
- Add admin descriptions for complex fields.
- Add validation messages that explain how to fix publish blockers.

### Exit criteria

- Admin word entry is understandable.
- Duplicate entries are easier to catch.
- Preview links are available for published words.
- Archiving is supported.

### Tests

- Slug generation tests.
- Duplicate-detection tests.
- Publish validation message tests.
- Admin route smoke test.

### What to learn

- Editorial UX inside Payload.
- Hooks, validation, and admin field organization.

## Phase 8: Localized Public Home Page

### Goal

Replace the starter page with a real localized home page backed by Payload content.

### Implementation direction

- Build `/[locale]` home page.
- Show:
  - search entry point
  - word of the day or newest published word
  - beginner A1/A2 words
  - topic tags
  - grammar and scenario placeholders if not built yet
- Use `WordRepository` and `WordService`.
- Use view models so UI does not depend on raw Payload documents.
- Respect UI locale for interface strings.
- Respect support mode for learner content snippets.
- Show English fallback when Bangla is unavailable or unapproved.

### Exit criteria

- `/en` and `/bn` render real published content.
- Empty database states do not crash.
- Draft words never appear.
- Support-mode switching affects snippets.

### Tests

- Home service tests.
- `/en` and `/bn` Playwright tests.
- Empty state tests.
- Draft leak tests.
- Fallback behavior tests.

### What to learn

- Server-side Payload Local API reads.
- Mapping CMS documents to UI-safe view models.

## Phase 9: Word Browse Page

### Goal

Let public users browse published German words.

### Implementation direction

- Build `/[locale]/words`.
- Add filters:
  - CEFR level
  - word type
  - topic tag
  - support mode
- Add pagination.
- Add word cards showing:
  - German lemma
  - article for nouns
  - CEFR level
  - word type
  - English/Bangla/both meaning based on support mode
  - tags
- Implement query logic inside `WordRepository`.
- Implement business rules inside `WordService`.
- Keep route components thin.

### Exit criteria

- Public users can browse words.
- Filters preserve URL state.
- Pagination works.
- Missing optional fields do not break cards.

### Tests

- Repository query tests.
- Filter normalization tests.
- View-model fallback tests.
- Browse page e2e tests.

### What to learn

- Query composition.
- URL-driven UI state.
- Keeping server components thin.

## Phase 10: Word Detail Page MVP

### Goal

Make individual German word pages useful for English and Bangla learners.

### Implementation direction

- Build `/[locale]/words/[slug]`.
- Show:
  - German lemma and article
  - word type
  - CEFR level
  - IPA
  - audio placeholder if no audio exists
  - English meanings and explanation
  - approved Bangla meanings and explanation when selected
  - German example sentences
  - learner-language explanations for examples
  - noun details, verb details, or adjective details when available
  - related words
  - common mistakes
  - mini quiz placeholder when quiz data exists
- Add metadata generation.
- Add localized fallback notice for missing Bangla.

### Exit criteria

- Public users can open word detail pages.
- `/en` and `/bn` detail pages work.
- Support mode `both` shows side-by-side explanations.
- Missing optional fields do not crash.

### Tests

- Detail view-model tests.
- Optional-field tests.
- Metadata tests.
- Word detail e2e tests.

### What to learn

- Rich content page composition.
- Conditional rendering without brittle UI.

## Phase 11: Search MVP

### Goal

Let users find learning content quickly.

### Implementation direction

- Build `/[locale]/search`.
- Add `SearchService`.
- Add query normalization:
  - trim whitespace
  - lowercase where appropriate
  - German article stripping
  - simple umlaut alternatives
- Search:
  - German lemma
  - slug
  - English meanings
  - Bangla meanings
  - CEFR level
  - word type
  - tags
- Show words first.
- Keep grammar and scenario results ready to add when those collections exist.
- Never return drafts.

### Exit criteria

- Search works from home and search page.
- Search supports German, English, and Bangla text.
- Results are localized and support-mode aware.
- Empty states give useful suggestions.

### Tests

- Normalization tests.
- Search service tests.
- Special-character tests.
- Draft leak tests.
- Search e2e tests.

### What to learn

- Search service boundaries.
- Unicode-safe search basics.

## Phase 12: Grammar Topics CMS and Pages

### Goal

Add structured German grammar learning pages.

### Implementation direction

- Add `GrammarTopics` collection.
- Add fields:
  - German topic name
  - slug
  - CEFR level
  - short rule
  - English explanation
  - Bangla explanation
  - examples
  - common mistakes
  - related words
  - topic tags
  - publish/review metadata
- Build `/[locale]/grammar`.
- Build `/[locale]/grammar/[slug]`.
- Reuse localization and fallback helpers from words.

### Exit criteria

- Admins can manage grammar topics.
- Public users can browse and open grammar topics.
- English and Bangla support follows the same rules as words.

### Tests

- Collection validation tests.
- Grammar service tests.
- Route e2e tests.
- Fallback tests.

### What to learn

- Reusing content patterns across domains.
- Modeling grammar as structured content, not loose notes.

## Phase 13: Scenarios CMS and Pages

### Goal

Add real-world German dialogue scenarios.

### Implementation direction

- Add `Scenarios` collection.
- Add fields:
  - title
  - slug
  - CEFR level
  - situation type
  - learner goal
  - dialogue lines
  - English explanation
  - Bangla explanation
  - cultural notes
  - key vocabulary relationships
  - related grammar topics
  - publish/review metadata
- Build `/[locale]/scenarios`.
- Build `/[locale]/scenarios/[slug]`.
- Add "add vocabulary to learning queue" placeholder until learner accounts exist.

### Exit criteria

- Admins can manage scenarios.
- Public users can browse and read scenarios.
- Key vocabulary links to word pages.

### Tests

- Relationship query tests.
- Scenario service tests.
- Scenario route e2e tests.
- Draft leak tests.

### What to learn

- Relationship modeling in Payload.
- Building learning paths from reusable content.

## Phase 14: Translator Shell and Dictionary-Assisted Fallback

### Goal

Add a translator-style learning tool without depending on a real AI provider yet.

### Implementation direction

- Build `/[locale]/translate`.
- Add `TranslatorProvider` interface.
- Add `DictionaryTranslatorProvider` fallback.
- Add `TranslatorService`.
- Support source and target selectors:
  - German to English
  - German to Bangla
  - English to German
  - Bangla to German
  - German to both when support mode is `both`
- Tokenize input.
- Match known German lemmas from the Words collection.
- Show known word chips linked to word pages.
- Label fallback output clearly as dictionary-assisted learning view.
- Add disabled or login-prompt sentence mining action until Phase 18.

### Exit criteria

- Translator page accepts text.
- Known words are detected and linked.
- UI does not claim full machine translation when only fallback exists.
- Provider interface can later accept a real API provider.

### Tests

- Provider contract tests.
- Tokenizer tests.
- Known-word matching tests.
- Translator e2e tests.

### What to learn

- Interface-driven design.
- Graceful degradation when external services are not ready.

## Phase 15: Feedback and Moderation

### Goal

Let users report content problems and give admins a moderation queue.

### Implementation direction

- Add `Feedback` collection.
- Add public feedback form on word, grammar, and scenario pages.
- Feedback fields:
  - related content type
  - related content id
  - feedback type
  - message
  - optional email for anonymous users
  - status
  - admin notes
- Add validation and spam-resistant constraints.
- Admins and editors can update status.
- Public users cannot read the moderation queue.

### Exit criteria

- Public users can submit feedback.
- Admins can review and update feedback status.
- Feedback cannot expose private data.

### Tests

- Form validation tests.
- Access tests.
- Submit feedback e2e test.
- Moderation status tests.

### What to learn

- Handling user-generated input safely.
- Moderation workflows.

## Phase 16: Learner Accounts and Onboarding

### Goal

Add learner-facing authentication and profile setup.

### Implementation direction

- Use Payload auth with the existing `users` collection.
- Build learner signup, login, and logout routes.
- Add onboarding flow for:
  - UI locale
  - primary support language
  - optional secondary support language
  - current German level
  - learning goal
  - preferred practice style
  - daily study target
- Add `LearnerProfiles` collection if profile data should be separated from auth users.
- Store support mode on the learner profile.
- Keep admin/editor users separate by role.

### Exit criteria

- Learners can sign up and log in.
- Learners can complete onboarding.
- Anonymous users can still browse public content.
- Learner preferences affect public content display when logged in.

### Tests

- Signup e2e test.
- Login/logout e2e test.
- Onboarding validation tests.
- Preference persistence tests.

### What to learn

- Auth flows.
- Separating identity from profile preferences.

## Phase 17: Learning Queue

### Goal

Let logged-in learners save words and track basic progress.

### Implementation direction

- Add `LearningItems` collection.
- Fields:
  - user
  - word
  - status: saved, learning, known, ignored
  - created date
  - last reviewed date placeholder
- Add `LearningQueueService`.
- Add save/unsave button on word detail pages.
- Add logged-out prompt for anonymous users.
- Prevent duplicate active queue items for the same user and word.
- Add basic `/[locale]/learn` dashboard list.

### Exit criteria

- Logged-in learners can save and unsave words.
- Saved words appear in a dashboard.
- Users cannot see or modify other learners' saved items.

### Tests

- Queue service tests.
- Duplicate prevention tests.
- Ownership access tests.
- Save/unsave e2e test.

### What to learn

- User-owned data.
- Idempotent save workflows.

## Phase 18: Sentence Mining

### Goal

Let logged-in learners save translated sentences for later study.

### Implementation direction

- Add `SavedSentences` collection.
- Fields:
  - owner user
  - raw sentence
  - source language
  - target language
  - translation output
  - selected German words
  - support languages saved
  - CEFR estimate placeholder
  - created from translator or scenario
- Add `SentenceMiningService`.
- Enable save action on translator page for logged-in learners.
- Keep anonymous users on a login prompt.

### Exit criteria

- Logged-in learners can save translated sentences.
- Saved sentences are user-owned.
- Translator integrates with sentence mining.

### Tests

- Sentence service tests.
- Ownership access tests.
- Translator-to-sentence e2e test.

### What to learn

- Capturing user-created learning artifacts.
- Connecting feature workflows through services.

## Phase 19: Learner Dashboard

### Goal

Give learners a useful progress overview.

### Implementation direction

- Build `/[locale]/learn` dashboard fully.
- Show:
  - saved words count
  - saved sentences count
  - words by CEFR
  - recent saves
  - continue learning section
  - due reviews placeholder until FSRS exists
- Add `LearnerDashboardService`.
- Keep aggregation server-side.

### Exit criteria

- Learners can see their saved progress.
- Dashboard respects locale and support mode.
- Empty states guide new learners.

### Tests

- Dashboard aggregation tests.
- Empty state tests.
- Logged-in dashboard e2e test.

### What to learn

- Aggregating user data.
- Designing dashboards around user intent.

## Phase 20: FSRS Data Model and Scheduler

### Goal

Add the spaced repetition foundation without building the full review UI yet.

### Implementation direction

- Install `ts-fsrs`.
- Extend `LearningItems` with FSRS fields:
  - due date
  - stability
  - difficulty
  - elapsed days
  - scheduled days
  - repetitions
  - lapses
  - state
  - last review
- Add `ReviewLogs` collection.
- Add `ReviewSchedulerService`.
- Keep scheduler logic pure and independently tested.
- Add migration or schema update according to Payload/Postgres project practice.

### Exit criteria

- Saved words can be initialized for FSRS.
- Scheduler can calculate next review state.
- Review logs can be stored.

### Tests

- Pure scheduler tests.
- Learning item schema tests.
- Review log access tests.

### What to learn

- Isolating algorithms from UI and persistence.
- Modeling time-based learning state.

## Phase 21: Review UI and Review Logs

### Goal

Let learners review due words and update FSRS state.

### Implementation direction

- Build `/[locale]/review`.
- Show due word cards.
- Add rating buttons:
  - Again
  - Hard
  - Good
  - Easy
- Update learning item state through `ReviewSchedulerService`.
- Create `ReviewLogs` entries for every review.
- Show review status on word detail pages for logged-in learners.

### Exit criteria

- Learners can review due words.
- Ratings update next due dates.
- Review history is stored.
- Dashboard due review count becomes real.

### Tests

- Review transaction tests.
- Review e2e test.
- Review log persistence tests.
- Dashboard due count tests.

### What to learn

- Transactional workflows.
- Turning algorithm output into user-visible behavior.

## Phase 22: Multilingual Review Workflow

### Goal

Add stronger editorial governance for multilingual content.

### Implementation direction

- Add independent review states for major content sections:
  - German source
  - English support
  - Bangla support
  - audio
  - quiz
- Add review timestamps and reviewer relationships where useful.
- Prevent public Bangla display unless Bangla is approved.
- Add admin filters for content needing Bangla review.
- Add clear publish checklist fields.

### Exit criteria

- Admins can see which language layers are ready.
- Bangla learner content is review-gated.
- Public fallback behavior remains predictable.

### Tests

- Review-state tests.
- Public fallback tests.
- Admin filter tests where feasible.

### What to learn

- Enterprise content governance.
- Independent approval workflows for multilingual content.

## Phase 23: Glossary and Translation Memory Basics

### Goal

Keep recurring grammar and language-learning terms consistent.

### Implementation direction

- Add `GlossaryTerms` collection.
- Fields:
  - German term
  - approved English term
  - approved Bangla term
  - romanized Bangla helper
  - context note
  - locked flag
  - related grammar topics
- Add `GlossaryService`.
- Use glossary lookups in admin guidance and later AI prompts.
- Add starter glossary terms for articles, cases, CEFR labels, and common grammar concepts.

### Exit criteria

- Admins can manage glossary terms.
- Locked terms are identifiable.
- Services can retrieve approved terminology.

### Tests

- Glossary lookup tests.
- Locked-term tests.
- Seed tests.

### What to learn

- Translation memory basics.
- Terminology governance for multilingual products.

## Phase 24: Real Translation Provider Integration

### Goal

Upgrade the translator from dictionary-assisted fallback to real translation while preserving the existing interface.

### Implementation direction

- Add real provider behind `TranslatorProvider`.
- Choose one provider for the first implementation.
- Keep dictionary fallback if provider config is missing or provider fails.
- Add rate limiting and abuse protection.
- Add result caching for repeated translations if practical.
- Return structured output:
  - natural translation
  - literal translation when useful
  - key vocabulary
  - grammar notes
  - CEFR estimate
- Keep provider responses clearly separated from database word matches.

### Exit criteria

- Translator gives real translation output when configured.
- Known database words are still linked.
- Failure falls back gracefully.
- Provider can be mocked in tests.

### Tests

- Mock provider tests.
- Fallback tests.
- Rate-limit tests.
- Structured output tests.

### What to learn

- External API integration.
- Rate limits, caching, and provider abstraction.

## Phase 25: AI Admin Copilot

### Goal

Help admins generate draft content faster while keeping human review mandatory.

### Implementation direction

- Add `AiContentProvider` interface.
- Add `AiDraftService`.
- Add admin-only draft generation route or Payload custom admin component.
- Admin enters German lemma or phrase.
- AI returns structured draft data:
  - word identity
  - IPA
  - CEFR estimate
  - noun/verb/adjective details where relevant
  - English meanings and explanations
  - Bangla meanings and explanations
  - example sentences
  - collocations
  - common mistakes for English speakers
  - common mistakes for Bangla speakers
  - quiz suggestions
- Validate AI output with Zod.
- Save AI content as draft only.
- Add audit fields:
  - provider
  - prompt version
  - generated at
  - reviewed by
  - reviewed at
- Never auto-publish AI content.

### Exit criteria

- Admins can generate draft word content.
- Drafts are editable before publishing.
- Invalid AI output is rejected safely.
- Audit metadata is stored.

### Tests

- Mock AI provider tests.
- Zod schema validation tests.
- No-auto-publish tests.
- Access tests.

### What to learn

- Safe AI workflow design.
- Structured output validation.
- Human-in-the-loop publishing.

## Phase 26: Text AI Tutor and Scenario Roleplay

### Goal

Add text-based AI practice after scenarios, learner accounts, and review systems are stable.

### Implementation direction

- Add `AiTutorProvider` interface.
- Add `AiTutorService`.
- Add text roleplay entry point on scenario detail pages.
- Prompt AI with:
  - scenario context
  - learner CEFR level
  - support mode
  - target vocabulary
  - grammar goals
- Keep conversation primarily in German.
- Use English or Bangla only for hints and corrections based on support mode.
- Add beginner mode and strict mode.
- Add AI disclaimer.
- Add rate limiting and moderation.
- Store conversation history only if privacy policy and settings allow it.

### Exit criteria

- Learners can practice a scenario by text.
- AI respects support language.
- AI uses scenario vocabulary and grammar goals.
- Sensitive topics are handled as language learning, not advice.

### Tests

- Mock tutor provider tests.
- Prompt construction tests.
- Rate-limit tests.
- Scenario roleplay e2e test.

### What to learn

- AI tutoring boundaries.
- Prompt construction from domain data.
- Safety constraints for educational AI.

## Phase 27: Discovery Feed

### Goal

Add a mobile-first discovery feed after content, accounts, and review data are reliable.

### Implementation direction

- Build `/[locale]/feed`.
- Use paginated feed first, not infinite loading.
- Feed cards can include:
  - German word or phrase
  - audio if available
  - CEFR level
  - short German example
  - English/Bangla/both meaning
  - quick quiz
  - save to learning queue
  - mark known
  - review now
  - deep dive link
- Mix:
  - new words matching CEFR level
  - due review words
  - scenario vocabulary
  - high-frequency words
- Add `DiscoveryFeedService`.
- Keep recommendation rules simple and testable.

### Exit criteria

- Mobile feed works.
- Cards use published content only.
- Actions update learner progress correctly.
- Feed does not replace normal browsing.

### Tests

- Feed service tests.
- Published-only tests.
- Save/mark known e2e tests.
- Mobile viewport e2e tests.

### What to learn

- Personalized discovery loops.
- Starting with simple recommendation rules before complex algorithms.

## Suggested Agent Prompt Template

Use this template for each implementation phase:

```md
Implement Phase XX only from `Vashabid_Phase_By_Phase_Implementation_Plan.md`.

Keep the app runnable and deliverable. Do not implement later phases. Follow the architecture in `docs/architecture.md`.

Requirements:
- Implement only the Phase XX deliverable.
- Add or update focused tests.
- Run `pnpm lint`, `pnpm test`, and `pnpm build`.
- Add `docs/implementation-log/phase-XX.md` with what was achieved, how it was done, tests added, what can be learned, and known follow-ups.
- Do not expose draft content publicly.
- Preserve English and Bangla support rules.
```

## First Meaningful Product Milestones

### Public bilingual content MVP

Completed after Phase 11:

- Admins can manage words.
- Viewers can use `/en` and `/bn`.
- Viewers can browse word lists.
- Viewers can open word pages.
- Viewers can search German, English, and Bangla content.
- Bangla support exists with English fallback.

### Structured learning MVP

Completed after Phase 18:

- Public content works.
- Translator shell works.
- Learners can sign up.
- Learners can save words.
- Learners can mine sentences.

### Review-based learning MVP

Completed after Phase 21:

- Learners can save words.
- Learners can review due words.
- FSRS scheduling works.
- Dashboard progress is meaningful.

### AI-assisted MVP

Completed after Phase 26:

- Translator can use a real provider.
- Admins can generate reviewed AI drafts.
- Learners can practice scenarios with a text AI tutor.

## Reference Standards

- CEFR for language level classification.
- WCAG-informed accessibility practices.
- Unicode-safe storage and search for German, English, and Bangla.
- Payload access control for admin/editor/learner/public permissions.
- Human review for all AI-generated learner-facing content.
- Test pyramid with unit tests first, e2e tests for critical workflows.
