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
│   │   ├── grammar/         # Grammar topic browsing and detail
│   │   ├── scenarios/       # Dialogue scenario browsing and detail
│   │   ├── search/          # Search UI and query logic
│   │   ├── translator/      # Translator UI, service, and provider layer
│   │   └── i18n/            # Locale config, navigation, message loading, support preferences
│   ├── lib/
│   │   ├── content/         # Shared text normalization for view-model mappers
│   │   ├── german/          # German-aware input normalization shared by features
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
- `createDocument(collection, data, options?)` — The anonymous write path. Pins
  `overrideAccess: false`, which matters more here than on reads because the Local
  API defaults it to `true`. Accepts `headers` and forwards them as `req.headers`
  so collection hooks can identify the client.
- `createDocumentAs` / `updateDocumentAs` / `findOneAs` — The authenticated
  siblings, for writing and reading on behalf of a signed-in user. Each pins
  `user` **and** `overrideAccess: false`, so the caller's own policies apply.

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
control. `Input`, `Textarea`, and `Select` share one border, focus ring, and
`aria-[invalid=true]` treatment so a form can mix them without visual drift.
`Select` takes a `size` prop rather than accepting a height through `className`,
because `cn` is a plain join with no conflict resolution: two competing height
utilities would resolve by stylesheet order instead of by intent. `lucide-react` is the shared icon source. Do not add shadcn, Radix, or
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
  made on behalf of a user must pass both `user` and `overrideAccess: false`;
  `createDocumentAs`, `updateDocumentAs`, and `findOneAs` pin both.
- No NextAuth/Auth.js unless social login becomes a requirement.

### Signup, login, and logout

Phase 16 opened `create` on `users` to anonymous callers, because signing up
cannot require an account. Payload mounts its REST API and cannot disable it per
collection, so **every signup rule lives in the collection hooks**, exactly as
the feedback rules do — see *Write path*. Three things make that safe:

- `role` and `accountStatus` carry admin-only *field* access. Field access
  deletes a value the caller may not write rather than raising, so an injected
  `role: 'admin'` is gone before any collection hook runs.
- `forceLearnerDefaults` then sets the trusted values, in the collection
  `beforeValidate` that runs after the field pass.
- `enforceSignupSubmission` re-validates with the shared Zod schema. Payload
  enforces **no minimum password length of its own**, so that bound exists only
  here, and it has to be here rather than in the server action to cover REST.

**There is no first-user promotion.** The old `promoteFirstUser` hook made the
first account created on an empty database an admin. That was harmless while
`create` was admin-only and a privilege-escalation hazard the moment signup went
public — on a fresh deploy the first stranger to sign up would have been promoted
by our own hook. Admin accounts are now provisioned by `pnpm seed`; nothing
reachable over HTTP can mint one. A new environment must therefore run the seed.

Sessions are enabled by default on an `auth` collection (`auth.useSessions`
defaults to `true`), so **clearing the cookie is not logging out**: the JWT stays
valid for its full lifetime and its `users_sessions` row stays live. `AuthService.logout`
revokes the session through Payload's `logoutOperation` first, then the cookie is
cleared. Verified against the database: after revocation the captured token
authenticates as nobody.

`payload.login()` returns a token but sets no cookie. `src/features/auth/cookies.server.ts`
builds it with Payload's own `generatePayloadCookie` / `generateExpiredPayloadCookie`
from the `payload/shared` subpath, so the cookie name, `httpOnly`, `sameSite`,
`secure`, and the expiry derived from `tokenExpiration` all follow the config
rather than a hardcoded copy.

Route protection lives in the page and layout server components, not in
`proxy.ts`. The proxy stays locale routing only.

### Learner profiles

`users` is identity. `learner-profiles` is how one learner wants to study —
support languages, German level, goal, practice style, daily target. The split
keeps six learner-only fields off every admin and editor record, and gives that
data its own access surface: a learner owns their profile outright through a
`user`-keyed query scope, while `role` and `accountStatus` next door stay
admin-only. Editors keep the reach they already had over learner preferences.

`uiLocale` and `supportMode` stay on `users`, because every role has them.
Onboarding asks for a primary and an optional secondary support language, and
`deriveSupportMode` translates that pair into the three-valued `supportMode` —
one pure function, so the two representations cannot drift.

Ownership is never something a caller states: `forceProfileOwner` stamps `user`
from the authenticated request, `preventDuplicateProfile` refuses a second
profile, and a unique index backs both.

### Support-mode precedence

`resolveSupportMode` reads account, then cookie, then UI locale. A signed-in
learner's stored preference wins because it follows them between devices; the
cookie only describes one browser. Anonymous behaviour is unchanged. The cookie
is still written when a signed-in learner toggles the switcher, so the choice
survives a sign-out.

Two cache subtleties make this work, and both cost a red test to find:

- `SupportModeProvider` seeds `useState` from `initialMode`, which React ignores
  on re-render, so the root layout keys it on the resolved mode as well as the
  locale. Without that a preference changed on the server never reaches the
  switcher until a full page load.
- `getSession` is wrapped in React `cache()`, so a server action that changes the
  preference and then re-renders in the same request would still see the old
  value. `submitOnboarding` calls `revalidatePath('/', 'layout')` before
  redirecting.

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
the minimum word data rather than resetting existing collections. Phase 12 adds
eight grammar topics, seeded after words because they reference both topic tags
and words by slug. Exactly one grammar topic keeps Bangla unapproved so public
fallback and search gating stay exercised. Phase 13 adds eight scenarios last,
because they reference topic tags, words, and grammar topics by slug; one
scenario likewise keeps Bangla unapproved.

Rich text is stored as `jsonb`, which does not preserve key order. Seed
comparisons must therefore serialize rich-text values with sorted keys;
a plain `JSON.stringify` comparison reports drift on every run and breaks
idempotence.

Phase 16 adds `seedUsers`, which runs **first** because an admin has to exist
before anything else and nothing reachable over HTTP can create one. It matches
by email and, unlike the content seeders, never rewrites an existing account's
password — a rerun restores role and status without undoing a credential
somebody changed. The admin's email and password come from `SEED_ADMIN_EMAIL`
and `SEED_ADMIN_PASSWORD`; the development defaults are published in this
repository, so the seeder **refuses to create an admin with one when
`NODE_ENV=production`** rather than quietly planting an account anybody could
sign into. The learner fixture, which exists so the browser suite has real
credentials, is skipped in production entirely.

`seedUsers` is the one place `overrideAccess: true` is correct, and it also
passes `context: { vashabidSeed: true }`. `forceLearnerDefaults` reads that flag
and steps aside — otherwise the hook would demote the very admin the seeder
exists to create. The flag cannot be forged, because `createPayloadRequest`
hardcodes `context: {}` for every REST request.

## CMS content foundations

Reusable Payload field factories live in `src/lib/payload/fields/`. Content
collections should use these helpers instead of recreating schema conventions:

- Slugs are required, unique, indexed, and generated from an explicit source field.
- CEFR values use the canonical `A1`, `A2`, `B1`, `B2`, `C1`, and `C2` options.
- Learner support is stored in separate `english` and `bangla` groups; it does
  not use Payload localization because support mode is independent from UI locale.
- Review metadata uses configurable `<language>Reviewed` flags. Phase 22 will
  build the richer review workflow on this stable field shape.
- Learner rich text uses `createLearnerRichTextEditor()` from
  `src/lib/payload/fields/rich-text.ts`. The feature set is deliberately narrow
  (headings, lists, bold, italic, inline code, links) so the public render
  surface stays small and predictable. `richTextParagraphs()` builds
  deterministic values for seeds and tests, and `richTextToPlainText()` flattens
  stored values for search and metadata.
- Publish gating is built from `createPublicationIntentHook()` and
  `createPublicationValidationHook()` in `collections/hooks/content.ts`. Because
  `versions.drafts.validate` is `false`, drafts may be incomplete; the
  `beforeOperation` hook records publish intent on `req.context` and the matching
  `beforeValidate` hook enforces the collection's publish rules.
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

The Phase 7 Words admin workflow keeps those stored paths intact while arranging
them into identity, English, Bangla, examples, relationships, and publishing
sections. A debounced UI-only duplicate check queries the authenticated Words API
for the same normalized lemma and word type; it is advisory and never replaces
the unique slug constraint. Active published words expose saved English and
Bangla preview links. The initial localized preview route deliberately maps only
German identity fields and applies explicit published-and-active filters; Phase
10 will replace that narrow preview model with the complete learner-facing word
detail experience.

The Phase 8 homepage is the first complete public CMS rendering slice. Public
Local API helpers enforce anonymous collection and field access in addition to
explicit published filters. `WordRepository` and `TopicTagRepository` own the
homepage queries, while `WordService` and `HomeService` map raw documents into
narrow view models. Only approved Bangla values enter client props; the small
client-side support snippet boundary can therefore switch between English,
Bangla, and both immediately without exposing editorial metadata or pending
translations. The localized route component remains a thin server adapter.

The Phase 9 word catalogue extends the same boundary at `/[locale]/words`.
`WordRepository` owns the published-active Payload query and combines optional
CEFR, word-type, and published topic constraints with a stable six-word page.
`WordService` treats search parameters as untrusted input, resolves topic slugs
through the published topic repository, produces narrow card and pagination view
models, and requests canonical redirects for invalid or out-of-range URLs. The
public contract uses one optional value each for `level`, `type`, and `topic`,
plus `page` when greater than one. The global cookie-backed support mode remains
outside this query contract and updates safe card snippets client-side. Topic IDs,
review metadata, sources, and unapproved Bangla never enter client props.

The Phase 12 grammar workbook reuses that boundary at `/[locale]/grammar` and
`/[locale]/grammar/[slug]`. `GrammarRepository` owns the published queries,
including the reverse lookup that finds the topics referencing a given word.
`GrammarService` normalizes `level`, `topic`, and `page` exactly as the word
catalogue does, redirecting to a canonical URL before querying. English
explanations are required to publish; Bangla explanations, Bangla mistakes, and
each example's Bangla line are withheld until `review.banglaReviewed` is set, so
pending translations never reach client props or search.

The Phase 13 scenario workbook applies the same boundary at `/[locale]/scenarios`
and `/[locale]/scenarios/[slug]`, with a third filter (`situation`) alongside
`level` and `topic`. `ScenarioRepository` owns the published queries, including
two reverse lookups: the scenarios that teach a given word, and the scenarios
that practise a given grammar topic. Bangla explanations, Bangla cultural notes,
and each dialogue line's Bangla explanation are withheld until
`review.banglaReviewed` is set.

`feedback` is the first collection that is not editorial content, and it breaks two
conventions on purpose. It has **no drafts or versions**, because a submission
records what someone said rather than content moving toward publication, so there
is no `_status` and the publish-gate hooks do not apply. And its `create` access is
open to anonymous visitors, because reporting a problem must not require an
account — which is why every submission rule lives in its hooks. See **Write path**
below. Reads, updates, and deletes stay editorial: admins and editors triage,
only admins delete, and the public cannot read the queue at all. The optional
reply email is personal data and is readable by admins only, not editors.
A report stores both a polymorphic relationship, for one-click navigation from the
queue, and a `relatedSlug` snapshot, so a renamed or deleted target still leaves a
readable row. Project convention is that every collection gets a seeder;
`feedback` deliberately has none, because seeding user submissions would plant
fake moderation work in every environment.

**Import direction between linked features:** features that link to each other
must depend on the other's *repository*, never its service. Concretely:

- `WordService` imports `GrammarRepository` and `ScenarioRepository`.
- `GrammarService` imports `WordRepository`, `WordService`, and `ScenarioRepository`.
- `ScenarioService` imports `WordRepository`, `WordService`, `GrammarRepository`,
  and `GrammarService`.

Because repositories never import services, the graph stays acyclic even though
all three features cross-link. A new feature that links back into an existing one
adopts the same rule rather than reaching for the sibling service.

Search treats words as the paginated primary list. Grammar and scenario results
are capped secondary sections rendered only alongside the first page, which keeps
the existing pagination contract unchanged.

Helpers needed by two or more feature services move to `src/lib`. `cleanText`,
`cleanRows`, and `firstRow` live in `src/lib/content/text.ts` now that the word,
grammar, and scenario mappers all normalize stored strings the same way.
`cleanUserText` and `generateGermanAlternatives` live in `src/lib/german/text.ts`
for the same reason: search and the translator both normalize learner input and
both need the umlaut and sharp-s spellings a learner might type. The same rule
applies to components: `WordSummaryCard` and `SupportSnippet` are shared once a
third surface renders them.

## Write path

Phase 15 introduced the first mutation in the project. Everything before it was a
GET form carrying URL state, so this section is the pattern later user-input
phases should follow.

**The public form POSTs to a server action.** `src/features/feedback/actions.ts`
is the first `'use server'` module. It stays a thin adapter: it reads `FormData`,
checks the honeypot, and hands everything else to a service that owns validation,
target resolution, and the result union. There is no `revalidatePath`, because no
public page renders submitted data.

The form is written for progressive enhancement — uncontrolled fields, a native
`<details>` disclosure, and `useActionState`, which React marks up with the hidden
`$ACTION_*` fields a scripting-free submit needs. A POST made with no JavaScript
does reach the action and store the report. **But no public route currently renders
without JavaScript**: every page pairs streaming with a `loading.tsx` fallback, so
an unscripted browser is left looking at the skeleton and never reaches any content.
That is app-wide and predates this phase — verified in both `pnpm dev` and
`pnpm start` on `/en`, `/en/words`, `/en/search`, and `/en/translate`. Treat
no-JavaScript support as unfinished at the routing layer, not at the form.

**Rules live in collection hooks, not in the action.** Payload mounts its REST API
at `app/(payload)/api/[...slug]/route.ts` and offers no way to disable it for a
single collection, so any collection that accepts anonymous `create` is publicly
writable over HTTP whether or not the app has a form. Putting validation, spam
constraints, and forced defaults in `beforeOperation`/`beforeValidate` is what
makes `POST /api/feedback` and the form obey one rule set. The alternative —
closing `create` and writing with `overrideAccess: true` from trusted code — would
have created a privileged path on which field-level access no longer applies.

Two behaviours of Payload make this safe, and both are worth knowing before
relying on them:

- `createPayloadRequest` hardcodes `context: {}`, so a REST client cannot inject
  `req.context` to influence a hook.
- `createLocalReq` only substitutes an empty `Headers` when none was supplied, so
  passing `req: { headers }` through `createDocument` gives hooks the real client
  headers on the Local API path too.

**Hook order matters.** `create` runs collection `beforeOperation` → *field*
`beforeValidate` → collection `beforeValidate` → collection `beforeChange` → field
`beforeChange`. Field access runs in the field pass and **deletes** a field the
caller may not write rather than raising, so:

- Rate limiting belongs in `beforeOperation`, where it refuses an abusive request
  before any field work happens.
- Forcing trusted defaults belongs in the collection `beforeValidate`, which runs
  *after* an injected value has already been stripped. The hook is therefore
  setting the trusted value, not racing the caller's.

**Untrusted input is parsed once, by a shared schema.** `feedbackSubmissionSchema`
is used by the action, the hook, and the tests. It returns message *keys* rather
than English prose, so a bilingual form chooses the wording with next-intl instead
of being locked to whatever the server wrote. Unknown keys are dropped, so an
injected `status` cannot ride along even before access control sees it.

**Writing on behalf of a signed-in user.** `createDocument` is the anonymous
write path. `createDocumentAs`, `updateDocumentAs`, and `findOneAs` are its
authenticated siblings: they pass `user` *and* `overrideAccess: false`, so a
learner editing their own profile passes exactly the access policies a REST
request from that learner would. There is still no privileged path.

**The public submits slugs, never database ids.** `FeedbackService` resolves a
`contentType` plus slug to a published document through the word, grammar, and
scenario *repositories* — never their services, per the import-direction rule.
That keeps raw identifiers out of client props and means a report can only ever
attach to content that is actually published.

### Rate limiting

`src/lib/rate-limit/` holds a `SlidingWindowRateLimiter` with an injected clock and
store, so it is testable without timers, and `resolveClientKey`, which hashes a
client address into a bucket key. Three limitations are deliberate and documented
rather than hidden:

- `x-forwarded-for` is a list each proxy appends to, so the **last** hop is read
  rather than the trivially spoofable first one. With no proxy the header is absent
  and everything shares one `unknown` bucket. `RATE_LIMIT_FORWARDED_HEADER`
  overrides the header name for a deployment whose proxy sets a different one.
- The window lives in one Node process, so it resets on deploy and is not shared
  between instances. Phase 24 introduces real rate limiting for the translation
  provider and should absorb this.
- Addresses are hashed immediately and **never persisted**. No network identifier
  reaches the database.

`FEEDBACK_RATE_LIMIT` and `FEEDBACK_RATE_LIMIT_WINDOW_MS` override the defaults.
The Playwright config raises the limit for the browser suite, because on localhost
every request shares the `unknown` bucket and the suite would otherwise exhaust
the window part-way through; the limit itself is covered by hook unit tests driving
an injected clock.

## Provider interfaces

`TranslatorProvider` (`src/features/translator/provider.ts`) is the first
provider boundary in the project and sets the pattern for the AI, media, and
scheduler providers still to come.

- A provider is injected as a constructor default, like every repository and
  service collaborator. There is no registry and no container.
- The result type carries its own provenance. `TranslationOutcome.kind` is
  `dictionary` or `machine`, and `translation` is `null` for dictionary output.
  The UI reads that flag to label the result, so no code path can present a
  word-by-word lookup as a finished translation.
- Providers return slugs, not documents. Hydration back into view models is the
  service's job, which keeps editorial metadata and unapproved Bangla out of
  provider results by construction.
- `describeTranslatorProviderContract()` is a shared Vitest suite that every
  provider must pass. It fixes the guarantees the service depends on — ordered,
  non-overlapping match spans that index the request text, a stable id, and no
  database identifiers — so Phase 24's real API provider can be swapped in
  without retesting the UI.

The Phase 14 translator at `/[locale]/translate` is the first learner tool
rather than a content surface, but it reuses the same spine: a GET form carries
`text`, `from`, and `to`; `TranslatorService` normalizes those untrusted params
and redirects to a canonical URL before doing any work; `DictionaryTranslatorProvider`
builds an in-memory lemma index from `WordRepository.findAllPublishedActive()`;
and matches are hydrated through `WordService.toRelatedWord` so the chips are the
same UI-safe view model the rest of the app renders. Support mode stays
cookie-backed and outside the URL contract. German matching folds articles,
umlaut spellings, and a small conservative inflection table, but a folded form is
only accepted when it lands on a known lemma, so folding can never invent a word.
Bangla meanings and the romanized helper are indexed only once
`review.banglaReviewed` is set, so the reverse Bangla direction cannot surface a
pending translation.

Phase 6 continues to use schema push for disposable development and CI databases,
matching the Phase 5 convention. Persistent staging and production databases
still require a generated, reviewed migration before deployment. A new
collection generates a migration whose `down` statements drop tables with
`CASCADE`; the follow-up constraint and index drops must use `IF EXISTS` so the
migration reverses cleanly.

## Tech decisions

| Decision | Rationale |
|---|---|
| Payload Local API over REST | Avoids HTTP round-trips in server components; faster, typed, same process |
| Tailwind v4 `@theme` over `tailwind.config.ts` | Native CSS-first approach, no config file drift, works with PostCSS plugin |
| No NextAuth/Auth.js | Payload handles both admin and learner auth. Revisit only if social login becomes a requirement |
| Public `create` on `users`, rules in hooks | Signup cannot require an account, and Payload's REST endpoint cannot be closed per collection. Putting the rules in hooks is what makes `POST /api/users` and the form obey one rule set. Field-level access on `role` and `accountStatus` is what makes that safe |
| Seeded admin over first-user promotion | Automatic promotion of the first account became a privilege-escalation hazard the moment signup went public. Provisioning admins from a shell is the trade for a fresh deploy having to run `pnpm seed` |
| Server-side session revocation on logout | Sessions are on by default, so dropping the cookie would leave a valid token and a live session row |
| Root-level `src/` | Separates route files from app code; standard Next.js convention |
| Feature colocation | Components live with their feature, not in a global `components/` dump |
| Route-based i18n | `/en` and `/bn` improve accessibility, shareability, and future SEO |
| `next-intl` routing and messages | Provides typed locale navigation, request-scoped messages, browser negotiation, and locale cookies while preserving the App Router architecture |
| Zod (added in Phase 15) | The public feedback form was the trigger. One schema is shared by the server action, the collection hook, and the tests, so a rule cannot apply to one write path and not the other |
| Still no react-hook-form | A `useActionState` server action keeps the form working without JavaScript, matching every other form in the project. Revisit only if a form needs live client-side validation |
