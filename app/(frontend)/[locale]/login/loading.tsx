import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Card, Skeleton } from '@/components/ui'

export default function LoginLoading() {
  const t = useTranslations('Common')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16" size="narrow">
      <div
        aria-label={t('loading')}
        className="mx-auto max-w-md"
        role="status"
      >
        <span className="sr-only">{t('loading')}</span>
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="mt-4 h-5 w-4/5" />
        <Card className="mt-8 space-y-5 p-6 sm:p-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
      </div>
    </PageContainer>
  )
}
