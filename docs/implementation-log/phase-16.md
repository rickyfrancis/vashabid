# Phase 16 Implementation Log

## What was achieved

- Added learner accounts: signup, login, logout, and a six-question onboarding
  flow at `/[locale]/signup`, `/[locale]/login`, and `/[locale]/onboarding`, in
  both English and Bangla.
- Added the project's **first anonymous write to `users`**. Every phase before
  this either read published content or accepted a submission nobody owned;
  this one hands out identities, so the interesting work was deciding what a
  stranger may set and proving they cannot set anything else.
- **Removed a privilege-escalation hazard that public signup would have opened.**
  `promoteFirstUser` made the first account created on an empty database an
  admin. Harmless while `create` was admin-only; on a fresh deploy with public
  signup it would have handed admin to whoever signed up first — and field
  access could not have stopped it, because the hook set the role itself, after
  the injected value had already been stripped. Admins are now provisioned by
  `pnpm seed`.
- Split identity from preferences. `users` keeps credentials, role, status, and
  the two preferences every role has; the new `learner-profiles` collection
  holds the six answers that only mean something for a learner, with a learner
  owning their own row outright.
- Made a signed-in learner's support mode outrank the anonymous cookie, and
  found two caching subtleties doing it — one in React state, one in `cache()` —
  that a green test suite had no opinion about.
- Established the authenticated write path: `createDocumentAs`,
  `updateDocumentAs`, and `findOneAs`, each pinning `user` **and**
  `overrideAccess: false`, so on-behalf-of writes stay under the caller's own
  policies. Still no privileged back door.
- Moved `cefrLevels` out of the Payload field helpers into `src/lib/content`,
  because a client component needed the same list the collections use and the
  old module pulled `richtext-lexical` into the browser bundle.
- Kept `pnpm seed` idempotent and gave it a production refusal rather than a
  weak default admin.

## How it was implemented

- **Opened `create` on `users` rather than writing signup through a trusted
  action.** The alternative was leaving `POST /api/users` closed and creating
  accounts with `overrideAccess: true` from server code. That would have been a
  smaller public surface and a worse design: it contradicts the project's
  `overrideAccess: false` rule, and field-level access — the thing that actually
  stops an injected `role` — would not apply on the one path that matters. With
  the rules in hooks there is no privileged path at all, so a future developer
  who adds a field cannot accidentally create a bypass.
- **Deleted the promotion hook instead of working around it.** Guarding
  `promoteFirstUser` so it only fired on Payload's `registerFirstUser` route was
  possible but fragile, and it would have left "the network can decide who is an
  admin" true in principle. Reading
  `node_modules/payload/dist/auth/operations/registerFirstUser.js` settled it:
  that operation refuses once any user exists, so a seeded admin closes the
  bootstrap screen permanently and the promotion has nothing left to do.
- **Verified the Payload auth mechanics rather than assuming them.**
  `payload.login()` returns a token and sets no cookie; `auth.useSessions`
  defaults to `true`; there is no `payload.logout()` on the Local API, but
  `logoutOperation` and `createLocalReq` are both exported from the package
  root, and `logoutOperation` revokes the session matching `req.user._sid`. All
  four facts are load-bearing, so all four are written into `docs/architecture.md`.
- **Built the auth cookie with Payload's own generator.** `generatePayloadCookie`
  and `generateExpiredPayloadCookie` are public on the `payload/shared` subpath
  and return a `CookieObject` that maps onto Next's `cookies().set()`. Hand-rolling
  the attributes would have worked today and drifted the first time
  `cookiePrefix` or `tokenExpiration` changed.
- **Made the acting user satisfy the same gate every policy uses.** The first
  version of `SessionUser` carried `role` but not `accountStatus`, so
  `getActivePayloadUser` rejected it, every policy failed closed, and onboarding
  silently refused to save while reporting success. The type now states
  `accountStatus: 'active'` — which is always true, since `getSession` returns
  null for anything else — and a test asserts the session user passes that gate.
- **Kept `server-only` out of the layout barrel.** `Header` needed the session,
  but four client components import `@/components/layout`, and a barrel is one
  module: importing anything from it evaluates every re-export. The session is
  therefore resolved in the root layout and threaded down as a prop, so nothing
  in `src/components/layout/` reaches server-only code.
- **Returned message keys, not prose, from validation**, reusing the Phase 15
  rule. `AuthErrorMessageKey` is a union rather than `string`, so an error
  without a catalogue entry in both `messages/en.json` and `messages/bn.json`
  fails to compile.
- **Asked the language question the way a learner thinks about it.** Onboarding
  offers a primary and an optional secondary language; `deriveSupportMode` turns
  that pair into the three-valued `supportMode`. One pure function owns the
  translation, so the wording never has to explain what `both` means and the two
  representations cannot drift.
- **Gave the seeder an unforgeable way to identify itself.** `forceLearnerDefaults`
  demoted the admin the seeder had just created, because the hook cannot tell a
  seed from a signup by looking at `req.user` — both are absent. The seeder now
  passes `context: { vashabidSeed: true }`, which works precisely because
  `createPayloadRequest` hardcodes `context: {}` and no REST client can set it —
  the property Phase 15 established and wrote down.
- **Handled cascade deletion in a hook rather than by editing the schema.** The
  generated foreign key is `ON DELETE set null` against a `NOT NULL` column, so
  deleting a learner would have failed on the constraint. An `afterDelete` hook
  removes the profile and passes `req`, so it shares the outer transaction and
  behaves identically on the schema-push path used in development and the
  migration path used in production.

## Tests added or updated

- Covered the learner-profile access matrix: a learner's read resolves to a
  `user`-scoped `Where` rather than `true`, one learner's scope never equals
  another's, editors reach learner-owned rows only, deletion is admin-only, and
  a `test.each` over anonymous, suspended, and malformed identities fails closed.
- Covered the collection config: the unique indexed owner, admin-only field
  access on `user`, every onboarding enum, which fields are required and that
  the second language deliberately is not, the read-only completion stamp, and
  that the `beforeValidate` hooks are ordered so ownership settles before the
  duplicate check.
- Covered the profile hooks directly: the owner stamped from `req.user`, an
  attacker-supplied `user` ignored, an admin still able to act for someone else,
  the duplicate refused as a 409 rather than a constraint error, the count run
  past access control so an existing row is never invisible, and the completion
  stamp written once and not moved by a later edit.
- Covered the signup guards: a 429 past the limit with an injected clock,
  editorial exemption, a *suspended* admin not exempt, the password minimum that
  Payload does not enforce, malformed payloads refused on the REST path, an
  injected `role: 'admin'` stored as `learner`, and that only an admin may assign
  an editorial role.
- Covered the seed context flag from both sides: the seeder mints an admin with
  it, and an absent context, an empty one, a falsy flag, and a string that merely
  looks right all still force a learner.
- Covered the schemas: email lowercased and trimmed so an account cannot be
  duplicated by case, password and display-name boundaries with distinct keys per
  failure, `learner@localhost` refused even though Chrome accepts it, an
  unselected radio group treated as absent rather than invalid, the same language
  twice refused, and unknown keys — `role`, `user`, `onboardingCompletedAt` —
  dropped.
- Covered the services: signup mapping a duplicate email onto the email field, a
  429 onto rate-limited, and rethrowing what it does not understand; login
  reporting bad credentials, a suspended account, and a locked account
  *identically*; logout revoking the session before the cookie is cleared;
  onboarding splitting answers across the two collections, updating an existing
  profile instead of creating a second, and writing nothing at all when the
  submission is invalid or anonymous.
- Covered the repositories: headers forwarded, on-behalf writes passing `user`
  and `overrideAccess: false`, and the profile payload never naming its owner.
- Covered the three forms in both locales: `aria-invalid` and `aria-describedby`
  wiring, retained input after a rejection, the password never echoed back, the
  honeypot absent from the accessibility tree and the tab order, the login form
  refusing to mark a field invalid so it cannot confirm who has an account, and a
  Bangla validation message rendering in Bangla.
- Covered the header account area in both states, including that signing out is a
  submit button inside a form rather than a link a prefetcher could follow.
- Covered support-mode precedence — account over cookie over locale — and the
  session user as a write actor, which is the test that would have caught the
  missing `accountStatus` immediately.
- Added `tests/e2e/auth.spec.ts` and `tests/e2e/onboarding.spec.ts`: signup
  landing on onboarding, a duplicate email refused inline, a short password
  refused by the server, the login/logout round trip, an unknown email failing
  exactly like a wrong password, route protection in both directions, a revoked
  session refused after sign-out, anonymous browsing still working, and the
  stored preference surviving a sign-out with cookies cleared.
- Inverted the `admin.spec.ts` assertion this phase deliberately changes:
  anonymous `POST /api/users` now succeeds and stores a **learner**, and a
  short-password post is still refused over REST.
- Extended `migrations.test.ts` with a Phase 16 block, including that no column
  was added to `users` — the onboarding answers went to their own collection.

The suite is 1018 passing unit tests (up from 833) and 119 passing Playwright
tests (up from 101).

## Verification

- `pnpm lint`
- `pnpm test` — 1018 passed
- `pnpm build`
- `pnpm generate:types` — `payload-types.ts` committed, no further diff
- `pnpm migrate:create` — reviewed, then patched so the `down` constraint, index,
  table, column and type drops use `IF EXISTS`, matching Phases 12, 13 and 15,
  and the argument list narrowed to `{ db }` as the other migrations have it
- `pnpm seed` — 3 created on an empty user table, then `0 created, 0 updated,
  3 unchanged` on every rerun; all existing content unchanged (5 tags, 10 words,
  8 grammar topics, 8 scenarios)
- `pnpm test:e2e --workers=1` against the production build, as CI runs it —
  119 passed in 49 seconds. Against `pnpm dev` the signup spec timed out once
  waiting for `/en/onboarding`: that route is compiled on demand, and the wait
  exceeded 30 seconds under a full-suite run. It is a development-server
  artefact, not a defect — CI builds first — but worth knowing before chasing it
- `pnpm exec tsc --noEmit` — 15 errors, all in test files that predate this
  phase; the three this phase introduced were fixed, so it adds none
- Manual checks against a running app, asserted against **Postgres directly**
  rather than the API response, per the Phase 15 lesson:
  - `POST /api/users` carrying `role: 'admin'` and `accountStatus: 'suspended'`
    stored `role = learner`, `account_status = active`
  - after logout the `users_sessions` row was gone and the captured token
    authenticated as nobody, confirming the cookie is not what ends the session
  - a learner listing `/api/learner-profiles` saw exactly one row — their own;
    fetching another profile by id returned 404, patching it returned 403, and
    the target row was unchanged in storage
  - a learner patching their own profile with `user: 3` returned 200 and left
    `user_id` untouched, which is field access deleting the value rather than
    raising — the documented behaviour, verified rather than assumed
- The dev database was restored to the two seeded accounts afterwards

## What can be learned

- **A hook can defeat the guard that protects it.** Field access correctly
  stripped an injected `role: 'admin'`, and it made no difference: `promoteFirstUser`
  set the role itself, later in the same operation. The protection was real, the
  threat model was wrong. Asking "what else writes this field?" was worth more
  than hardening the path that was already covered.
- **The same absence means two different things.** `forceLearnerDefaults` sees no
  `req.user` for an anonymous signup and no `req.user` for the seed script, and
  must treat them oppositely. There was no way to tell them apart by inspecting
  the request — the distinction had to be declared, and it could only be trusted
  because `context` is unreachable from the network. A previously verified
  framework property turned an impossible problem into a one-line check.
- **A test that never runs the real thing can be entirely green and entirely
  wrong.** Every onboarding unit test passed while onboarding silently saved
  nothing, because the mocked repositories accepted an actor the real access
  policies rejected. The e2e suite caught it. The durable fix was not the e2e
  test but the contract test: the session user must satisfy `getActivePayloadUser`,
  asserted directly against the same gate production uses.
- **"It reported success" is not "it worked."** The failing onboarding submit
  returned no error — the write was refused, the action redirected, and the page
  looked right. Only the database disagreed. Checking storage is not just for
  security properties; it is for any write whose failure mode is silence.
- **A barrel export is a module, not a namespace.** Importing `PageContainer`
  from `@/components/layout` evaluates everything that barrel re-exports, which
  is how a server-only session helper ended up in four client bundles, and how
  `richtext-lexical` ended up in the browser. Both were invisible in `pnpm build`
  and only appeared in `pnpm dev`, which is a reminder that the two do not check
  the same things.
- **React state seeded from props is a cache, and caches go stale.**
  `SupportModeProvider` reads `initialMode` once. A preference changed on the
  server reached the layout, produced the right value, and never appeared,
  because `useState` ignores it after mount. Keying the provider on the value is
  the fix; noticing that a "state" prop is really an initial value is the lesson.
- **Request-scoped memoisation has a sharp edge in server actions.** `getSession`
  is wrapped in `cache()`, so the render that follows an action reuses the
  session read *before* the action's write. The value was correct in the
  database and stale on the page. `revalidatePath` was the fix; the general shape
  — a per-request cache read before a write in the same request — is worth
  remembering.
- **Match the platform's own affordances instead of fighting them.** The
  onboarding radios are `sr-only`, so `.check()` timed out. The existing
  home-page specs already clicked the visible label, which is both what a person
  does and what Playwright can see. The convention was already in the repository;
  reading it first would have saved the detour.

## Known follow-ups

- No email verification and no password reset. Neither is useful until an email
  adapter is configured — Payload currently writes mail to the console — so both
  are deferred rather than half-built. A password reset in particular should not
  ship without a real provider.
- Signup necessarily reveals whether an email is already registered. Avoiding
  that needs an email round trip, so it waits on the same adapter. Login is
  already indistinguishable across unknown email, wrong password, suspended, and
  locked.
- The signup rate-limit window lives in one Node process, so it resets on deploy
  and is not shared between instances. This is the second limiter with that
  property; Phase 24 introduces real rate limiting and should absorb both.
- A fresh deployment must run `pnpm seed` or it will have no admin. That is the
  deliberate trade for removing automatic promotion, and it is written into
  `docs/architecture.md`, but it is a manual step that a deploy pipeline should
  eventually own.
- There is no account settings page yet. Onboarding can be revisited to change
  preferences, which covers the need for now, but changing an email or password
  has no UI.
- `docs/implementation-log/phase-11.md` is still missing.
- No public route renders without JavaScript. The auth forms are progressively
  enhanced in the same way the feedback form is, but every route in this app
  pairs streaming with a `loading.tsx` fallback, so an unscripted browser still
  sees only the skeleton. Unchanged by this phase, and now it affects signing in.
