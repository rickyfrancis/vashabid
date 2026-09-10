import { describe, expect, test } from 'vitest'

import { deriveSupportMode } from './support-mode'

describe('deriveSupportMode', () => {
  test.each([
    ['en', undefined, 'en'],
    ['bn', undefined, 'bn'],
    ['en', null, 'en'],
    ['en', 'bn', 'both'],
    ['bn', 'en', 'both'],
  ] as const)(
    'maps %s plus %s onto %s',
    (primary, secondary, expected) => {
      expect(deriveSupportMode(primary, secondary)).toBe(expected)
    },
  )

  test.each(['en', 'bn'] as const)(
    'treats %s chosen twice as a single language, never as both',
    (language) => {
      // `both` renders two columns; deriving it from one language would show
      // the same text side by side.
      expect(deriveSupportMode(language, language)).toBe(language)
    },
  )
})
