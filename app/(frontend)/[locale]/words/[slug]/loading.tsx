import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function WordDetailLoading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-10 sm:py-14 lg:py-18">
      <div aria-label={t('loading')} role="status">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="mb-7 h-11 w-44" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <Card className="space-y-6 border-t-4 border-t-brand-700 p-8 sm:p-10">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-6 w-32" />
          </Card>
          <Card className="space-y-5 border-t-4 border-t-accent-500 p-7">
            <Skeleton className="size-11" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <Skeleton className="h-10 w-56" />
            <Card className="grid gap-4 p-6 sm:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </Card>
          </div>
          <Card className="space-y-4 p-6">
            <Skeleton className="size-10" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
