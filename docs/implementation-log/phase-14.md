# Phase 14 Implementation Log

## What was achieved

- Added `/[locale]/translate`, the first learner *tool* rather than another
  content surface, working entirely from published Vashabid vocabulary with no
  external translation API.
- Added the project's first provider boundary: a `TranslatorProvider` interface,
  a `DictionaryTranslatorProvider` implementation, and a shared contract suite
  that any future provider must pass.
- Made all five directions real. German input is matched against lemmas; English
  and Bangla input reverse-match against meanings to surface candidate German
  words, so no selectable direction is a dead end before Phase 24.
- Matched German the way a learner actually types it: articles stripped, umlaut
  and sharp-s spellings folded, multi-word lemmas matched as phrases, trailing
  punctuation ignored, and a small conservative inflection table so `Ich esse
  Brot` reaches `essen`.
- Rendered the learner's own sentence back to them with known words linked
  inline, plus a de-duplicated card list of every word Vashabid recognised.
- Kept the tool honest. Dictionary output is structurally incapable of claiming a
  translation, and every result carries a "dictionary-assisted, not machine
  translation" notice.
- Promoted `cleanUserText` and `generateGermanAlternatives` from the search
  feature into `src/lib/german/`, since a second feature now needs them.
- Kept drafts, archived words, editorial metadata, database identifiers, and
  unapproved Bangla out of every view model and client prop.

## How it was implemented

- Followed the existing spine exactly: a GET form carrying `text`, `from`, and
  `to`; `normalizeTranslateParams` as the canonical-URL guard; a service
  returning a `{ kind: 'page' } | { kind: 'redirect' }` union; and a thin route
  adapter that calls `redirect()`. Support mode stays cookie-backed and outside
  the URL contract, so results remain shareable.
- Encoded the honesty requirement in the *type*, not the copy.
  `TranslationOutcome.kind` is `dictionary` or `machine`, and a dictionary
  provider must return `translation: null`. `TranslatorService` additionally
  discards a translation that arrives on a dictionary outcome, so a
  mis-implemented provider still cannot make the page lie.
- Had providers return slugs rather than documents. The service hydrates matches
  through `WordService.toRelatedWord`, which means editorial metadata and pending
  Bangla cannot reach a provider result by construction rather than by
  discipline.
- Built the lemma index in memory from `WordRepository.findAllPublishedActive()`,
  the same all-then-filter shape `SearchRepository` already uses. A new
  `TranslatorRepository` would only have wrapped that one query, so the
  translator injects `WordRepository` directly, which the import-direction rule
  allows.
- Made inflection folding accept-only-on-hit: candidates are generated from an
  explicit suffix table and used only when they land on a lemma that exists.
  Folding can narrow a search but never invent a word, and it is gated to
  Latin-script input so Bangla is never folded through German rules.
- Reused `splitGermanHeadword` so `Brot` matches `das Brot`, and matched longest
  phrase first so `Das Brot` wins over a bare `Brot` and spans never overlap.
- Refused over-length input instead of silently truncating it. The learner keeps
  their text in the box and is told the limit, which is the one place the
  URL-state convention costs something real.
- Added `Textarea` as a UI primitive mirroring `Input`, and kept the direction
  pickers as native `<select>`s with the existing `selectStyles`, because
  `SegmentedControl` needs a client `onChange` and would have broken the
  no-JavaScript GET form.

## Tests added or updated

- Covered the tokenizer as a pure unit: offsets that slice the original text back
  out, punctuation exclusion, hyphens and apostrophes, Bangla input, decomposed
  Unicode, and the full inflection table including the two cases it must refuse —
  folding a short word to a stub, and folding non-Latin script.
- Ran `describeTranslatorProviderContract()` against the dictionary provider. It
  asserts ordered non-overlapping spans that index the request text, a stable id,
  `translation: null` for dictionary output, and no database identifiers.
- Covered the provider directly for all five directions, article and umlaut
  matching, phrase-over-token precedence, inflection labelling, that folding
  never invents a word, that English and Bangla are not folded through German
  rules, and that an unapproved Bangla meaning and its romanized helper are never
  indexed.
- Covered the service for the canonicalization matrix, the idle and too-long
  states, segment reconstruction (including exact round-trip, unmapped words, and
  overlapping matches), and leakage: no `id`, `review`, or `source`, and a
  serialized-page assertion that pending Bangla never appears.
- Covered the page component in all three support modes, including the
  dictionary notice appearing for lookups and disappearing for machine output,
  the empty and too-long states, the inert sentence-mining placeholder, and real
  link targets.
- Added `tests/e2e/translate.spec.ts`: matching, inflection, both reverse
  directions, the unapproved-Bangla leak test in both script and romanized form,
  URL canonicalization, the header link, the Bangla locale with support-mode
  switching, and a mobile plus dark-mode layout check.

The suite is 617 passing unit tests (up from 506) and 89 passing Playwright tests
(up from 75).

## Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm seed` — reported all five topic tags, ten words, and eight grammar topics
  unchanged
- `pnpm test:e2e` against the dev server and against `pnpm start`, both with
  `--workers=1` as CI runs it: 89 passed each time
- The support-mode test run five consecutive times in isolation after its flake
  was fixed
- No migration: this phase adds no collection and only reads `words`

## What can be learned

- A type can carry a promise that copy cannot. The rule "never claim machine
  translation" could have lived in a style guide and been quietly broken later.
  Making `translation` structurally `null` for dictionary output, and having the
  service discard a translation that should not exist, turns an editorial
  intention into something the compiler and the tests enforce.
- Write the contract suite before the second implementation, not after. There is
  only one provider today, so `describeTranslatorProviderContract` looks
  redundant — but it is exactly the artifact that lets Phase 24 swap in a real
  API and know the UI still holds. It also caught the design question of what a
  match may contain, which is what keeps documents out of provider results.
- Not every layer in a plan earns its place. The plan called for a
  `TranslatorRepository`; it would have wrapped a single query that
  `WordRepository` should own anyway. Dropping it removed a file without
  weakening the boundary.
- Reproduce before diagnosing, again. A duplicated word card looked like a
  de-duplication bug in the service. The service was fine: the assertion was
  reading the DOM mid-transition, while the old and new client subtrees briefly
  coexisted. Asserting `toHaveCount(1)` first both fixed the flake and turned it
  into a real assertion that a word is never listed twice.
- Check whether a failure is yours before treating it as yours. Two specs failed
  under parallel workers; stashing the phase and rebuilding showed the clean
  checkout failing the same way, and worse. The finding belonged in follow-ups,
  not in a fix.
- Silent truncation is a bug wearing a feature's clothes. Capping the input and
  translating the remainder would have shown a confident, partial reading of a
  sentence the learner never asked about.

## Known follow-ups

- Inflection folding is deliberately conservative and accept-only-on-hit, but
  German homographs can still mislead: a folded form that happens to hit an
  unrelated lemma will be shown. Matches are presented as reading aids linked to
  full entries rather than as an authoritative parse. A precision signal is
  already carried on every match (`exact` versus `inflected`) and currently only
  reaches the UI as a link title; surfacing it visually is open.
- Input is capped at 1000 characters because it travels in the URL. If sentence
  mining or a real provider makes longer passages worth supporting, the page will
  need a POST server action — which would be the first in the repo — and would
  cost shareable result links.
- The lemma index is rebuilt per request from every published word. That is right
  at ten seed words and fine into the low thousands, but it is the first thing to
  cache when the dictionary grows.
- `de-both` is selectable independently of the support-mode cookie, so a learner
  can reach a side-by-side URL whose chips then follow their cookie instead. The
  two concepts are deliberately separate, but the interaction is worth watching
  once learner profiles land in Phase 16.
- The sentence-mining action is an inert disabled button until Phase 18, matching
  the Phase 13 learning-queue placeholder.
- `next start` still logs `TypeError: controller[kState].transformAlgorithm is
  not a function`, carried over from Phases 12 and 13. Under full parallel
  Playwright load it remains capable of failing unrelated specs; a stashed
  baseline on this phase's commit failed two specs on one parallel run and
  seventy on the next, so this is pre-existing and getting worse, not a Phase 14
  regression. CI runs `--workers=1` and is unaffected. Worth tracing before it
  hides a real error.
- `pnpm exec tsc --noEmit` reports pre-existing errors in
  `src/features/words/service.test.ts` where `vi.fn()` mocks do not satisfy the
  `Pick<WordRepository, …>` parameter types. Present on a clean checkout, not
  covered by `pnpm lint` or `pnpm build`, and untouched here.
- `docs/implementation-log/phase-11.md` is still missing even though Phase 11 is
  merged.
