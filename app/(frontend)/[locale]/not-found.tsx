import { SearchX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout'
import { buttonStyles, ErrorState } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'

export default function NotFoundPage() {
  const errors = useTranslations('Errors')
  const common = useTranslations('Common')

  return (
    <PageContainer className="flex flex-1 items-center py-20" size="narrow">
      <ErrorState
        action={
          <Link className={buttonStyles()} href="/">
            {common('goHome')}
          </Link>
        }
        className="w-full"
        description={errors('notFoundDescription')}
        icon={SearchX}
        title={errors('notFoundTitle')}
      />
    </PageContainer>
  )
}
