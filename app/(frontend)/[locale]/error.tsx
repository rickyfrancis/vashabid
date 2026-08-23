'use client'

import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout'
import { Button, ErrorState } from '@/components/ui'

export default function ErrorPage({ reset }: { reset: () => void }) {
  const errors = useTranslations('Errors')
  const common = useTranslations('Common')

  return (
    <PageContainer className="flex flex-1 items-center py-20" size="narrow">
      <ErrorState
        action={<Button onClick={reset}>{common('retry')}</Button>}
        className="w-full"
        description={errors('unexpected')}
        title={errors('genericTitle')}
      />
    </PageContainer>
  )
}
