'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useId, useTransition } from 'react'
import { usePathname, useRouter } from './navigation'
import { locales, type Locale } from './types'

export function LanguageSwitcher() {
  const selectId = useId()
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
    <div className="flex min-w-0 flex-col gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor={selectId}>
        {t('label')}
      </label>
      <select
        aria-busy={isPending}
        className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        id={selectId}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        value={currentLocale}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {t(locale)}
          </option>
        ))}
      </select>
    </div>
  )
}
