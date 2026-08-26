import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function WordBrowseLoading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div
        aria-label={t('loading')}
        className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12"
        role="status"
      >
        <span className="sr-only">{t('loading')}</span>
        <div className="lg:col-start-2 lg:row-start-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-5 h-16 w-4/5 max-w-2xl" />
          <Skeleton className="mt-5 h-7 w-3/5 max-w-xl" />
        </div>

        <Card className="space-y-5 border-t-4 border-t-accent-500 p-6 shadow-sm lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
          <Skeleton className="size-10" />
          {Array.from({ length: 3 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>

        <div className="lg:col-start-2 lg:row-start-2">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
      </div>
    </PageContainer>
  )
}
