import { cleanUserText } from '@/lib/german'
import {
  DEFAULT_TRANSLATION_DIRECTION,
  MAX_TRANSLATE_INPUT,
  translationDirections,
  type TranslationDirection,
  type TranslationSourceLanguage,
  type TranslationTargetLanguage,
} from './constants'
import type {
  NormalizedTranslateParams,
  TranslateCanonicalQuery,
  TranslateSearchParams,
} from './types'

export function splitDirection(direction: TranslationDirection): {
  from: TranslationSourceLanguage
  to: TranslationTargetLanguage
} {
  const [from, to] = direction.split('-')
  return {
    from: from as TranslationSourceLanguage,
    to: to as TranslationTargetLanguage,
  }
}

function toDirection(
  from: string | undefined,
  to: string | undefined,
): TranslationDirection | undefined {
  return translationDirections.find(
    (direction) => direction === `${from}-${to}`,
  )
}

function singleValue(value: string | string[] | undefined): {
  isCanonical: boolean
  value?: string
} {
  if (value === undefined) return { isCanonical: true }
  if (Array.isArray(value)) return { isCanonical: false }
  return { isCanonical: true, value }
}

/**
 * The canonical URL for a translation. The direction is only carried when it
 * differs from the default, and neither key appears without text, so a bare
 * `/translate` stays the idle URL.
 */
export function toTranslateQuery(
  text: string,
  direction: TranslationDirection,
): TranslateCanonicalQuery {
  if (!text) return {}

  const { from, to } = splitDirection(direction)

  return {
    text,
    ...(direction === DEFAULT_TRANSLATION_DIRECTION ? {} : { from, to }),
  }
}

/**
 * Treats every search param as untrusted. Anything the page would not have
 * produced itself — an unknown key, a repeated value, an unsupported language
 * pair, or padded text — is reported as non-canonical so the route can redirect
 * to the URL this state should have had.
 */
export function normalizeTranslateParams(
  params: TranslateSearchParams,
): NormalizedTranslateParams {
  const supportedKeys = new Set(['from', 'text', 'to'])
  let isCanonical = Object.keys(params).every((key) => supportedKeys.has(key))

  const textValue = singleValue(params.text)
  const fromValue = singleValue(params.from)
  const toValue = singleValue(params.to)
  isCanonical &&=
    textValue.isCanonical && fromValue.isCanonical && toValue.isCanonical

  const rawText = textValue.value ?? ''
  const text = cleanUserText(rawText)
  if (text !== rawText) isCanonical = false

  // Over-length input stays canonical so the page can explain the limit with
  // the learner's text still in the box, rather than silently truncating it.
  const isTooLong = text.length > MAX_TRANSLATE_INPUT

  let direction = DEFAULT_TRANSLATION_DIRECTION
  if (fromValue.value !== undefined || toValue.value !== undefined) {
    const resolved = toDirection(fromValue.value, toValue.value)

    if (resolved) {
      direction = resolved
      // The default direction is implicit, so spelling it out is non-canonical.
      if (resolved === DEFAULT_TRANSLATION_DIRECTION) isCanonical = false
    } else {
      isCanonical = false
    }
  }

  // A direction without text has nothing to act on.
  if (!text && (fromValue.value !== undefined || toValue.value !== undefined)) {
    isCanonical = false
  }

  return { direction, isCanonical, isTooLong, text }
}
