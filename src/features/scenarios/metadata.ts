import type { Metadata } from 'next'

import type { Locale } from '@/features/i18n/types'
import { richTextToPlainText } from '@/lib/payload/fields'
import type { ScenarioDetailPageViewModel } from './types'

type MetadataTranslation = (
  key: 'metadataDescription' | 'metadataTitle',
  values: { scenario: string; summary: string },
) => string

const SUMMARY_LENGTH = 150

function summaryFor(
  scenario: ScenarioDetailPageViewModel,
  locale: Locale,
): string {
  const bangla =
    locale === 'bn'
      ? richTextToPlainText(scenario.support.bangla?.explanation)
      : ''
  const english = richTextToPlainText(scenario.support.english.explanation)
  const text = bangla || english || scenario.learnerGoal

  if (text.length <= SUMMARY_LENGTH) return text

  const clipped = text.slice(0, SUMMARY_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

export function createScenarioDetailMetadata(
  scenario: ScenarioDetailPageViewModel,
  locale: Locale,
  translate: MetadataTranslation,
): Metadata {
  const values = {
    scenario: scenario.title,
    summary: summaryFor(scenario, locale),
  }

  return {
    description: translate('metadataDescription', values),
    title: translate('metadataTitle', values),
  }
}
