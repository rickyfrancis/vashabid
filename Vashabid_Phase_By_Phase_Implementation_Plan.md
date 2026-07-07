# Vashabid Phase by Phase Implementation Plan

## Purpose

This plan is for an AI coding agent that will implement Vashabid in phases. The app is a German learning platform for English and Bangla speakers. The immediate goal is not to build every advanced learning feature. The first goal is to make the app usable: admins can manage content in Payload CMS, users can browse German words, view word pages, search, and use a basic translator experience in English.

The project already has:

- Next.js scaffolded.
- Payload CMS installed.
- Database connected.
- Basic project structure available.

The implementation should avoid early overengineering, but the data model and folder structure should be designed so Bangla support, learner accounts, AI generation, FSRS reviews, and story feed can be added later without rewriting the app.

## Product Direction

- Target language: German.
- First learner support language: English.
- Later learner support languages: Bangla first, then more if needed.
- Initial UI language: English.
- Future UI languages: English, Bangla, German.
- Initial user mode: public browsing without learner login.
- Admin mode: authenticated Payload admin access for content creation, editing, deletion, publishing, and review.
- Later user mode: learner accounts, saved words, learning queue, progress, FSRS reviews.

## Recommended Technical Direction

### Core stack

- Next.js App Router.
- Payload CMS in the same Next.js project.
- Existing connected database.
- TypeScript.
- Tailwind CSS.

### Payload usage

Use Payload as the main content and application backend:

- Payload collections for words, grammar topics, scenarios, tags, media, feedback, and later learner progress.
- Payload built-in auth for admin users.
- Payload access control for admin/editor/learner/public permissions.
- Payload Local API for server-side data reads inside Next.js pages and server components.
- Payload REST API only where client-side access is truly needed.
- Payload localization fields should be planned early, even if only English content is entered at first.

### UI direction

Use default clean Next.js and Tailwind styling for now, but centralize design decisions.

Suggested setup:

- Tailwind CSS with CSS variables for tokens.
- A small `src/styles/theme.css` or equivalent token file for colors, radius, spacing, typography, and shadows.
- shadcn/ui for reusable accessible components.
- lucide-react for icons.
- Avoid hardcoded colors inside feature components. Use tokens and semantic utility classes.

This allows the visual style to be changed later by editing theme files rather than rewriting all components.

### Auth direction

For the first phases:

- Use Payload admin authentication for admins and editors.
- Do not add NextAuth/Auth.js unless social login or a separate frontend auth system becomes necessary.
- Create the user model in a way that can later support learner login.
- Keep admin users and learner users either separated by role or by collection strategy, depending on the current Payload setup.

Recommended simple starting point:

- One `users` collection with `auth: true`.
- Add a `role` field: `admin`, `editor`, `learner`.
- Public users do not need accounts at first.
- Restrict create/update/delete on content collections to admin/editor roles.
- Allow public read only for published content.

### Internationalization direction

Do not translate the whole UI in the first phases. Prepare for it.

- Start with English UI strings in normal components.
- Create a `messages/en.json` style structure or a simple constants layer early, even before installing full i18n.
- Add next-intl later when UI localization becomes a phase.
- Model content fields so German source content is separate from learner support content.
- Use clear language keys: `de`, `en`, `bn`.

### AI direction

Do not build AI features in the first few phases. Instead, create clear service boundaries.

- Add placeholder service files such as `src/features/ai/contentCopilot.ts` and `src/features/translator/translateText.ts`.
- Define TypeScript interfaces for expected AI outputs.
- Store AI generation status fields in content collections if needed: `manual`, `aiDraft`, `needsReview`, `approved`.
- Require admin approval before any AI-generated learning content is published.

## Suggested Packages

Install only when each phase needs them.

### Early UI packages

```bash
pnpm add lucide-react
```

Optional if the project does not already include shadcn/ui:

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea badge tabs dialog dropdown-menu select form table separator sheet skeleton alert
```

### Early form and validation packages

Install if not already present:

```bash
pnpm add zod react-hook-form @hookform/resolvers
```

### Later i18n package

```bash
pnpm add next-intl
```

### Later spaced repetition package

```bash
pnpm add ts-fsrs
```

## Phase 0: Project Audit and Architecture Guardrails

### Goal

Prepare the scaffolded app so future agents can safely work without creating conflicting patterns.

### Work items

- Inspect current Next.js and Payload folder structure.
- Confirm whether the project uses `src/` or root-level `app/`.
- Confirm database adapter and environment variables.
- Confirm Payload admin route and API route.
- Add or update project conventions in `README.md` or `docs/architecture.md`.
- Add a basic app folder convention:
  - `src/components/ui` for reusable UI components.
  - `src/components/layout` for header, footer, shell, nav.
  - `src/features/words` for word browsing and word detail logic.
  - `src/features/search` for search UI and query logic.
  - `src/features/translator` for translator UI and service wrapper.
  - `src/features/i18n` for future language configuration.
  - `src/lib/payload` or `src/lib/cms` for Payload Local API helpers.
  - `src/styles` for theme tokens.
- Add basic error, loading, and not-found pages.
- Add a seed strategy for local development.

### Exit criteria

- The app runs locally.
- Payload admin is reachable.
- There is a documented folder convention.
- Theme tokens exist even if the design is still simple.
- Future phases know where to put code.

## Phase 1: Core Payload Data Model and Admin CRUD

### Goal

Create the content backend so admins can enter and manage German learning content.

### Collections to create

#### Users

Purpose: Admin, editor, and later learner accounts.

Important fields:

- Email and password through Payload auth.
- Role: `admin`, `editor`, `learner`.
- Display name.
- Preferred support language, default `en`.
- Account status.

Access rules:

- Admin can manage all users.
- Editor cannot manage admin users.
- Learner account features can remain inactive until later.

#### Words

Purpose: Main German vocabulary collection.

Important fields:

- German lemma.
- Slug.
- Word type: noun, verb, adjective, adverb, preposition, conjunction, phrase, idiom, other.
- CEFR level: A1, A2, B1, B2, C1, C2.
- German gender for nouns: der, die, das, plural-only, none.
- Plural form.
- IPA.
- Audio references.
- Register: neutral, formal, informal, slang, academic, official, rude, poetic, archaic.
- Frequency or usefulness score.
- Topic tags.
- English meanings and explanations.
- Bangla meanings and explanations, optional at first.
- Example sentences.
- Collocations.
- Related words.
- Grammar notes.
- Common mistakes.
- Quiz items.
- Publish status: draft, review, published, archived.

Implementation notes:

- Keep German source fields separate from support-language explanation fields.
- English fields are required for publish in MVP.
- Bangla fields can be optional until localization phase.
- Use Payload array, group, select, relationship, and upload fields where appropriate.
- Use field-level localization only where it is clearly useful. Do not localize German lemma fields.

#### Topic Tags

Purpose: Organize vocabulary and scenarios.

Fields:

- Name.
- Slug.
- Description.
- Parent tag, optional.
- Sort order.

Examples:

- Daily life.
- Work.
- University.
- Health.
- Immigration.
- Shopping.
- Travel.
- Grammar.

#### Grammar Topics

Purpose: Store German grammar explanations.

Fields:

- Title.
- Slug.
- CEFR level.
- Short summary.
- English explanation.
- Bangla explanation, optional at first.
- German examples.
- Related words.
- Related scenarios.
- Exercises.
- Publish status.

#### Scenarios

Purpose: Real-world dialogue based learning.

Fields:

- Title.
- Slug.
- CEFR level.
- Situation type.
- Dialogue lines.
- English explanation.
- Bangla explanation, optional at first.
- Key vocabulary relationship to words.
- Related grammar topics.
- Publish status.

#### Media

Purpose: Store audio, images, and future clips.

Fields:

- File upload.
- Alt text.
- Caption.
- Language.
- Associated word or scenario.
- Source or license note.

#### Feedback

Purpose: Let users report mistakes or suggest improvements later.

Fields:

- Related word, grammar topic, scenario, or translation.
- Feedback type.
- Message.
- Status: new, reviewed, accepted, rejected.
- Admin notes.

### Admin requirements

- Admin can create, read, update, delete, and publish content.
- Editor can create and edit drafts but publishing can be admin-only if desired.
- Public users can read only published content.
- Draft content must never appear in public pages.

### Exit criteria

- Admin can log in to Payload.
- Admin can create, edit, delete, and publish words.
- Admin can create tags, grammar topics, and scenarios.
- Public API or server-side queries only return published content.
- At least 10 seed words exist for testing.

## Phase 2: Public App Shell and Home Page

### Goal

Make the app visible and browsable for public users.

### Public routes

- `/` for home page.
- `/words` for vocabulary browsing.
- `/words/[slug]` for individual word detail page.
- `/search` for search page.
- `/translate` for translator page.
- `/grammar` for grammar topic listing.
- `/grammar/[slug]` for grammar topic detail.
- `/scenarios` for scenario listing.
- `/scenarios/[slug]` for scenario detail.

### Layout work

- Build a simple responsive layout.
- Add header with logo/name, nav links, and search input or search link.
- Add footer with basic links.
- Add reusable page container component.
- Add basic empty state, loading state, and error state components.

### Home page sections

- Hero area explaining the app.
- Search input.
- Word of the day, using newest or curated word first.
- Beginner words, likely A1.
- Common categories or topic tags.
- Grammar starter section.
- Scenario starter section.

### Exit criteria

- Home page renders real data from Payload.
- Navigation works.
- Empty database states do not crash the UI.
- Design is simple but clean and responsive.

## Phase 3: Word Browse and Word Detail Page MVP

### Goal

Make the core learning experience usable around individual German words.

### Word listing page

Features:

- List published words.
- Filter by CEFR level.
- Filter by word type.
- Filter by topic tag.
- Basic pagination.
- Word cards showing German word, article if noun, English meaning, CEFR level, and tags.

### Word detail page

Sections:

- German lemma and article.
- Word type.
- CEFR level.
- IPA.
- Audio if uploaded.
- English meaning.
- English explanation.
- German example sentences.
- English explanation for examples.
- Noun details, verb details, or adjective details depending on word type.
- Related words.
- Collocations.
- Common mistakes.
- Mini quiz block if quiz data exists.

### Implementation notes

- Build conditional rendering carefully. A noun should show gender and plural. A verb should show conjugation data if available.
- Do not block publishing if all advanced fields are missing. MVP content can be partial.
- Add `generateMetadata` for word pages based on the German word and English meaning.

### Exit criteria

- Public users can browse words.
- Public users can open a per-word page.
- Missing optional fields do not break the page.
- Admin changes are reflected on public pages after rebuild/revalidation strategy is handled.

## Phase 4: Search MVP

### Goal

Let users find words and learning content quickly.

### Search features

- Search by German lemma.
- Search by English meaning.
- Search by slug.
- Search by tags.
- Search by CEFR level.
- Search results should show words first, then grammar topics and scenarios if implemented.

### Implementation levels

Start simple:

- Server-side search using Payload queries and database indexes where possible.
- Normalize the query by trimming whitespace and lowercasing where appropriate.
- Add simple fallback matching for German article searches, such as `der Termin` matching `Termin`.

Later improvement:

- Add fuzzy search.
- Add stemming or inflection support.
- Add external search service only if database search becomes insufficient.

### Search page UX

- Search input with query preserved in URL.
- Filter chips for CEFR, word type, and topic.
- Empty state with suggestions.
- Result cards linked to the correct detail pages.

### Exit criteria

- Search works for seeded words.
- Search works from home page and search page.
- Search results are public-only and do not leak drafts.
- The code has a clear search service function that can be improved later.

## Phase 5: Translator MVP and Sentence Mining Foundation

### Goal

Add a translator-style learning tool without making AI or external translation providers mandatory in the first version.

### MVP translator behavior

Create `/translate` with:

- Text input.
- Source language selector: German, English, Bangla later.
- Target language selector: English first, Bangla later, German.
- Translate button.
- Output area.
- Detected known words from the Payload word database.
- Clickable word chips linking to word pages.
- Save sentence button placeholder or disabled state until learner accounts exist.

### Translation service design

Create a translator service boundary:

- `translateText(input, sourceLanguage, targetLanguage)`.
- First implementation can return a simple dictionary-assisted result if no provider is configured.
- Later implementation can plug in an external translation or AI provider.
- The UI should not care which provider is used.

### Dictionary-assisted fallback

For early MVP:

- Tokenize input.
- Match known German lemmas from the Words collection.
- Show known word meanings.
- Show a clear label: `Dictionary-assisted learning view` if full translation is not yet configured.
- Do not pretend this is a full machine translation if it is only a fallback.

### Sentence mining foundation

Add a future-ready collection or field design for mined sentences:

- Raw sentence.
- Source language.
- Target language.
- Translation output.
- Related words.
- Owner user, optional for later.
- Created from translator or scenario.

### Exit criteria

- `/translate` exists and is usable.
- Known German words in a sentence are recognized and linked.
- Translation logic is behind a service interface.
- The app can later add a real provider without changing the UI structure.

## Phase 6: Admin Workflow Polish and Content Quality Controls

### Goal

Make content entry realistic for admins and editors.

### Work items

- Add useful admin descriptions and labels to Payload fields.
- Organize large word forms using tabs or groups.
- Add validation for required publish fields.
- Add slug generation from German lemma.
- Add duplicate warning for same lemma and word type.
- Add preview links from Payload admin to public word pages.
- Add publish checklist fields if useful.
- Add seed script for starter vocabulary, grammar topics, and scenarios.

### Content quality controls

- A word cannot be published without German lemma, word type, CEFR level, and at least one English meaning.
- Bangla missing content should not block MVP publishing.
- Media should include source or license notes if externally sourced.
- Admins should be able to archive content instead of only deleting it.

### Exit criteria

- Admin forms are manageable.
- Admins can create quality MVP content without touching code.
- Public pages have enough content to feel like a real app.

## Phase 7: Learner Account Preparation and Saved Items MVP

### Goal

Prepare the system for personalized learning without building the full spaced repetition system yet.

### Features

- Enable learner registration or keep learner creation admin-only depending on product decision.
- Add login/logout pages for learners if public account creation is enabled.
- Add learner profile fields:
  - Preferred support language.
  - Target CEFR level.
  - Learning goal.
- Add saved words or learning queue.
- Add `Add to learning queue` button on word detail page.
- Add `/account` or `/learn` dashboard.

### Collections

#### LearnerProfiles

Fields:

- User relationship.
- Preferred support language.
- Current CEFR level.
- Target CEFR level.
- Goal tags.

#### LearningItems

Fields:

- User relationship.
- Word relationship.
- Status: saved, learning, known, ignored.
- Created date.
- Last reviewed date, optional for now.

### Exit criteria

- Logged-in learners can save words.
- Saved words appear in a basic dashboard.
- Anonymous users can still browse public content.
- The data model is ready for FSRS in a later phase.

## Phase 8: UI Localization and Bangla Content Support

### Goal

Add real multilingual support after the English MVP is working.

### UI localization

- Install and configure next-intl or the chosen i18n solution.
- Add locale-aware routing or user-preference based locale handling.
- Start with `en` and `bn` UI message files.
- Add `de` UI only if the product wants German interface mode.
- Add language switcher.
- Store user preference when logged in.
- Store anonymous preference in cookie or local storage.

### Content localization

- Enable or refine Payload localization for explanation fields.
- Add Bangla fields in admin where missing.
- Add fallback behavior:
  - If Bangla exists, show Bangla.
  - If Bangla is missing, show English fallback with a small notice if needed.
- Add Bangla typography checks.
- Add Bangla search support for Bangla meanings.

### Bangla learner support

Add content structures for:

- Bangla explanations.
- Bangla pronunciation hints.
- Bangla-specific common mistakes.
- Optional romanized Bangla helper text.

### Exit criteria

- User can switch UI between English and Bangla.
- Word pages can show English or Bangla explanations.
- Missing Bangla content has a controlled fallback.
- Admin can enter Bangla content cleanly.

## Phase 9: Real Translation Provider and AI-Ready Translator Upgrade

### Goal

Turn the translator MVP into a more useful learning translator.

### Work items

- Choose provider strategy:
  - External translation API.
  - AI provider.
  - Hybrid of translation API plus internal word linking.
- Keep all provider calls behind the existing translator service.
- Add rate limits and abuse protection.
- Add result caching for repeated translations if useful.
- Add structured output:
  - Natural translation.
  - Literal translation.
  - Key vocabulary.
  - Grammar notes.
  - CEFR difficulty estimate.
- Add sentence mining for logged-in users.

### Exit criteria

- Translator gives real translation output.
- Known words are still linked to database word pages.
- Logged-in learners can save mined sentences.
- Translation output clearly separates translation, vocabulary, and grammar notes.

## Phase 10: AI Admin Copilot for Content Drafting

### Goal

Help admins create content faster while keeping human review mandatory.

### Features

- Add `Generate draft` button in admin workflow, likely through a custom admin component or separate internal route.
- Admin inputs German lemma.
- AI returns structured draft data:
  - Word type.
  - CEFR estimate.
  - English meaning.
  - Bangla meaning if enabled.
  - Example sentences.
  - Grammar notes.
  - Common mistakes.
  - Quiz suggestions.
- Save AI output as draft only.
- Add status: `aiDraft`, `needsReview`, `approved`.
- Add audit fields:
  - Generated by provider.
  - Generated at.
  - Reviewed by.
  - Reviewed at.

### Guardrails

- Never auto-publish AI-generated content.
- Require admin review before publish.
- Make the prompt and expected JSON schema versioned.
- Log failures and invalid outputs.

### Exit criteria

- Admin can generate a draft word entry.
- Admin can edit all generated fields before publishing.
- AI output is validated before saving.

## Phase 11: Learning Queue and FSRS Spaced Repetition

### Goal

Add real memory scheduling for saved words.

### Package

Use `ts-fsrs` or another TypeScript FSRS implementation.

### Data model changes

Extend `LearningItems` with FSRS fields:

- Due date.
- Stability.
- Difficulty.
- Elapsed days.
- Scheduled days.
- Repetitions.
- Lapses.
- State.
- Last review.

Add `ReviewLogs` collection:

- User.
- Word or learning item.
- Rating: again, hard, good, easy.
- Review date.
- Previous due date.
- Next due date.
- Time spent, optional.

### UX

- `/review` page.
- Review cards for due words.
- Rating buttons: Again, Hard, Good, Easy.
- Dashboard summary:
  - Due today.
  - Total learning.
  - Known words.
  - Streak placeholder.

### Exit criteria

- Learners can review due words.
- Ratings update next due dates.
- Review history is stored.
- Word detail page shows saved/review status for logged-in users.

## Phase 12: Scenarios and Roleplay Preparation

### Goal

Make scenario content useful before full AI voice roleplay.

### Scenario features

- Scenario list by CEFR and topic.
- Scenario detail page with dialogue lines.
- English and Bangla explanation support.
- Key vocabulary list with links to word pages.
- Add all key vocabulary to learning queue.
- Simple comprehension questions.

### Roleplay preparation

- Add roleplay prompt fields in the Scenario collection.
- Add actor roles, such as learner and receptionist.
- Add expected vocabulary and grammar targets.
- Add difficulty settings.
- Do not build voice AI yet unless the core product is stable.

### Exit criteria

- Users can learn from real-world dialogues.
- Users can add scenario vocabulary to their learning queue.
- Data model can support AI roleplay later.

## Phase 13: AI Tutor and Roleplay

### Goal

Add interactive AI practice after vocabulary, translator, accounts, and reviews are stable.

### Features

- Text-based AI tutor first.
- Voice-based roleplay later.
- AI should adapt explanation language based on user preference.
- AI should respect CEFR level.
- AI should use scenario context where available.
- AI should correct mistakes gently and explain in English or Bangla.

### Safety and quality

- Add prompt templates.
- Add conversation logging only if privacy policy allows it.
- Add rate limiting.
- Add moderation for abusive or irrelevant inputs.
- Add clear disclaimer that AI answers can be wrong.

### Exit criteria

- User can practice a scenario with AI by text.
- AI responses use the selected support language.
- Scenario vocabulary and grammar targets are included in the prompt.

## Phase 14: Discovery Story Interface

### Goal

Add the vertical story or reel-style discovery feed last, after the learning content and personalization systems are stable.

### Feed behavior

- Full-screen mobile-first vertical cards.
- Mix of new words and due review words.
- Respect CEFR level and learner interests.
- Support quick actions:
  - Mark known.
  - Add to learning queue.
  - Review now.
  - Deep dive to word page.

### Card content

- German word.
- Article for nouns.
- CEFR badge.
- Audio if available.
- Short English or Bangla meaning depending on preference.
- Quick quiz interaction.

### Implementation notes

- Do not let story feed replace normal browsing.
- Keep it as an additional discovery mode.
- Avoid infinite loading until analytics and performance are acceptable.
- Start with simple pagination before complex recommendation logic.

### Exit criteria

- Mobile story feed works.
- Cards pull from published words and learner review queue.
- Actions update learner progress correctly.

## Cross-Phase Engineering Notes

### Data access

- Prefer server-side data loading with Payload Local API for public pages.
- Keep all collection query logic in feature-level service files.
- Avoid directly scattering Payload queries across many page components.

### Publishing and drafts

- Always filter public pages by published status.
- Admin previews can show drafts only to authorized users.
- Use archive status instead of destructive deletion where content history matters.

### SEO

- Add metadata to word, grammar, and scenario pages.
- Use readable slugs.
- Avoid indexing draft or private pages.

### Performance

- Start simple.
- Add indexes on frequently searched fields.
- Add caching or revalidation only after the data flow is clear.
- Keep large media out of critical page load paths.

### Testing checklist

Each phase should include at least basic checks for:

- Public pages do not show drafts.
- Admin-only actions are protected.
- Empty states work.
- Word pages handle incomplete optional fields.
- Search does not crash on special characters.
- Translation page does not claim full translation if only fallback mode is active.
- Logged-in and logged-out states behave correctly.

## Suggested First Milestone Definition

The first meaningful milestone should be:

- Payload admin login works.
- Admin can create, edit, delete, and publish German words.
- Home page displays real words from Payload.
- `/words` displays a browsable list.
- `/words/[slug]` displays a usable word detail page.
- `/search` can find words by German or English.
- `/translate` can accept text and identify known German words from the database.
- UI is English-only but code structure is ready for Bangla localization.
- Theme is simple but centralized through Tailwind and token files.

## Suggested Agent Prompt for Phase 0

```md
You are working on an existing Next.js App Router project with Payload CMS already installed and the database already connected. Implement Phase 0 from `Vashabid_Phase_By_Phase_Implementation_Plan.md` only.

Do not implement feature pages yet. Audit the current structure, create or update architecture documentation, add theme token files if missing, add shared layout folders, and prepare clean conventions for Payload data access and feature folders. Keep changes small and explain what you changed.
```

## Suggested Agent Prompt for Phase 1

```md
Implement Phase 1 from `Vashabid_Phase_By_Phase_Implementation_Plan.md` only.

Create the core Payload collections for Users, Words, Topic Tags, Grammar Topics, Scenarios, Media, and Feedback. Use Payload auth for users with role-based access. Public users can read only published content. Admins can create, update, delete, and publish. Editors can create and edit drafts. Add enough fields for German words with English explanations now and optional Bangla fields later. Add seed data for at least 10 German words.

Do not build the public frontend pages yet except whatever is necessary to verify the collections.
```

## Suggested Agent Prompt for Phase 2

```md
Implement Phase 2 from `Vashabid_Phase_By_Phase_Implementation_Plan.md` only.

Build the public app shell and home page using real published content from Payload. Use simple Tailwind styling and centralized theme tokens. Add header, footer, page container, empty states, loading states, and home page sections for search, beginner words, topics, grammar, and scenarios. Do not implement full word detail or search logic beyond links and basic layout.
```

## Reference Notes

These references influenced the implementation direction:

- Payload collections are the primary structure for recurring content and can also support authentication through auth-enabled collections.
- Payload fields define both stored document schema and the generated admin UI.
- Payload access control should be used for admin/editor/public permissions.
- Payload Local API is appropriate for server-side operations in the same Node/Next.js app.
- Payload localization is useful for content translation fields, while application UI i18n is a separate concern.
- Next.js App Router supports modern routing, layouts, server components, and metadata patterns.
- shadcn/ui and Tailwind CSS variables are a good fit for a simple design system that can be changed later.
- lucide-react is a practical icon choice for React.
- next-intl is a practical future option for UI localization in Next.js App Router.
- ts-fsrs is a practical future option for implementing FSRS in TypeScript.
