import { ArrowDownRight, BookOpenText } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { PageContainer } from '@/components/layout'
import { Badge, Card } from '@/components/ui'
import type { Locale } from '@/features/i18n/types'
import { getPublishedWordPreview } from '@/features/words/preview'

type WordPreviewPageProps = {
  params: Promise<{ locale: Locale; slug: string }>
}

export default async function WordPreviewPage({
  params,
}: WordPreviewPageProps) {
  const { locale, slug } = await params
  const [word, preview] = await Promise.all([
    getPublishedWordPreview(slug),
    getTranslations({ locale, namespace: 'WordPreview' }),
  ])

  if (!word) notFound()

  return (
    <PageContainer className="flex flex-1 items-center py-14 sm:py-20 lg:py-24">
      <article className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch">
        <Card className="relative overflow-hidden border-l-4 border-l-accent-500 p-7 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-14 size-48 rounded-full border border-brand-200/60 bg-brand-50/60 dark:border-brand-800/50 dark:bg-brand-950/30"
          />
          <div className="relative">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
              <span className="h-px w-8 bg-brand-700 dark:bg-brand-300" />
              {preview('eyebrow')}
            </p>
            <h1 className="mt-8 text-balance font-display text-5xl font-semibold leading-none tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
              {word.lemma}
            </h1>
            <div className="mt-7 flex flex-wrap gap-2">
              <Badge tone="brand">{word.wordType}</Badge>
              <Badge tone="accent">{word.cefrLevel}</Badge>
              <Badge tone="success">{preview('publishedStatus')}</Badge>
            </div>
            <p className="mt-9 max-w-2xl text-pretty text-base leading-8 text-muted sm:text-lg">
              {preview('description')}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between bg-surface-muted/70 p-7 sm:p-8">
          <div>
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                <BookOpenText aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <ArrowDownRight
                aria-hidden="true"
                className="text-accent-600 dark:text-accent-300"
                size={26}
                strokeWidth={1.5}
              />
            </div>
            <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight text-foreground">
              {preview('scopeTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {preview('scopeDescription')}
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
            <div>
              <dt className="text-muted">{preview('wordType')}</dt>
              <dd className="mt-1 font-semibold capitalize text-foreground">
                {word.wordType}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{preview('cefrLevel')}</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {word.cefrLevel}
              </dd>
            </div>
          </dl>
        </Card>
      </article>
    </PageContainer>
  )
}
