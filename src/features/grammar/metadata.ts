import type { Metadata } from 'next'

import type { Locale } from '@/features/i18n/types'
import { richTextToPlainText } from '@/lib/payload/fields'
import type { GrammarDetailPageViewModel } from './types'

type MetadataTranslation = (
  key: 'metadataDescription' | 'metadataTitle',
  values: { summary: string; topic: string },
) => string

const SUMMARY_LENGTH = 150

function summaryFor(
  topic: GrammarDetailPageViewModel,
  locale: Locale,
): string {
  const bangla =
    locale === 'bn'
      ? richTextToPlainText(topic.support.bangla?.explanation)
      : ''
  const english = richTextToPlainText(topic.support.english.explanation)
  const text = bangla || english || topic.shortRule

  if (text.length <= SUMMARY_LENGTH) return text

  const clipped = text.slice(0, SUMMARY_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

export function createGrammarDetailMetadata(
  topic: GrammarDetailPageViewModel,
  locale: Locale,
  translate: MetadataTranslation,
): Metadata {
  const values = { summary: summaryFor(topic, locale), topic: topic.name }

  return {
    description: translate('metadataDescription', values),
    title: translate('metadataTitle', values),
  }
}
