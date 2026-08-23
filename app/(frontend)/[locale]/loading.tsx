import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function Loading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex flex-1 items-center py-20" size="narrow">
      <div aria-label={t('loading')} className="w-full" role="status">
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-6 h-14 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-7 w-4/5" />
        <Card className="mt-10 space-y-4 p-7 shadow-sm">
          <Skeleton className="size-11" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </Card>
      </div>
    </PageContainer>
  )
}
