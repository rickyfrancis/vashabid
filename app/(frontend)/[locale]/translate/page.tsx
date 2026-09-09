import { redirect } from 'next/navigation'

import type { Locale } from '@/features/i18n/types'
import { TranslatorService } from '@/features/translator/service'
import { TranslatePageContent } from '@/features/translator/translate-page-content'
import type { TranslateSearchParams } from '@/features/translator/types'

type TranslatePageProps = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<TranslateSearchParams>
}

export default async function TranslatePage({
  params,
  searchParams,
}: TranslatePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const result = await new TranslatorService().getPage(query)

  if (result.kind === 'redirect') {
    const canonicalQuery = new URLSearchParams(result.query).toString()
    redirect(`/${locale}/translate${canonicalQuery ? `?${canonicalQuery}` : ''}`)
  }

  return <TranslatePageContent page={result.page} />
}
