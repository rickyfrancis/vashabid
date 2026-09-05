import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function GrammarDetailLoading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div aria-label={t('loading')} role="status">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-5 w-40" />

        <div className="mt-8 border-b border-border pb-8">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-5 h-16 w-4/5 max-w-3xl" />
          <Skeleton className="mt-6 h-8 w-3/5 max-w-2xl" />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
          <div className="min-w-0 space-y-8">
            <Skeleton className="h-9 w-56" />
            <Card className="space-y-3 p-6">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="h-5 w-full" key={index} />
              ))}
            </Card>
            <Skeleton className="h-9 w-48" />
            {Array.from({ length: 2 }, (_, index) => (
              <Card className="space-y-3 p-6" key={index}>
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
              </Card>
            ))}
          </div>

          <Card className="space-y-4 p-6 lg:self-start">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-11 w-full" />
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
