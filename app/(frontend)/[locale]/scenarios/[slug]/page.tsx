import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/features/i18n/types'
import { getScenarioDetail } from '@/features/scenarios/detail'
import { ScenarioDetailPageContent } from '@/features/scenarios/detail-page-content'
import { createScenarioDetailMetadata } from '@/features/scenarios/metadata'

type ScenarioDetailPageProps = {
  params: Promise<{ locale: Locale; slug: string }>
}

export async function generateMetadata({
  params,
}: ScenarioDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const [scenario, t] = await Promise.all([
    getScenarioDetail(slug),
    getTranslations({ locale, namespace: 'ScenarioDetail' }),
  ])

  if (!scenario) return {}

  return createScenarioDetailMetadata(scenario, locale, t)
}

export default async function ScenarioDetailPage({
  params,
}: ScenarioDetailPageProps) {
  const { slug } = await params
  const scenario = await getScenarioDetail(slug)

  if (!scenario) notFound()

  return <ScenarioDetailPageContent scenario={scenario} />
}
