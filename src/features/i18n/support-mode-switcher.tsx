'use client'

import { useTranslations } from 'next-intl'
import { supportModes, type SupportMode } from './support-mode'
import { useSupportMode } from './support-mode-provider'

export function SupportModeSwitcher() {
  const t = useTranslations('SupportMode')
  const { supportMode, setSupportMode } = useSupportMode()

  return (
    <label className="flex min-w-44 flex-col gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
      <span>{t('label')}</span>
      <select
        className="h-11 rounded-xl border border-neutral-300 bg-background px-3 text-base text-neutral-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:text-neutral-50"
        onChange={(event) => setSupportMode(event.target.value as SupportMode)}
        value={supportMode}
      >
        {supportModes.map((mode) => (
          <option key={mode} value={mode}>
            {t(mode)}
          </option>
        ))}
      </select>
      <span className="max-w-64 text-xs font-normal leading-5 text-neutral-500 dark:text-neutral-400">
        {t('description')}
      </span>
    </label>
  )
}
