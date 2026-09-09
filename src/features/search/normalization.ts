import { cleanUserText, generateGermanAlternatives } from '@/lib/german'
import { cefrLevels, type CefrLevel } from '@/lib/payload/fields'
import { wordTypes, type WordType } from '@/features/words/constants'
import type {
  NormalizedSearchParams,
  NormalizedSearchQuery,
  SearchCanonicalQuery,
  SearchParams,
} from './types'

const wordTypeAliases: Record<string, WordType> = {
  adjective: 'adjective',
  adjectives: 'adjective',
  adverb: 'adverb',
  adverbs: 'adverb',
  conjunction: 'conjunction',
  conjunctions: 'conjunction',
  idiom: 'idiom',
  idioms: 'idiom',
  noun: 'noun',
  nouns: 'noun',
  phrase: 'phrase',
  phrases: 'phrase',
  preposition: 'preposition',
  prepositions: 'preposition',
  verb: 'verb',
  verbs: 'verb',
  'বিশেষ্য': 'noun',
  'ক্রিয়া': 'verb',
  'বিশেষণ': 'adjective',
  'ক্রিয়াবিশেষণ': 'adverb',
  'পদান্বয়ী অব্যয়': 'preposition',
  'পদান্বয়ী': 'preposition',
  'অব্যয়': 'preposition',
  'সংযোজক অব্যয়': 'conjunction',
  'সংযোজক': 'conjunction',
  'বাক্যাংশ': 'phrase',
  'বাগধারা': 'idiom',
}

function cefrFromToken(token: string): CefrLevel | undefined {
  const upper = token.toLocaleUpperCase('de-DE')
  return cefrLevels.find((level) => level === upper)
}

function wordTypeFromToken(token: string): WordType | undefined {
  const normalized = token.toLocaleLowerCase('de-DE')
  return wordTypeAliases[normalized] ??
    wordTypes.find((wordType) => wordType === normalized)
}

export function normalizeSearchQuery(value: string): NormalizedSearchQuery {
  const displayQuery = cleanUserText(value)
  const lowered = displayQuery.toLocaleLowerCase('de-DE')
  const withoutArticle = lowered.replace(/^(?:der|die|das)\s+/u, '')
  const matchingQuery = withoutArticle || lowered
  const wholeWordType = wordTypeFromToken(matchingQuery)
  const tokens = wholeWordType
    ? [
        {
          variants: generateGermanAlternatives(matchingQuery),
          wordType: wholeWordType,
        },
      ]
    : matchingQuery
        .split(/\s+/u)
        .filter(Boolean)
        .map((token) => ({
          cefrLevel: cefrFromToken(token),
          variants: generateGermanAlternatives(token),
          wordType: wordTypeFromToken(token),
        }))

  return { displayQuery, tokens }
}

function singleValue(value: string | string[] | undefined): {
  isCanonical: boolean
  value?: string
} {
  if (value === undefined) return { isCanonical: true }
  if (Array.isArray(value)) return { isCanonical: false }
  return { isCanonical: true, value }
}

export function toSearchQuery(
  query: string,
  page = 1,
): SearchCanonicalQuery {
  if (!query) return {}

  return {
    q: query,
    ...(page > 1 ? { page: String(page) } : {}),
  }
}

export function normalizeSearchParams(
  params: SearchParams,
): NormalizedSearchParams {
  const supportedKeys = new Set(['page', 'q'])
  let isCanonical = Object.keys(params).every((key) => supportedKeys.has(key))
  const queryValue = singleValue(params.q)
  const pageValue = singleValue(params.page)
  isCanonical &&= queryValue.isCanonical && pageValue.isCanonical

  const rawQuery = queryValue.value ?? ''
  const query = cleanUserText(rawQuery)
  if (query !== rawQuery) isCanonical = false

  let page = 1
  if (pageValue.value !== undefined) {
    if (/^[1-9]\d*$/u.test(pageValue.value)) {
      page = Number(pageValue.value)
      if (!Number.isSafeInteger(page) || page === 1) {
        page = 1
        isCanonical = false
      }
    } else {
      isCanonical = false
    }
  }

  if (!query && pageValue.value !== undefined) isCanonical = false

  return { isCanonical, page, query }
}
