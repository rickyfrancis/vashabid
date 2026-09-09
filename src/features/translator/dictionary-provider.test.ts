import type { Word } from '@payload-types'
import { describe, expect, test, vi } from 'vitest'

import { DictionaryTranslatorProvider } from './dictionary-provider'
import { describeTranslatorProviderContract } from './provider-contract'

const word = (overrides: Partial<Word> = {}): Word =>
  ({
    _status: 'published',
    bangla: undefined,
    cefrLevel: 'A1',
    createdAt: '2026-01-01T00:00:00.000Z',
    english: { meanings: [{ meaning: 'bread' }] },
    id: 1,
    lemma: 'das Brot',
    lifecycleStatus: 'active',
    register: 'neutral',
    review: { banglaReviewed: false },
    slug: 'das-brot',
    updatedAt: '2026-01-01T00:00:00.000Z',
    usefulnessScore: 4,
    wordType: 'noun',
    gender: 'das',
    ...overrides,
  }) as Word

const brot = () => word()

const essen = () =>
  word({
    bangla: {
      meanings: [{ meaning: 'খাওয়া' }],
      romanizedHelper: 'khaoa',
    },
    english: { meanings: [{ meaning: 'to eat' }] },
    gender: undefined,
    id: 2,
    lemma: 'essen',
    review: { banglaReviewed: true },
    slug: 'essen',
    wordType: 'verb',
  })

const termin = () =>
  word({
    bangla: { meanings: [{ meaning: 'অ্যাপয়েন্টমেন্ট' }] },
    english: { meanings: [{ meaning: 'appointment' }] },
    gender: 'der',
    id: 3,
    lemma: 'der Termin',
    review: { banglaReviewed: true },
    slug: 'der-termin',
    wordType: 'noun',
  })

function createProvider(words: Word[] = [brot(), essen(), termin()]) {
  const wordRepository = {
    findAllPublishedActive: vi.fn().mockResolvedValue(words),
  }
  return {
    provider: new DictionaryTranslatorProvider(wordRepository),
    wordRepository,
  }
}

describeTranslatorProviderContract('DictionaryTranslatorProvider', () => {
  const wordRepository = {
    findAllPublishedActive: vi.fn().mockResolvedValue([brot(), essen()]),
  }
  return new DictionaryTranslatorProvider(wordRepository)
})

describe('DictionaryTranslatorProvider German matching', () => {
  test('matches a bare lemma', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Wir essen zusammen.',
    })

    expect(outcome.matches).toEqual([
      expect.objectContaining({
        matchedText: 'essen',
        precision: 'exact',
        slug: 'essen',
      }),
    ])
  })

  test('prefers the longer article phrase over the bare noun', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Das Brot ist frisch.',
    })

    expect(outcome.matches).toEqual([
      expect.objectContaining({ matchedText: 'Das Brot', slug: 'das-brot' }),
    ])
  })

  test('matches a noun without its article', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Ich kaufe Brot.',
    })

    expect(outcome.matches).toMatchObject([
      { matchedText: 'Brot', slug: 'das-brot' },
    ])
  })

  test('matches through trailing punctuation', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Ich habe einen Termin.',
    })

    expect(outcome.matches).toMatchObject([{ slug: 'der-termin' }])
  })

  test('folds an inflected verb and labels it as inflected', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Ich esse Brot',
    })

    expect(outcome.matches).toMatchObject([
      { matchedText: 'esse', precision: 'inflected', slug: 'essen' },
      { matchedText: 'Brot', precision: 'exact', slug: 'das-brot' },
    ])
  })

  test('folding never invents a word that is not a known lemma', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Ich schwimme gern',
    })

    expect(outcome.matches).toEqual([])
  })

  test('matches umlaut and sharp-s spellings a learner might type', async () => {
    const kaese = word({
      english: { meanings: [{ meaning: 'cheese' }] },
      id: 9,
      lemma: 'der Käse',
      gender: 'der',
      slug: 'der-kaese',
      wordType: 'noun',
    })
    const { provider } = createProvider([kaese])

    for (const text of ['Käse', 'Kaese', 'Kase']) {
      const outcome = await provider.translate({ direction: 'de-en', text })
      expect(outcome.matches).toMatchObject([{ slug: 'der-kaese' }])
    }
  })

  test('never produces a translated sentence', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'de-en',
      text: 'Das Brot ist frisch.',
    })

    expect(outcome.kind).toBe('dictionary')
    expect(outcome.translation).toBeNull()
  })

  test('skips the vocabulary query entirely when there is nothing to match', async () => {
    const { provider, wordRepository } = createProvider()

    await provider.translate({ direction: 'de-en', text: '   ' })
    expect(wordRepository.findAllPublishedActive).not.toHaveBeenCalled()
  })
})

describe('DictionaryTranslatorProvider reverse directions', () => {
  test('finds a German word from its English meaning', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'en-de',
      text: 'bread and appointment',
    })

    expect(outcome.matches.map((match) => match.slug)).toEqual([
      'das-brot',
      'der-termin',
    ])
  })

  test('finds a German word from an approved Bangla meaning', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'bn-de',
      text: 'খাওয়া',
    })

    expect(outcome.matches).toMatchObject([{ slug: 'essen' }])
  })

  test('finds a German word from an approved romanized Bangla helper', async () => {
    const { provider } = createProvider()
    const outcome = await provider.translate({
      direction: 'bn-de',
      text: 'khaoa',
    })

    expect(outcome.matches).toMatchObject([{ slug: 'essen' }])
  })

  test('never surfaces a word through unapproved Bangla', async () => {
    const pending = word({
      bangla: { meanings: [{ meaning: 'রুটি' }], romanizedHelper: 'ruti' },
      review: { banglaReviewed: false },
    })
    const { provider } = createProvider([pending])

    for (const text of ['রুটি', 'ruti']) {
      const outcome = await provider.translate({ direction: 'bn-de', text })
      expect(outcome.matches).toEqual([])
    }
  })

  test('does not fold English or Bangla input through German rules', async () => {
    const { provider } = createProvider()
    // 'breads' must not fold to 'bread'; folding is a German-only affordance.
    const outcome = await provider.translate({
      direction: 'en-de',
      text: 'breads',
    })

    expect(outcome.matches).toEqual([])
  })
})
