# Phase 03 Implementation Log

## What was achieved

- Added a reusable public application shell with a localized header, footer,
  skip link, and consistent page container.
- Established an editorial-workbook visual system for English and Bangla in
  system light and dark modes.
- Added small accessible UI primitives for controls, surfaces, loading, empty,
  and error states.
- Moved the locale and learning-support preferences into the shared header.
- Reused the shared system on the homepage, loading, not-found, and error routes.

## How it was implemented

- Consolidated Tailwind v4 theme definitions in `src/styles/theme.css` and
  added semantic canvas, surface, text, border, focus, and status colors.
- Paired Newsreader and Noto Serif Bengali for display text while retaining
  Geist and Noto Sans Bengali for body text.
- Built native-prop React primitives rather than adding a component framework.
- Added `lucide-react` as the single public icon source.
- Presented support mode as a typed native radio group while preserving its
  provider state, locale-based default, and anonymous cookie persistence.
- Kept localized route components inside one shell-owned main landmark.

## Tests added or updated

- Added component coverage for language switching, segmented support mode,
  buttons, inputs, skeletons, empty states, and error states.
- Updated browser support-mode tests for radio-group interaction.
- Added mobile and desktop checks for shell visibility, landmarks, touch target
  sizing, and horizontal overflow in English and Bangla.
- Added browser verification for the system dark palette.

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

Run the commands with Node 24 as required by `package.json` and `.nvmrc`.

## What can be learned

- Semantic tokens let one component implementation work across visual themes.
- Native controls retain keyboard and screen-reader behavior while still
  supporting a distinct visual treatment.
- A shell-level landmark structure prevents repeated pages and route states
  from drifting apart.
- Typography and restrained background detail can establish identity without a
  heavy animation or component dependency.

## Known follow-ups

- Phase 8 will replace the temporary homepage content with published Payload
  data while keeping the shell and primitives.
- Add navigation destinations only as their public routes become available.
- A manual theme preference can be added later if learner settings require it.
