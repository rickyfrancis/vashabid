import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/features/i18n/language-switcher'
import { SupportModeSwitcher } from '@/features/i18n/support-mode-switcher'

export default function HomePage() {
  const t = useTranslations('Home')

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-950/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full bg-accent-100/80 blur-3xl dark:bg-accent-950/20"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
        <a
          className="text-xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50"
          href="#top"
        >
          Vashabid<span className="text-accent-500">.</span>
        </a>
        <span className="rounded-full border border-neutral-200 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600 backdrop-blur dark:border-neutral-800 dark:text-neutral-300">
          {t('targetLanguage')}: <span lang="de">{t('german')}</span>
        </span>
      </header>

      <main
        id="top"
        className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:py-24"
      >
        <section className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">
            {t('eyebrow')}
          </p>
          <h1 className="text-balance text-5xl font-bold leading-[1.04] tracking-[-0.045em] text-neutral-950 sm:text-6xl lg:text-7xl dark:text-neutral-50">
            {t('title')}
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-neutral-600 sm:text-xl dark:text-neutral-300">
            {t('description')}
          </p>
        </section>

        <aside className="rounded-3xl border border-neutral-200/80 bg-background/85 p-6 shadow-lg backdrop-blur sm:p-8 dark:border-neutral-800/80">
          <div className="mb-7 border-b border-neutral-200 pb-6 dark:border-neutral-800">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-950 text-sm font-bold text-white dark:bg-neutral-50 dark:text-neutral-950">
                02
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                {t('foundationTitle')}
              </h2>
            </div>
            <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {t('foundationDescription')}
            </p>
          </div>

          <div className="grid gap-6">
            <LanguageSwitcher />
            <SupportModeSwitcher />
          </div>
        </aside>
      </main>
    </div>
  )
}
