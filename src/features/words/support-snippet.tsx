'use client'

import { useTranslations } from 'next-intl'

import { useSupportMode } from '@/features/i18n/support-mode-provider'
import { cn } from '@/lib/cn'
import type { LearnerSupportViewModel } from './types'

export function SupportSnippet({
  className,
  support,
}: {
  className?: string
  support: LearnerSupportViewModel
}) {
  const t = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const showBangla = supportMode !== 'en' && support.bangla !== null
  const showEnglish = supportMode !== 'bn' || support.bangla === null

  return (
    <div className={cn('space-y-2 text-sm leading-6 text-muted', className)}>
      {showEnglish ? (
        <p lang="en">
          {supportMode === 'both' ? (
            <span className="mr-2 font-semibold text-foreground">
              {t('englishLabel')}
            </span>
          ) : null}
          {support.english}
        </p>
      ) : null}
      {showBangla ? (
        <p lang="bn">
          {supportMode === 'both' ? (
            <span className="mr-2 font-semibold text-foreground">
              {t('banglaLabel')}
            </span>
          ) : null}
          {support.bangla}
        </p>
      ) : null}
      {supportMode !== 'en' && support.bangla === null ? (
        <p className="text-xs font-medium text-warning" role="note">
          {t('fallbackNotice')}
        </p>
      ) : null}
    </div>
  )
}
