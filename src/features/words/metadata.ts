import type { Metadata } from 'next'

import type { Locale } from '@/features/i18n/types'
import type { WordDetailPageViewModel } from './types'

type MetadataTranslation = (
  key: 'metadataDescription' | 'metadataTitle',
  values: { meaning: string; word: string },
) => string

export function createWordDetailMetadata(
  word: WordDetailPageViewModel,
  locale: Locale,
  translate: MetadataTranslation,
): Metadata {
  const meaning =
    locale === 'bn'
      ? (word.support.bangla?.meanings[0] ?? word.support.english.meanings[0])
      : word.support.english.meanings[0]
  const values = { meaning, word: word.lemma }

  return {
    description: translate('metadataDescription', values),
    title: translate('metadataTitle', values),
  }
}
