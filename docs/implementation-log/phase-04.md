# Phase 04 Implementation Log

## What was achieved

- Added reusable, active-account-aware Payload access policies for admins,
  editors, learners, document ownership, and published content.
- Extended Payload users with roles, display names, UI locale, learning-support
  preference, and account status.
- Added least-privilege user management for administrators, editors, learners,
  suspended accounts, and anonymous visitors.
- Kept learner-facing authentication UI and external auth providers out of this
  phase.

## How it was implemented

- Centralized role and status values with typed access helpers under
  `src/lib/payload/access/` so future collections can reuse one policy layer.
- Saved role and account status to the JWT, while failing closed when an identity
  is missing required role, status, collection, or ID data.
- Scoped editors to themselves and learner documents. Field-level policies keep
  learner email, role, and status protected, while collection access prevents an
  editor from changing another user's password.
- Forced the first registered Payload user to active admin and rejected suspended
  logins with a generic authentication error.
- Regenerated Payload types after the collection schema changed.

## Tests added or updated

- Added unit coverage for role policies, ownership queries, published-content
  fallback, the complete users access matrix, protected fields, and malformed
  identities.
- Added collection tests for field options/defaults, first-user promotion, and
  suspended login rejection.
- Updated browser coverage to verify anonymous user reads and ordinary user
  creation requests return `403` while the Payload admin route remains available.

## Verification

- `pnpm generate:types`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

The local Postgres schema was also inspected after Payload schema push: required
role, status, locale, and support-mode columns were present, `displayName`
remained optional, and no user records were created by the tests.

## What can be learned

- Collection access defines which documents a role can reach, while field access
  protects privileged values within an otherwise editable document.
- Authentication and authorization are separate: a valid Payload identity must
  still pass role and active-status policies for each operation.
- Centralized policies make future content permissions consistent and easier to
  test than collection-specific inline checks.

## Known follow-ups

- Phase 5 and later content collections should reuse these access helpers.
- Phase 16 will add learner-facing signup, login, logout, and onboarding.
- Add last-active-admin protection only when operational account workflows need
  it; Phase 4 intentionally leaves administrators able to manage every account.
- Before migrating a legacy database, backfill all pre-Phase-4 users as active
  admins, then demote accounts through Payload after deployment.
