# Phase 02 Implementation Log

## What was achieved

- Added route-based English and Bangla UI at `/en` and `/bn`.
- Added browser-aware locale negotiation and explicit locale persistence.
- Separated UI locale from anonymous learning-support mode.
- Added translated metadata, homepage copy, loading, error, and not-found states.
- Kept Payload admin and API routes outside public locale routing.

## How it was implemented

- Integrated `next-intl` with the existing Next.js and Payload configuration.
- Added a Next.js 16 proxy with explicit `/admin` and `/api` exclusions.
- Added type-checked English and Bangla message catalogs with matching keys.
- Moved public route files beneath the `[locale]` segment and set the document
  language from the validated route locale.
- Added routing-aware navigation helpers and an accessible language switcher
  that preserves pathname, query string, and fragment.
- Added a support-mode provider for `en`, `bn`, and `both`. Anonymous choices
  use the `vashabid_support_mode` cookie and are resolved during server render.
- Added Noto Sans Bengali as the Bangla UI font while retaining Geist for Latin
  text.

## Tests added or updated

- Unit coverage for locale and support-mode validation, fallback, and cookie
  serialization.
- Catalog parity coverage to prevent missing Bangla UI keys.
- Component coverage for provider state, translated selector accessibility,
  and cookie updates.
- Browser coverage for locale negotiation, saved-locale precedence, localized
  rendering, `html lang`, path-preserving language switching, support-mode
  persistence, invalid-cookie fallback, translated 404s, and Payload route
  isolation.

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

## What can be learned

- UI locale and learning-support language solve different problems and should
  not share one preference field.
- URL locale prefixes make language state explicit while a small cookie makes
  repeat visits convenient.
- Proxy matchers must exclude Payload routes or public localization can break
  the admin and REST API.
- Server-resolved preferences avoid hydration flashes at the cost of dynamic
  rendering for personalized public routes.

## Known follow-ups

- Phase 3 can move the temporary homepage shell and controls into the shared
  layout and component system.
- Learner accounts will eventually persist support mode on the learner profile.
- Remove `experimental.rootParams` after upgrading to Next.js 16.3 or later.
