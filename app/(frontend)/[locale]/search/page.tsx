import { redirect } from 'next/navigation'

import type { Locale } from '@/features/i18n/types'
import { SearchPageContent } from '@/features/search/search-page-content'
import { SearchService } from '@/features/search/service'
import type { SearchParams } from '@/features/search/types'

type SearchPageProps = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<SearchParams>
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const result = await new SearchService().getPage(query)

  if (result.kind === 'redirect') {
    const canonicalQuery = new URLSearchParams(result.query).toString()
    redirect(`/${locale}/search${canonicalQuery ? `?${canonicalQuery}` : ''}`)
  }

  return <SearchPageContent search={result.page} />
}
