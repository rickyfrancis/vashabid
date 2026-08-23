import { BookMarked } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/features/i18n/language-switcher'
import { Link } from '@/features/i18n/navigation'
import { SupportModeSwitcher } from '@/features/i18n/support-mode-switcher'
import { Badge } from '../ui'
import { PageContainer } from './page-container'

export function Header() {
  const home = useTranslations('Home')
  const navigation = useTranslations('Navigation')

  return (
    <header
      className="relative z-20 border-b border-border bg-surface/95 shadow-sm backdrop-blur"
      data-testid="site-header"
    >
      <PageContainer>
        <div className="grid gap-5 py-5 lg:grid-cols-[minmax(12rem,0.65fr)_minmax(32rem,1.35fr)] lg:items-end lg:gap-10 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link
              aria-label={navigation('home')}
              className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
              href="/"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-800 text-white shadow-sm transition group-hover:-rotate-2 dark:bg-brand-300 dark:text-brand-950">
                <BookMarked aria-hidden="true" size={20} strokeWidth={1.8} />
              </span>
              <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
                Vashabid<span className="text-accent-600 dark:text-accent-300">.</span>
              </span>
            </Link>
            <Badge className="gap-1 lg:mt-3" tone="accent">
              {home('targetLanguage')}:
              <span lang="de">{home('german')}</span>
            </Badge>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-[minmax(12rem,0.7fr)_minmax(20rem,1.3fr)] sm:items-start lg:border-l lg:border-t-0 lg:pb-0 lg:pl-8 lg:pt-0">
            <LanguageSwitcher />
            <SupportModeSwitcher />
          </div>
        </div>
      </PageContainer>
    </header>
  )
}
