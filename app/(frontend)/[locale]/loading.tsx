import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function Loading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div
        aria-label={t('loading')}
        className="w-full space-y-20 sm:space-y-24"
        role="status"
      >
        <span className="sr-only">{t('loading')}</span>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-end lg:gap-12">
          <div>
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-6 h-16 w-full max-w-2xl sm:h-24" />
            <Skeleton className="mt-5 h-7 w-4/5 max-w-xl" />
          </div>
          <Card className="space-y-5 p-7 shadow-sm">
            <Skeleton className="size-11" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </Card>
        </div>

        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-10 w-72 max-w-full" />
          <Card className="mt-8 space-y-5 p-8 shadow-sm sm:p-10">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-14 w-3/5" />
            <Skeleton className="h-6 w-2/5" />
          </Card>
        </div>

        <div>
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-4 h-10 w-80 max-w-full" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Card className="space-y-5 p-5 shadow-sm" key={index}>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-9 w-3/5" />
                <Skeleton className="h-5 w-4/5" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
