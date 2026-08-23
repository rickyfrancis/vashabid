'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { usePathname, useRouter } from './navigation'
import { locales, type Locale } from './types'

export function LanguageSwitcher() {
  const currentLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('Languages')
  const [isPending, startTransition] = useTransition()

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === currentLocale) return

    const query = searchParams.toString()
    const hash = window.location.hash
    const href = `${pathname}${query ? `?${query}` : ''}${hash}`

    startTransition(() => {
      router.replace(href, { locale: nextLocale })
    })
  }

  return (
    <label className="flex min-w-44 flex-col gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
      <span>{t('label')}</span>
      <select
        aria-busy={isPending}
        className="h-11 rounded-xl border border-neutral-300 bg-background px-3 text-base text-neutral-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-50"
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        value={currentLocale}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
    </label>
  )
}
