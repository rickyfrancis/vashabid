import { redirect } from 'next/navigation'

import type { Locale } from '@/features/i18n/types'
import { ScenarioBrowsePageContent } from '@/features/scenarios/browse-page-content'
import { ScenarioService } from '@/features/scenarios/service'
import type { ScenarioBrowseSearchParams } from '@/features/scenarios/types'

type ScenarioBrowsePageProps = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<ScenarioBrowseSearchParams>
}

export default async function ScenarioBrowsePage({
  params,
  searchParams,
}: ScenarioBrowsePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const result = await new ScenarioService().getBrowsePage(query)

  if (result.kind === 'redirect') {
    const canonicalQuery = new URLSearchParams(result.query).toString()
    redirect(
      `/${locale}/scenarios${canonicalQuery ? `?${canonicalQuery}` : ''}`,
    )
  }

  return <ScenarioBrowsePageContent browse={result.page} />
}
