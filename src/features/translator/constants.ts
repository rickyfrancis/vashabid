/**
 * The translation directions the tool offers. German is always one side of the
 * pair because German is the target language of the whole product.
 *
 * `de-both` shows English and approved Bangla side by side. It is a real,
 * shareable direction rather than a reflection of the support-mode cookie, so a
 * learner can link someone to the side-by-side view directly.
 */
export const translationDirections = [
  'de-en',
  'de-bn',
  'de-both',
  'en-de',
  'bn-de',
] as const

export type TranslationDirection = (typeof translationDirections)[number]

export const DEFAULT_TRANSLATION_DIRECTION: TranslationDirection = 'de-en'

/** Language codes offered in the source and target selectors. */
export const translationSourceLanguages = ['de', 'en', 'bn'] as const
export const translationTargetLanguages = ['en', 'bn', 'both', 'de'] as const

export type TranslationSourceLanguage =
  (typeof translationSourceLanguages)[number]
export type TranslationTargetLanguage =
  (typeof translationTargetLanguages)[number]

/**
 * Input is carried in the URL so results stay shareable and the page keeps the
 * project's GET-form convention. That trades unlimited length for linkability,
 * so the cap is enforced explicitly and reported to the learner instead of
 * silently truncating their sentence.
 */
export const MAX_TRANSLATE_INPUT = 1000

/** Upper bound on how many known words the result lists. */
export const TRANSLATE_MATCH_LIMIT = 24

/** Longest lemma, in tokens, that phrase matching will attempt. */
export const MAX_PHRASE_TOKENS = 4
