# Phase 15 Implementation Log

## What was achieved

- Added `/feedback`: a public report form on every word, grammar, and scenario
  detail page, and a moderation queue for admins and editors in Payload.
- Added the project's first **write path**. Every surface before this phase was a
  GET form carrying URL state, so this phase had to establish the mutation spine —
  a server action, a `createDocument` helper, and a rule about where validation
  lives — that Phases 16 to 18 will reuse.
- Made the public REST endpoint and the form obey one rule set. Payload cannot
  disable REST per collection, so `POST /api/feedback` is public the moment
  anonymous `create` is allowed; putting every rule in collection hooks is what
  keeps the two paths equivalent instead of leaving REST as the softer door.
- Kept the moderation queue and the optional reply email out of public reach:
  the collection is unreadable to anyone but admins and editors, and the email is
  readable by admins only, not editors.
- Built the form for progressive enhancement — native `<details>`, uncontrolled
  fields, and a real form POST — and confirmed a scripting-free POST does reach the
  action and store a report. It then turned out that **no** public route in the app
  renders without JavaScript, so the enhancement is real but not yet reachable. See
  *What can be learned* and the follow-ups.
- Added `zod`, which `docs/architecture.md` had pre-authorized for exactly this
  trigger, and used one schema for the action, the hook, and the tests.
- Added a `Select` primitive and removed the four inline copies of the same class
  string that had accumulated in the translator, the language switcher, and the
  three browse pages.
- Promoted the field-level role checks. `isAdminField` and `isAdminOrEditorField`
  now sit beside the other access policies, and `canManageWordLifecycle` delegates
  to the shared helper instead of repeating the role test.

## How it was implemented

- **Chose public `create` access over a privileged server action.** The
  alternative was closing `create` and writing with `overrideAccess: true` from
  trusted code. That would have been a smaller public surface but a worse design:
  it contradicts the project's `overrideAccess: false` rule, and field-level access
  would no longer apply on the one path that actually matters. With the rules in
  hooks there is no privileged path at all, and a future developer who adds a field
  cannot accidentally create a bypass.
- **Verified the two Payload behaviours the design leans on rather than assuming
  them.** `createPayloadRequest` hardcodes `context: {}`, so a REST client cannot
  inject `req.context` to fool a hook; and `createLocalReq` only substitutes an
  empty `Headers` when none was supplied, so forwarding `req: { headers }` through
  `createDocument` gives the rate-limit hook the real client on the Local API path
  too. Both are load-bearing, so both are written down in `docs/architecture.md`.
- **Placed each hook by reading the operation order.** `create` runs collection
  `beforeOperation` → field `beforeValidate` → collection `beforeValidate` →
  collection `beforeChange`. Field access runs in the field pass and *deletes* a
  field the caller may not write rather than raising. So rate limiting sits in
  `beforeOperation`, where it refuses before any field work; and
  `forceNewFeedbackStatus` sits in the collection `beforeValidate`, which runs after
  an injected `status` has already been stripped — it sets the trusted value rather
  than racing the attacker's.
- **Returned message keys, not prose, from validation.** An error phrased on the
  server could only ever be in one language. `toFieldErrors` yields keys like
  `errorMessageTooShort`, and the form resolves them through next-intl, so a Bangla
  reader gets a Bangla error. The key set is a TypeScript union rather than
  `string`, which both lets the form pass one straight to `t()` and makes an error
  without a catalogue entry fail to compile.
- **Typed the omission of the moderation fields.** `FeedbackSubmissionData` is
  `Omit<…, 'status' | 'adminNotes' | 'handledBy' | 'handledAt'>`, so the compiler
  rejects any attempt to send them from the public path. Runtime enforcement still
  exists for untyped callers; the type makes the intent unmissable in review.
- **Resolved slugs to ids server-side.** The form submits `contentType` plus a
  slug, and `FeedbackService` looks the document up through the word, grammar, and
  scenario *repositories* — never their services, per the import-direction rule.
  Raw identifiers therefore never travel through client props, and a report can
  only attach to content that is actually published.
- **Kept the honeypot out of the schema.** It describes the form, not a
  submission, so it lives in the action, which reports success and silently drops
  the write. A bot learns nothing from the response.
- **Gave `Select` a `size` prop instead of a `className` height.** `cn` is a plain
  join with no conflict resolution, so `h-11` and `h-12` on one element would
  resolve by stylesheet order rather than by intent. The prop preserved both
  existing heights exactly while removing the duplication.
- **Skipped a seeder deliberately.** Every other collection has one; seeding user
  submissions would plant fake moderation work in every developer's queue.

## Tests added or updated

- Covered the rate limiter as a pure unit with an injected clock: the boundary at
  the limit, a partially aged window that frees exactly one slot, per-key
  isolation, cold-key pruning, and that a blocked client does not grow the store.
- Covered `resolveClientKey` on the property that matters — that prepending
  addresses to `x-forwarded-for` cannot move a client to a fresh bucket — plus the
  `x-real-ip` fallback, the shared `unknown` bucket, and that the output is a hash
  and never the raw address.
- Covered the schema: trimming before measuring, the exact min/max boundaries,
  distinct keys for too-short and too-long, the whitespace-only email counting as
  blank, every enum, and that unknown keys including `status` are stripped.
- Covered the collection config: the full access matrix, field-level access on
  `status`, `adminNotes` and `email`, the absence of versions, and a fail-closed
  `test.each` over malformed identities per the existing access-test convention.
- Covered the hooks directly: the 429 past the limit, editorial exemption, that a
  suspended admin is *not* exempt, REST-shaped payloads being re-validated with
  stored field paths, an injected status being overridden, the relationship/content
  type mismatch, and the moderation stamp firing only on a real status change.
- Covered the service: each content type resolving through its own repository and
  no other, unknown targets refusing to store, header forwarding, error mapping by
  HTTP status, and that moderation fields never reach the repository.
- Covered the form component in both locales: field errors wired through
  `aria-invalid` and `aria-describedby`, retained input after a rejection, the
  honeypot being absent from the accessibility tree and the tab order, and the
  Bangla validation message rendering in Bangla.
- Added `tests/e2e/feedback.spec.ts`: submitting from all three content types,
  server-side rejection surfacing inline, the Bangla round trip, the anonymous
  `GET /api/feedback` 403, and three direct REST posts proving the endpoint obeys
  the same rules — a short message refused, an injected `status: 'resolved'` stored
  as `new`, and a contradicted content type refused.
- Extended `migrations.test.ts` with a Phase 15 block, and `ui.test.tsx` with the
  `Select` primitive including that its two size classes never co-occur.

The suite is 833 passing unit tests (up from 617) and 101 passing Playwright tests
(up from 89).

## Verification

- `pnpm lint`
- `pnpm test` — 833 passed
- `pnpm build`
- `pnpm generate:types` — `payload-types.ts` committed, no further diff
- `pnpm migrate:create` — reviewed, then patched so the `down` constraint and index
  drops use `IF EXISTS`, matching the Phase 12 and 13 migrations
- `pnpm seed` — reported all existing content unchanged (5 tags, 10 words, 8
  grammar topics, 8 scenarios)
- `pnpm test:e2e --workers=1` as CI runs it — 101 passed in 1.7 minutes
- `pnpm exec tsc --noEmit` — 17 errors, identical to a stashed clean checkout, so
  this phase adds none
- Manual checks against the running app: anonymous `GET /api/feedback` returns 403;
  a REST post carrying `status: 'resolved'` and `adminNotes` was stored with
  `status = new` and `admin_notes = NULL`, confirmed by querying Postgres directly
  rather than trusting the API response, which field access had already filtered
- The moderation half checked against a real Payload instance with a throwaway
  script, since no test in this project touches a live database: an anonymous
  submission arrives as `new`; anonymous and learner reads are `Forbidden`; an
  editor reads the queue and the status but gets `undefined` for the reporter email
  while an admin sees it; an editor can set the status and notes and is stamped into
  `handledBy`/`handledAt` automatically; and an editor cannot delete a report. The
  dev database was restored to its previous state (no users, no reports) afterwards
- Progressive enhancement checked at the HTTP level: the `$ACTION_*` hidden fields
  were read out of the server-rendered HTML and posted back as `multipart/form-data`
  with no browser and no scripting, which returned 200 and created the row
- No-JavaScript rendering checked with `javaScriptEnabled: false` on `/en`,
  `/en/words`, `/en/search`, `/en/translate`, `/en/grammar/[slug]` and
  `/en/words/[slug]`, in both `pnpm dev` and `pnpm start`: every route lays out only
  its loading skeleton, so this is app-wide and predates the phase

## What can be learned

- **Ask what else can reach the door before deciding where to put the lock.** The
  instinct was to validate in the server action, because that is where the form
  posts. But Payload's REST API is mounted publicly and cannot be disabled per
  collection, so action-level validation would have guarded the polite path and
  left the other one open. Where a rule lives matters more than whether it exists.
- **Read the framework's execution order before relying on a guard.** "Field access
  strips an injected value" and "my hook overwrites it" are different claims with
  different failure modes. Confirming that field access runs *before* the collection
  `beforeValidate`, and that it deletes rather than raises, turned a hopeful
  ordering into a known one — and it is what makes `forceNewFeedbackStatus` a
  belt rather than a race.
- **Verify a security property against storage, not against the response.** The
  REST reply showed no `adminNotes`, but field-level *read* access would hide that
  field whether or not it had been written. Only the `psql` query proved the column
  was actually NULL. A filtered response is not evidence of a rejected write.
- **A test that fights the platform is testing the wrong thing.** The malformed
  email spec mutated the input's `type` to dodge browser validation; React
  re-rendered and restored it, so the submit never left the page. The better test
  was already available: `learner@localhost` passes Chrome's own check and fails
  the schema, which demonstrates the real point — that the server is the authority —
  without any DOM surgery.
- **Design the limiter around the test environment before it bites.** A
  process-wide limit keyed on the client address collapses to a single bucket on
  localhost, so a browser suite silently competes with itself for the quota. This
  was predicted while planning and still nearly caused a cascade; raising the limit
  through `playwright.config.ts` and keeping the 429 assertion in a unit test with
  an injected clock is what makes the browser suite independent of it.
- **A type can forbid what a filter merely removes.** Writing the create payload as
  `Omit<…, 'status' | …>` means the compiler refuses a moderation field, rather than
  the code stripping one that should never have been offered.
- **Test the claim you are about to write down.** "The form works without
  JavaScript" was going into the docs on the strength of having used the right
  pattern. Writing a `javaScriptEnabled: false` spec to prove it produced two red
  tests instead — and chasing them turned up something more useful than the original
  claim: the action *is* progressively enhanced (a hand-built `multipart` POST with
  no browser stored a report), but every route in the app, including four that
  predate this phase, renders only its loading skeleton without scripting. Half the
  claim was right, the other half was about a layer nobody had checked.
- **`boundingBox() === null` is the question, not the answer.** Playwright reported
  the disclosure as "not visible, then detached", which reads like a bug in the new
  component. Checking `article` and `h1` on the same page — both also unlaid-out —
  moved the diagnosis from "my element" to "this page", and then checking four
  untouched routes moved it again to "this app". Widening the probe cost three
  minutes and prevented a wrong fix.

## Known follow-ups

- The rate-limit window lives in one Node process, so it resets on deploy and is
  not shared between instances. Phase 24 introduces real rate limiting for the
  translation provider and should absorb this.
- `x-forwarded-for` is client-settable when nothing overwrites it. Reading the last
  hop is the mitigation, and `RATE_LIMIT_FORWARDED_HEADER` lets a deployment name
  the header its proxy actually sets, but a deployment without a proxy puts every
  visitor in one shared bucket. Worth revisiting when hosting is settled.
- **No public route renders without JavaScript.** Streaming plus a `loading.tsx`
  fallback leaves an unscripted browser looking at the skeleton on every route —
  confirmed on `/en`, `/en/words`, `/en/search`, and `/en/translate`, none of which
  this phase touched, in both dev and production. The feedback action itself is
  progressively enhanced and a scripting-free POST works, so the fix belongs at the
  routing layer: either render the first view without a Suspense fallback or accept
  that JavaScript is required and stop describing the UI as enhanced. The two
  `javaScriptEnabled: false` specs written for this were removed rather than left
  red, because they assert something blocked outside this phase's scope.
- The queue has no admin-side filtered view beyond Payload's own column filters. If
  triage volume grows, a saved "new only" view or a dashboard widget would help.
- Nothing notifies anyone that a report arrived; moderators have to look. An email
  or digest belongs with whatever notification story Phase 16 brings.
- A reporter who supplies an email gets no acknowledgement and no reply channel.
  The field is stored for a human to act on manually.
- Deleting reported content leaves the report's polymorphic relationship dangling;
  the `relatedSlug` snapshot is what keeps the row readable. A periodic cleanup or
  an `afterDelete` hook could tidy this.
- `next start` still logs `TypeError: controller[kState].transformAlgorithm is not
  a function`, carried over from Phases 12 to 14. One full `--workers=1` run took 17
  minutes instead of the usual two, and an unrelated `scenario-detail` not-found
  spec timed out at 30 seconds inside it. That spec passes in isolation in 13
  seconds, and a clean re-run of the whole suite passed 101 of 101 in 1.7 minutes,
  so the failure was environmental rather than a regression — but a suite that can
  run ten times slower under load is capable of hiding a genuine failure behind a
  timeout. Worth tracing alongside the carried-over TypeError.
- `pnpm exec tsc --noEmit` still reports 17 pre-existing errors in test files
  (`words/service.test.ts`, `fields/content.test.ts`, `seedScenarios.test.ts`,
  `users-collection.test.ts`, `words-collection.test.ts`,
  `support-snippet.test.tsx`). Not covered by `pnpm lint` or `pnpm build`, and
  untouched here.
- `docs/implementation-log/phase-11.md` is still missing even though Phase 11 is
  merged.
