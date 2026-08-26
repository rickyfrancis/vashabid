import { describe, expect, test, vi } from 'vitest'

import { createWordDetailMetadata } from './metadata'
import type { WordDetailPageViewModel } from './types'

const word = {
  lemma: 'der Termin',
  support: {
    bangla: { meanings: ['অ্যাপয়েন্টমেন্ট'] },
    english: { meanings: ['appointment'] },
  },
} as WordDetailPageViewModel

describe('word detail metadata', () => {
  test('uses the English meaning for English routes', () => {
    const translate = vi.fn((key, values) => `${key}:${values.meaning}`)

    expect(createWordDetailMetadata(word, 'en', translate)).toEqual({
      description: 'metadataDescription:appointment',
      title: 'metadataTitle:appointment',
    })
    expect(translate).toHaveBeenCalledWith('metadataTitle', {
      meaning: 'appointment',
      word: 'der Termin',
    })
  })

  test('uses approved Bangla with an English fallback', () => {
    const translate = vi.fn((key, values) => `${key}:${values.meaning}`)

    expect(createWordDetailMetadata(word, 'bn', translate).description).toBe(
      'metadataDescription:অ্যাপয়েন্টমেন্ট',
    )
    expect(
      createWordDetailMetadata(
        {
          ...word,
          support: { ...word.support, bangla: null },
        },
        'bn',
        translate,
      ).description,
    ).toBe('metadataDescription:appointment')
  })
})
