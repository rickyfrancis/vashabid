export const situationTypes = [
  'everyday',
  'travel',
  'work',
  'study',
  'health',
  'services',
  'social',
] as const

export type SituationType = (typeof situationTypes)[number]

export const SCENARIO_BROWSE_PAGE_SIZE = 6

export const SCENARIO_SEARCH_LIMIT = 6
