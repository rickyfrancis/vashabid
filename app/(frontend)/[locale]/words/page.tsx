import { redirect } from 'next/navigation'

import type { Locale } from '@/features/i18n/types'
import { WordBrowsePageContent } from '@/features/words/browse-page-content'
import { WordService } from '@/features/words/service'
import type { WordBrowseSearchParams } from '@/features/words/types'

type WordBrowsePageProps = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<WordBrowseSearchParams>
}

export default async function WordBrowsePage({
  params,
  searchParams,
}: WordBrowsePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const result = await new WordService().getBrowsePage(query)

  if (result.kind === 'redirect') {
    const canonicalQuery = new URLSearchParams(result.query).toString()
    redirect(`/${locale}/words${canonicalQuery ? `?${canonicalQuery}` : ''}`)
  }

  return <WordBrowsePageContent browse={result.page} />
}
