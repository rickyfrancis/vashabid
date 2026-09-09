import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function TranslateLoading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div
        aria-label={t('loading')}
        className="mx-auto max-w-6xl"
        role="status"
      >
        <span className="sr-only">{t('loading')}</span>
        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1.2fr)] lg:items-end lg:gap-14">
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-5 h-16 w-4/5 max-w-2xl" />
            <Skeleton className="mt-5 h-7 w-3/5 max-w-xl" />
          </div>
          <Card className="space-y-4 border-t-4 border-t-accent-500 p-7 shadow-lg">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
            <Skeleton className="h-14 w-full" />
          </Card>
        </div>
        <Card className="mt-10 space-y-4 p-8">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-4/5" />
        </Card>
      </div>
    </PageContainer>
  )
}
