import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/features/i18n/types'
import { getWordDetail } from '@/features/words/detail'
import { WordDetailPageContent } from '@/features/words/detail-page-content'
import { createWordDetailMetadata } from '@/features/words/metadata'

type WordDetailPageProps = {
  params: Promise<{ locale: Locale; slug: string }>
}

export async function generateMetadata({
  params,
}: WordDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const [word, t] = await Promise.all([
    getWordDetail(slug),
    getTranslations({ locale, namespace: 'WordDetail' }),
  ])

  if (!word) return {}

  return createWordDetailMetadata(word, locale, t)
}

export default async function WordDetailPage({ params }: WordDetailPageProps) {
  const { slug } = await params
  const word = await getWordDetail(slug)

  if (!word) notFound()

  return <WordDetailPageContent word={word} />
}
