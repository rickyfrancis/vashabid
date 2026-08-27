import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function SearchLoading() {
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
          <Card className="space-y-3 border-t-4 border-t-accent-500 p-7 shadow-lg">
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-3">
              <Skeleton className="h-14 flex-1" />
              <Skeleton className="h-14 w-28" />
            </div>
          </Card>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card className="space-y-5 p-5 shadow-sm" key={index}>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-7 w-2/5" />
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
