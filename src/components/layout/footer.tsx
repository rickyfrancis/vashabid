import { useTranslations } from 'next-intl'
import { Link } from '@/features/i18n/navigation'
import { PageContainer } from './page-container'

export function Footer() {
  const navigation = useTranslations('Navigation')
  const shell = useTranslations('Shell')

  return (
    <footer
      className="relative z-10 mt-auto border-t border-border bg-surface/90"
      data-testid="site-footer"
    >
      <PageContainer>
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              aria-label={navigation('home')}
              className="font-display text-2xl font-semibold tracking-tight text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              href="/"
            >
              Vashabid<span className="text-accent-600 dark:text-accent-300">.</span>
            </Link>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              {shell('tagline')}
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {shell('languagePromise')}
          </p>
        </div>
      </PageContainer>
    </footer>
  )
}
