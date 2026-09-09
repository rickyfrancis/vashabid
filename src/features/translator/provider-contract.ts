import { expect, describe, test } from 'vitest'

import { translationDirections } from './constants'
import type { TranslatorProvider } from './provider'

/**
 * The behaviour every `TranslatorProvider` must exhibit, whatever it is backed
 * by. Phase 24's real API provider runs this same suite, so the service and UI
 * can rely on these guarantees without knowing which provider is installed.
 *
 * Pass a factory rather than an instance so each assertion gets a clean
 * provider.
 */
export function describeTranslatorProviderContract(
  name: string,
  createProvider: () => TranslatorProvider,
): void {
  describe(`${name} satisfies the TranslatorProvider contract`, () => {
    test('exposes a non-empty stable id', () => {
      const provider = createProvider()

      expect(provider.id).toBeTruthy()
      expect(provider.id).toBe(createProvider().id)
    })

    test('answers supports() for every declared direction', () => {
      const provider = createProvider()

      for (const direction of translationDirections) {
        expect(typeof provider.supports(direction)).toBe('boolean')
      }
    })

    test('supports at least one direction', () => {
      const provider = createProvider()

      expect(
        translationDirections.some((direction) =>
          provider.supports(direction),
        ),
      ).toBe(true)
    })

    test('returns a well-formed outcome for every supported direction', async () => {
      const provider = createProvider()

      for (const direction of translationDirections) {
        if (!provider.supports(direction)) continue

        const outcome = await provider.translate({
          direction,
          text: 'Das Brot ist frisch.',
        })

        expect(outcome.providerId).toBe(provider.id)
        expect(['dictionary', 'machine']).toContain(outcome.kind)
        expect(Array.isArray(outcome.matches)).toBe(true)
      }
    })

    test('a dictionary outcome never claims a translated sentence', async () => {
      const outcome = await createProvider().translate({
        direction: 'de-en',
        text: 'Das Brot ist frisch.',
      })

      if (outcome.kind === 'dictionary') {
        expect(outcome.translation).toBeNull()
      }
    })

    test('reports matches as valid, non-overlapping spans of the input', async () => {
      const text = 'Das Brot ist frisch.'
      const outcome = await createProvider().translate({
        direction: 'de-en',
        text,
      })

      let previousEnd = -1
      for (const match of outcome.matches) {
        expect(match.start).toBeGreaterThanOrEqual(0)
        expect(match.end).toBeGreaterThan(match.start)
        expect(match.end).toBeLessThanOrEqual(text.length)
        expect(text.slice(match.start, match.end)).toBe(match.matchedText)
        expect(match.slug).toBeTruthy()
        expect(['exact', 'inflected']).toContain(match.precision)
        // Spans must be ordered and disjoint so the UI can render them inline.
        expect(match.start).toBeGreaterThanOrEqual(previousEnd)
        previousEnd = match.end
      }
    })

    test('handles empty and punctuation-only input without matches', async () => {
      const provider = createProvider()

      for (const text of ['', '   ', '!?...']) {
        const outcome = await provider.translate({ direction: 'de-en', text })
        expect(outcome.matches).toEqual([])
      }
    })

    test('never returns a Payload document or database identifier', async () => {
      const outcome = await createProvider().translate({
        direction: 'de-en',
        text: 'Das Brot ist frisch.',
      })

      for (const match of outcome.matches) {
        expect(match).not.toHaveProperty('id')
        expect(match).not.toHaveProperty('review')
        expect(match).not.toHaveProperty('source')
      }
    })
  })
}
