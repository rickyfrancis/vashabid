import { useTranslations } from 'next-intl'
import { Link } from '@/features/i18n/navigation'

export default function NotFoundPage() {
  const errors = useTranslations('Errors')
  const common = useTranslations('Common')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-32 text-center">
      <p className="text-7xl font-bold tracking-[-0.06em] text-brand-600">404</p>
      <h1 className="text-3xl font-bold text-neutral-950 dark:text-neutral-50">
        {errors('notFoundTitle')}
      </h1>
      <p className="max-w-md text-neutral-500 dark:text-neutral-400">
        {errors('notFoundDescription')}
      </p>
      <Link
        className="mt-3 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        href="/"
      >
        {common('goHome')}
      </Link>
    </main>
  )
}
