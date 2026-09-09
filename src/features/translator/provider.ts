import type { TranslationDirection } from './constants'

/**
 * The seam a real translation API will slot into (Phase 24) without the service
 * or the UI changing shape.
 */

export interface TranslationRequest {
  direction: TranslationDirection
  text: string
}

/**
 * One known word a provider recognized in the input, identified by slug so the
 * service can hydrate a UI-safe view model. Providers never return Payload
 * documents or database identifiers.
 */
export interface TranslationMatch {
  /** Character offsets into the request text, so the UI can annotate in place. */
  end: number
  /** The exact input substring that matched, preserved for display. */
  matchedText: string
  /**
   * How the match was reached. `exact` matched a stored form directly;
   * `inflected` matched only after conservative suffix folding, so the UI can
   * present it with less certainty.
   */
  precision: 'exact' | 'inflected'
  slug: string
  start: number
}

export interface TranslationOutcome {
  /**
   * `dictionary` means word-by-word lookup only — no sentence was translated.
   * `machine` means a real translation engine produced `translation`.
   */
  kind: 'dictionary' | 'machine'
  matches: TranslationMatch[]
  /** Stable provider identifier, used for attribution and debugging. */
  providerId: string
  /**
   * The translated sentence, or `null` when the provider cannot produce one.
   * A dictionary provider must always return `null` here: it is what stops the
   * UI from ever presenting a lookup as a finished translation.
   */
  translation: string | null
}

export interface TranslatorProvider {
  readonly id: string
  supports(direction: TranslationDirection): boolean
  translate(request: TranslationRequest): Promise<TranslationOutcome>
}
