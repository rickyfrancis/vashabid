# Phase 0: Project Audit & Architecture Guardrails

## Audit Results

| Concern | Status | Details |
|---|---|---|
| Next.js / Payload structure | Confirmed | `app/(frontend)/` and `app/(payload)/` route groups |
| DB adapter | Confirmed | `@payloadcms/db-postgres`, Docker Postgres 16 |
| Env vars | Confirmed | `DATABASE_URL`, `PAYLOAD_SECRET`, `DATABASE_PUSH` in `.env.local` |
| Payload admin | Confirmed | `/admin` route via `app/(payload)/admin/[[...segments]]/` |
| Payload API | Confirmed | `/api` route via `app/(payload)/api/[...slug]/` |
| `src/` vs root `app/` | Root-level | `app/`, `collections/`, `migrations/` at root |
| Tailwind version | v4 | `@tailwindcss/postgres` plugin, `@theme inline` syntax |
| Theme tokens | Minimal | Only `--background`, `--foreground` + Geist font |
| Error/loading/404 pages | Missing | None exist in `(frontend)` |
| Feature folders | Missing | No `src/features/`, `src/components/`, etc. |
| Payload helpers | Missing | No `src/lib/payload/` or `src/lib/cms/` |
| Architecture docs | Missing | No `docs/` directory |
| Seed strategy | Missing | Not documented or implemented |

## Plan

### 1. Create `src/` directory and update `tsconfig.json` alias

**Why:** The project has no `src/`. The Phase 0 conventions list `src/components/`, `src/features/`, `src/lib/`, `src/styles/`. Creating `src/` separates route files (`app/`) from application code (`src/`).

**What:** Change `tsconfig.json` path alias from `"@/*": ["./*"]` to `"@/*": ["./src/*"]`. No existing code uses `@/*`, so this is a safe change.

### 2. Add theme tokens (`src/styles/theme.css`)

Expand the minimal `globals.css` tokens with a full design token system using Tailwind v4 `@theme`:

- **Brand colors:** Blue 50–950 scale as `--color-brand-*`
- **Accent colors:** Warm amber/gold 50–950 scale as `--color-accent-*` (German-flag inspired)
- **Neutral colors:** Gray 50–950 scale as `--color-neutral-*`
- **Semantic colors:** `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- **CEFR level colors:** `--color-cefr-a1` through `--color-cefr-c2` (green → purple)
- **Typography:** `--font-sans`, `--font-mono` referencing Geist
- **Font size scale:** `--text-xs` through `--text-5xl` with line heights
- **Border radius:** `--radius-sm` through `--radius-full`
- **Shadows:** `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Extended spacing:** `--spacing-18`, `--spacing-88`, `--spacing-128`

Update `globals.css`: remove `@theme inline` block, add `@import "../src/styles/theme.css"`, keep CSS custom properties for `--background`/`--foreground` light/dark mode.

### 3. Create folder structure with `.gitkeep` files

```
src/
├── components/
│   ├── ui/           # shadcn/ui components (future)
│   └── layout/       # Header, Footer, Shell, Nav
├── features/
│   ├── words/        # Word browsing, word detail logic
│   ├── search/       # Search UI, query logic
│   ├── translator/   # Translator UI, service wrapper
│   └── i18n/         # Locale config, message files
├── lib/
│   └── payload/      # Payload Local API helpers
└── styles/
    └── theme.css     # Design tokens
```

### 4. Add Payload data-access helpers

- **`src/lib/payload/getPayload.ts`** — Singleton `getPayloadClient()` that caches the Payload instance
- **`src/lib/payload/collections.ts`** — `findPublished(collection, options?)` filters by `_status: 'published'`, `findBySlug(collection, slug, options?)` single-document lookup
- **`src/lib/payload/index.ts`** — barrel export

### 5. Add error, loading, and not-found pages

- **`app/(frontend)/error.tsx`** — Client component with reset button, themed with brand tokens
- **`app/(frontend)/loading.tsx`** — Centered spinner using `border-t-brand-600`
- **`app/(frontend)/not-found.tsx`** — 404 page with "Go home" link

### 6. Create architecture documentation (`docs/architecture.md`)

Document:
- Project overview, folder conventions, data access pattern
- Feature folder pattern, theme system, auth strategy
- i18n approach, seed strategy, tech decisions log

### 7. Add seed strategy stub (`src/lib/payload/seed/.gitkeep`)

Placeholder directory. Seed approach documented in `docs/architecture.md`.

## Files to create/modify

| File | Action |
|---|---|
| `tsconfig.json` | Modify — `@/*` alias target |
| `app/(frontend)/globals.css` | Modify — theme imports, remove `@theme inline` |
| `src/styles/theme.css` | Create |
| `src/components/ui/.gitkeep` | Create |
| `src/components/layout/.gitkeep` | Create |
| `src/features/words/.gitkeep` | Create |
| `src/features/search/.gitkeep` | Create |
| `src/features/translator/.gitkeep` | Create |
| `src/features/i18n/.gitkeep` | Create |
| `src/lib/payload/getPayload.ts` | Create |
| `src/lib/payload/collections.ts` | Create |
| `src/lib/payload/index.ts` | Create |
| `src/lib/payload/seed/.gitkeep` | Create |
| `app/(frontend)/error.tsx` | Create |
| `app/(frontend)/loading.tsx` | Create |
| `app/(frontend)/not-found.tsx` | Create |
| `docs/architecture.md` | Create |

## Verification checklist

1. `pnpm dev` starts without errors
2. Frontend at `http://localhost:3000` renders the Next.js starter
3. Payload admin at `http://localhost:3000/admin` is reachable
4. `@/` imports resolve correctly
5. Theme CSS custom properties exist in browser inspector
6. `/nonexistent` shows the 404 page
7. Error and loading files exist for framework use
8. `docs/architecture.md` covers all conventions
