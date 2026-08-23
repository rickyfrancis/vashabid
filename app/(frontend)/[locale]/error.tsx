'use client'

import { useTranslations } from 'next-intl'

export default function ErrorPage({ reset }: { reset: () => void }) {
  const errors = useTranslations('Errors')
  const common = useTranslations('Common')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-error">
        Vashabid
      </p>
      <h1 className="text-3xl font-bold text-neutral-950 dark:text-neutral-50">
        {errors('genericTitle')}
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        {errors('unexpected')}
      </p>
      <button
        className="mt-3 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        onClick={reset}
        type="button"
      >
        {common('retry')}
      </button>
    </main>
  )
}
