# Architecture

Vashabid is a German learning platform for English and Bangla speakers, built with Next.js App Router and Payload CMS 3 on PostgreSQL.

## Project structure

```
vashabid/
├── app/
│   ├── (frontend)/          # Public site — pages, layouts, loading, error
│   └── (payload)/           # Payload admin route + REST API route
├── collections/             # Payload collection configs
├── messages/                # Type-checked English and Bangla UI catalogs
├── migrations/              # SQL migrations (commit when schema stabilizes)
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (shadcn/ui, custom)
│   │   └── layout/          # Header, footer, shell, nav
│   ├── features/
│   │   ├── words/           # Word browsing, word detail
│   │   ├── search/          # Search UI and query logic
│   │   ├── translator/      # Translator UI and service wrapper
│   │   └── i18n/            # Locale config, navigation, message loading, support preferences
│   ├── lib/
│   │   └── payload/         # Payload Local API helpers
│   └── styles/
│       └── theme.css        # Design tokens reference
├── public/                  # Static assets
├── docs/                    # Architecture, decisions, guides
├── payload.config.ts        # Payload configuration
├── docker-compose.yml       # Local PostgreSQL
└── next.config.ts           # Next.js configuration
```

**Route groups:** `(frontend)` holds the public-facing site. `(payload)` holds the Payload admin (`/admin`) and REST API (`/api`). They share no layout.

**`src/` vs `app/`:** Application code lives in `src/`. Only Next.js route files (pages, layouts, loading, error, not-found) live in `app/`. This keeps file-system routing clean and separates concerns.

**Path alias:** `@/*` maps to `src/*` via `tsconfig.json`. Import as `import { getPayloadClient } from '@/lib/payload'`.

## Data access

All server-side data fetching uses **Payload Local API** through a singleton helper:

```ts
import { getPayloadClient, findPublished, findBySlug } from '@/lib/payload'
```

**Rule:** Do not import `getPayload` or `payload.find()` directly in page components. Use the helpers in `src/lib/payload/`.

### Helpers

- `getPayloadClient()` — Returns a cached Payload instance. Safe to call multiple times per request.
- `findPublished(collection, options?)` — Calls `payload.find()` with `_status: 'published'` pre-filtered. Accepts `depth`, `limit`, `page`, `sort`, `where`.
- `findBySlug(collection, slug, options?)` — Fetches a single published document by slug. Returns the document or `null`.

### Publishing filter

All public pages must filter by `_status: 'published'`. Drafts must never appear to anonymous users. The `findPublished` helper enforces this automatically.

## Theme system

Tailwind CSS v4 with the canonical `@theme` and semantic color variables in
`src/styles/theme.css`, imported once by the public `globals.css`. Component
styles use semantic tokens such as `background`, `surface`, `foreground`,
`muted`, `border`, and `focus`; hardcoded colors belong only in the token file.

### Color tokens

| Token | Purpose |
|---|---|
| `brand-*` | Primary UI color (blue scale) |
| `accent-*` | Secondary UI color (warm gold, inspired by German flag) |
| `neutral-*` | Text, borders, backgrounds |
| `success` / `warning` / `error` / `info` | Semantic feedback colors |
| `cefr-a1` through `cefr-c2` | CEFR level badges (green → purple) |

### Other tokens

- **Border radius:** `radius-sm` through `radius-full`
- **Shadows:** `shadow-sm`, `shadow-md`, `shadow-lg`
- **Spacing:** Extends Tailwind defaults with `spacing-18`, `spacing-88`, `spacing-128`
- **Body typography:** Geist for Latin text and Noto Sans Bengali for Bangla.
- **Display typography:** Newsreader for Latin headings and Noto Serif Bengali
  for Bangla headings.

Light/dark mode uses semantic CSS custom properties with
`prefers-color-scheme`. There is no manual theme setting yet. Both modes must
be verified when adding shared UI.

## Shared public UI

The localized layout renders one `AppShell` around every public page. The shell
owns the skip link, header, main landmark, and footer so route components must
not add another `<main>`. `PageContainer` supplies consistent public gutters
and content widths.

Small accessible primitives live in `src/components/ui`. They use native HTML
semantics first: buttons stay buttons, the language selector stays a select,
and learning-support mode is a native radio group presented as a segmented
control. `lucide-react` is the shared icon source. Do not add shadcn, Radix, or
a second component framework without a feature-specific need.

Layout and presentational components remain server-compatible. Only components
that read browser state or handle interactive preferences use `'use client'`;
server layouts compose those client boundaries rather than becoming client
components themselves.

## Feature folder pattern

Each feature in `src/features/<name>/` follows this convention:

```
src/features/words/
├── page.tsx           # Optional — if feature has its own route
├── word-card.tsx      # Components colocated with feature
├── word-detail.tsx
├── types.ts           # Feature-specific types/interfaces
└── service.ts         # Service logic (queries, transforms)
```

Shared components that multiple features need go in `src/components/`.

## Layered feature architecture

Features should use a small layered structure when behavior grows beyond a simple component:

- **Payload collections** define persistence, admin forms, access rules, hooks, and draft/publish behavior.
- **Access-policy helpers** centralize reusable role and ownership checks.
- **Repository classes** perform Payload Local API reads and writes.
- **Service classes** hold business workflows and call repositories or provider interfaces.
- **DTO/view-model mappers** convert Payload documents into UI-safe data.
- **Provider interfaces** isolate replaceable systems such as translation, AI, search upgrades, media suggestions, and FSRS scheduling.

Use object-oriented classes where they make dependencies and workflows clearer, such as `WordRepository`, `WordService`, `SearchService`, `TranslatorService`, `LearningQueueService`, `ReviewSchedulerService`, and `AiDraftService`. Keep React components, Payload collection configs, Zod schemas, and simple utilities idiomatic TypeScript rather than forcing classes everywhere.

## Auth strategy

Payload CMS handles all authentication via the `users` collection with `auth: true`.

- User roles are `admin`, `editor`, and `learner`. Accounts are either `active`
  or `suspended`; only active accounts pass authenticated access policies.
- The first Payload user is forced to active admin. Later users default to active
  learners, while admins can explicitly assign editorial roles.
- Admins can manage all users. Editors can enter `/admin`, view themselves and
  learners, and update learner profile preferences, but cannot create or delete
  users or change learner credentials, roles, or status. Learners are scoped to
  their own account and cannot enter `/admin`.
- Role, account status, UI locale, and support mode are stored on each user.
  Suspended users receive the same generic error as invalid credentials at login.
- Reusable Payload policies live in `src/lib/payload/access/`. Local API calls
  made on behalf of a user must pass both `user` and `overrideAccess: false`.
- Public visitors browse without authentication. Learner-facing signup, login,
  logout, and onboarding UI remain deferred to Phase 16.
- No NextAuth/Auth.js unless social login becomes a requirement.

The project still uses schema push for disposable local databases, so Phase 4
does not introduce a migration. Before applying these rules to a legacy database,
backfill every pre-Phase-4 user as active admin to preserve their previous
effective access; administrators can demote accounts afterward.

## i18n approach

The public UI is bilingual from the first public UI phase.

- Public routes use locale prefixes: `/en` and `/bn`.
- `/` resolves the `NEXT_LOCALE` cookie first, then a matching English or Bangla
  browser language, and otherwise redirects to `/en`.
- Payload admin remains outside locale routing at `/admin`.
- The root proxy excludes `/admin`, `/api`, framework internals, and static files
  from locale handling.
- `src/features/i18n/` holds locale configuration, navigation wrappers, message
  loading, support-language preferences, and helper types. UI catalogs live in
  `messages/en.json` and `messages/bn.json` and must keep the same key structure.
- Content collections use separate fields for German source content (`de`), English learner explanations (`en`), and Bangla learner explanations (`bn`).
- UI locale is separate from learning support mode:
  - `uiLocale`: `en` or `bn`
  - `supportMode`: `en`, `bn`, or `both`
- German content remains visible as the learning target regardless of UI locale or support mode.
- English learner content is required for publishing.
- Bangla learner content can be entered from the first CMS phase, but public display is gated by Bangla review state.
- If Bangla content is missing or unapproved, public pages show approved English fallback.
- Anonymous support mode is stored in the one-year
  `vashabid_support_mode` cookie. A missing or invalid value defaults to the
  current UI locale; an explicit value remains independent when UI locale
  changes.

## Seed strategy

Seed data lives in `src/lib/payload/seed/`:

- **Data files:** `src/lib/payload/seed/data/` — TypeScript arrays of seed documents.
- **Seeders:** One file per collection (`seedWords.ts`, `seedTags.ts`, etc.).
- **Orchestrator:** `src/lib/payload/seed/seed.ts` — Runs collection seeders through Payload's Local API.
- **Execution:** Run `pnpm seed`; the command loads optional `.env` and `.env.local` files on host development while respecting injected dev-container variables.
- **Safety:** Seeders upsert canonical records by stable keys such as `slug`, compare before writing, preserve unrelated records, and must be safe to rerun.
- **Relationships:** Seed parent records before children and resolve stored relationship IDs from the first pass.
- **Minimum seed:** 10 published German A1/A2 words with English meanings and
  examples, 5 topic tags. Five starter words include Bangla support; four are
  approved and one remains pending to exercise public visibility rules.

Phase 5 supplies the five topic tags. Phase 6 extends the same orchestrator with
the minimum word data rather than resetting existing collections.

## CMS content foundations

Reusable Payload field factories live in `src/lib/payload/fields/`. Content
collections should use these helpers instead of recreating schema conventions:

- Slugs are required, unique, indexed, and generated from an explicit source field.
- CEFR values use the canonical `A1`, `A2`, `B1`, `B2`, `C1`, and `C2` options.
- Learner support is stored in separate `english` and `bangla` groups; it does
  not use Payload localization because support mode is independent from UI locale.
- Review metadata uses configurable `<language>Reviewed` flags. Phase 22 will
  build the richer review workflow on this stable field shape.
- Optional source metadata keeps attribution, source URL, license name and URL,
  and usage notes together.
- Draft-enabled collections reuse the shared content-version configuration and
  Payload's generated `_status` field instead of defining a second status field.

`topic-tags` is the first collection using these conventions. Active editors can
read all tags and save drafts; only active admins can publish, unpublish, restore
published versions, or delete. Learners and anonymous visitors are constrained
to published records. Pending Bangla groups are omitted from their responses,
while editors and admins can inspect them for review. Parent relationships are
limited to one populated level and reject self-references and descendant cycles.

`words` is the core vocabulary collection. It stores indexed German identity
fields, CEFR and usefulness metadata, noun-specific fields, topic relationships,
separate English and Bangla learner groups, and aligned multilingual examples.
English requires at least one meaning for publication; Bangla is optional and
its group and example explanations are omitted from non-editorial reads until
the Bangla review flag is approved. Payload `_status` remains the draft/publish
state, while `lifecycleStatus` independently marks active or archived content.
Public and learner reads require both a published and active word. Editors can
save drafts, while only admins can publish, archive, restore published versions,
or delete. Publication validation is enforced in hooks so REST, Local API, and
version operations follow the same rules as the admin UI.

Phase 6 continues to use schema push for disposable development and CI databases,
matching the Phase 5 convention. Persistent staging and production databases
still require a generated, reviewed migration before deployment.

## Tech decisions

| Decision | Rationale |
|---|---|
| Payload Local API over REST | Avoids HTTP round-trips in server components; faster, typed, same process |
| Tailwind v4 `@theme` over `tailwind.config.ts` | Native CSS-first approach, no config file drift, works with PostCSS plugin |
| No NextAuth/Auth.js yet | Payload handles admin auth; learner auth is planned after the public MVP unless social login becomes necessary |
| Root-level `src/` | Separates route files from app code; standard Next.js convention |
| Feature colocation | Components live with their feature, not in a global `components/` dump |
| Route-based i18n | `/en` and `/bn` improve accessibility, shareability, and future SEO |
| `next-intl` routing and messages | Provides typed locale navigation, request-scoped messages, browser negotiation, and locale cookies while preserving the App Router architecture |
| Zod + react-hook-form (not installed yet) | Add when validation-heavy public or learner forms are introduced |
