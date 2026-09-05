import { redirect } from 'next/navigation'

import { GrammarBrowsePageContent } from '@/features/grammar/browse-page-content'
import { GrammarService } from '@/features/grammar/service'
import type { GrammarBrowseSearchParams } from '@/features/grammar/types'
import type { Locale } from '@/features/i18n/types'

type GrammarBrowsePageProps = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<GrammarBrowseSearchParams>
}

export default async function GrammarBrowsePage({
  params,
  searchParams,
}: GrammarBrowsePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const result = await new GrammarService().getBrowsePage(query)

  if (result.kind === 'redirect') {
    const canonicalQuery = new URLSearchParams(result.query).toString()
    redirect(`/${locale}/grammar${canonicalQuery ? `?${canonicalQuery}` : ''}`)
  }

  return <GrammarBrowsePageContent browse={result.page} />
}
