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

Tailwind CSS v4 with `@theme` tokens defined in `app/(frontend)/globals.css`. All styling must use semantic tokens, never hardcoded hex values.

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
- **Typography:** `font-sans` (Geist), `font-mono` (Geist Mono)

Light/dark mode uses CSS custom properties `--background` and `--foreground` with `prefers-color-scheme`.

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

- **Admins and editors** use Payload's built-in admin auth (`/admin` login).
- **Public users** browse without authentication.
- **Learner accounts** will be added after the public MVP by extending the `users` collection with a `role` field (`admin`, `editor`, `learner`) and building learner-facing login/signup.
- No NextAuth/Auth.js unless social login becomes a requirement.

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

Seed data lives in `src/lib/payload/seed/`. Implementation details for Phase 1:

- **Data files:** `src/lib/payload/seed/data/` — TypeScript arrays of seed documents.
- **Seeders:** One file per collection (`seedWords.ts`, `seedTags.ts`, etc.).
- **Orchestrator:** `src/lib/payload/seed/seed.ts` — Clears collections and re-inserts seed data.
- **Execution:** Run via `tsx src/lib/payload/seed/seed.ts` or a Payload admin hook.
- **Minimum seed:** 10 German A1/A2 words with English meanings, 5 topic tags.

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
