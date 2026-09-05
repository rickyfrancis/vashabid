import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getGrammarDetail } from '@/features/grammar/detail'
import { GrammarDetailPageContent } from '@/features/grammar/detail-page-content'
import { createGrammarDetailMetadata } from '@/features/grammar/metadata'
import type { Locale } from '@/features/i18n/types'

type GrammarDetailPageProps = {
  params: Promise<{ locale: Locale; slug: string }>
}

export async function generateMetadata({
  params,
}: GrammarDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const [topic, t] = await Promise.all([
    getGrammarDetail(slug),
    getTranslations({ locale, namespace: 'GrammarDetail' }),
  ])

  if (!topic) return {}

  return createGrammarDetailMetadata(topic, locale, t)
}

export default async function GrammarDetailPage({
  params,
}: GrammarDetailPageProps) {
  const { slug } = await params
  const topic = await getGrammarDetail(slug)

  if (!topic) notFound()

  return <GrammarDetailPageContent topic={topic} />
}
