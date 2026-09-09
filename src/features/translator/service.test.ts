import type { Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { TranslatorService } from './service'
import type { TranslationOutcome } from './provider'

const word = (overrides: Partial<Word> = {}): Word =>
  ({
    _status: 'published',
    cefrLevel: 'A1',
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { meanings: [{ meaning: 'bread' }] },
    gender: 'das',
    id: 1,
    lemma: 'das Brot',
    lifecycleStatus: 'active',
    register: 'neutral',
    review: { banglaReviewed: false },
    slug: 'das-brot',
    source: { attribution: 'must stay server-side' },
    updatedAt: '2026-01-01T00:00:00.000Z',
    usefulnessScore: 4,
    wordType: 'noun',
    ...overrides,
  }) as Word

function dictionaryOutcome(
  overrides: Partial<TranslationOutcome> = {},
): TranslationOutcome {
  return {
    kind: 'dictionary',
    matches: [],
    providerId: 'dictionary',
    translation: null,
    ...overrides,
  }
}

function createService({
  outcome = dictionaryOutcome(),
  words = [word()],
}: { outcome?: TranslationOutcome; words?: Word[] } = {}) {
  const provider = {
    id: 'dictionary',
    supports: vi.fn().mockReturnValue(true),
    translate: vi.fn().mockResolvedValue(outcome),
  }
  const wordRepository = {
    findAllPublishedActive: vi.fn().mockResolvedValue(words),
  }

  return {
    provider,
    service: new TranslatorService(provider, wordRepository),
    wordRepository,
  }
}

describe('TranslatorService canonicalization', () => {
  test('requests a redirect before calling the provider', async () => {
    const fixture = createService()

    await expect(
      fixture.service.getPage({ text: '  Brot  ', extra: 'x' }),
    ).resolves.toEqual({ kind: 'redirect', query: { text: 'Brot' } })
    expect(fixture.provider.translate).not.toHaveBeenCalled()
  })

  test('preserves a non-default direction through a redirect', async () => {
    const fixture = createService()

    await expect(
      fixture.service.getPage({ from: 'de', text: ' Brot ', to: 'bn' }),
    ).resolves.toEqual({
      kind: 'redirect',
      query: { from: 'de', text: 'Brot', to: 'bn' },
    })
  })

  test('renders an idle page without querying anything', async () => {
    const fixture = createService()
    const result = await fixture.service.getPage({})

    expect(result).toMatchObject({
      kind: 'page',
      page: { direction: 'de-en', result: null, state: 'idle', text: '' },
    })
    expect(fixture.provider.translate).not.toHaveBeenCalled()
    expect(fixture.wordRepository.findAllPublishedActive).not.toHaveBeenCalled()
  })

  test('refuses over-length input instead of translating a truncation', async () => {
    const fixture = createService()
    const text = 'a'.repeat(1001)
    const result = await fixture.service.getPage({ text })

    expect(result).toMatchObject({
      kind: 'page',
      page: { result: null, state: 'too-long', text },
    })
    expect(fixture.provider.translate).not.toHaveBeenCalled()
  })
})

describe('TranslatorService results', () => {
  const matchOutcome = () =>
    dictionaryOutcome({
      matches: [
        {
          end: 8,
          matchedText: 'Das Brot',
          precision: 'exact' as const,
          slug: 'das-brot',
          start: 0,
        },
      ],
    })

  test('maps a match into a UI-safe word without editorial metadata', async () => {
    const fixture = createService({ outcome: matchOutcome() })
    const result = await fixture.service.getPage({ text: 'Das Brot ist frisch.' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return

    const [match] = result.page.result?.matches ?? []
    expect(match).toEqual({
      article: 'das',
      cefrLevel: 'A1',
      headword: 'Brot',
      slug: 'das-brot',
      support: { bangla: null, english: 'bread' },
      wordType: 'noun',
    })
    expect(match).not.toHaveProperty('id')
    expect(match).not.toHaveProperty('review')
    expect(match).not.toHaveProperty('source')
  })

  test('never exposes unapproved Bangla through a match', async () => {
    const pending = word({
      bangla: { meanings: [{ meaning: 'রুটি' }] },
      review: { banglaReviewed: false },
    })
    const fixture = createService({
      outcome: matchOutcome(),
      words: [pending],
    })
    const result = await fixture.service.getPage({ text: 'Das Brot ist frisch.' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return
    expect(result.page.result?.matches[0].support.bangla).toBeNull()
    expect(JSON.stringify(result.page)).not.toContain('রুটি')
  })

  test('marks dictionary output and never invents a translation', async () => {
    const fixture = createService({ outcome: matchOutcome() })
    const result = await fixture.service.getPage({ text: 'Das Brot ist frisch.' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return
    expect(result.page.result?.isDictionaryAssisted).toBe(true)
    expect(result.page.result?.translation).toBeNull()
  })

  test('discards a translation a dictionary provider should not have sent', async () => {
    const fixture = createService({
      outcome: dictionaryOutcome({ translation: 'The bread is fresh.' }),
    })
    const result = await fixture.service.getPage({ text: 'Das Brot ist frisch.' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return
    expect(result.page.result?.translation).toBeNull()
  })

  test('keeps a real machine translation', async () => {
    const fixture = createService({
      outcome: dictionaryOutcome({
        kind: 'machine',
        translation: 'The bread is fresh.',
      }),
    })
    const result = await fixture.service.getPage({ text: 'Das Brot ist frisch.' })

    expect(result.kind).toBe('page')
    if (result.kind !== 'page') return
    expect(result.page.result?.isDictionaryAssisted).toBe(false)
    expect(result.page.result?.translation).toBe('The bread is fresh.')
  })
})

describe('TranslatorService.toSegments', () => {
  const service = new TranslatorService()
  const viewModel = {
    article: 'das' as const,
    cefrLevel: 'A1' as const,
    headword: 'Brot',
    slug: 'das-brot',
    support: { bangla: null, english: 'bread' },
    wordType: 'noun' as const,
  }
  const words = new Map([['das-brot', viewModel]])

  test('reconstructs the input exactly', () => {
    const text = 'Das Brot ist frisch.'
    const segments = service.toSegments(
      text,
      [
        {
          end: 8,
          matchedText: 'Das Brot',
          precision: 'exact',
          slug: 'das-brot',
          start: 0,
        },
      ],
      words,
    )

    expect(segments.map((segment) => segment.text).join('')).toBe(text)
    expect(segments).toEqual([
      { kind: 'match', precision: 'exact', text: 'Das Brot', word: viewModel },
      { kind: 'text', text: ' ist frisch.' },
    ])
  })

  test('returns the whole input as plain text when nothing matched', () => {
    expect(service.toSegments('Guten Tag', [], words)).toEqual([
      { kind: 'text', text: 'Guten Tag' },
    ])
  })

  test('skips a match whose word could not be mapped', () => {
    const segments = service.toSegments(
      'Das Brot',
      [
        {
          end: 8,
          matchedText: 'Das Brot',
          precision: 'exact',
          slug: 'unknown',
          start: 0,
        },
      ],
      words,
    )

    expect(segments).toEqual([{ kind: 'text', text: 'Das Brot' }])
  })

  test('ignores a match that overlaps one already taken', () => {
    const segments = service.toSegments(
      'Das Brot',
      [
        {
          end: 8,
          matchedText: 'Das Brot',
          precision: 'exact',
          slug: 'das-brot',
          start: 0,
        },
        {
          end: 8,
          matchedText: 'Brot',
          precision: 'exact',
          slug: 'das-brot',
          start: 4,
        },
      ],
      words,
    )

    expect(segments).toHaveLength(1)
    expect(segments.map((segment) => segment.text).join('')).toBe('Das Brot')
  })
})
