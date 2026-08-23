import { useTranslations } from 'next-intl'

export default function Loading() {
  const t = useTranslations('Common')

  return (
    <div
      aria-label={t('loading')}
      className="flex flex-1 items-center justify-center py-32"
      role="status"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  )
}
