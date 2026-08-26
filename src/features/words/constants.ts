export const wordTypes = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'phrase',
  'idiom',
] as const

export type WordType = (typeof wordTypes)[number]

export const WORD_BROWSE_PAGE_SIZE = 6
