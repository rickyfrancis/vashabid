'use client'

import { useTranslations } from 'next-intl'
import { SegmentedControl } from '@/components/ui'
import { supportModes, type SupportMode } from './support-mode'
import { useSupportMode } from './support-mode-provider'

export function SupportModeSwitcher() {
  const t = useTranslations('SupportMode')
  const { supportMode, setSupportMode } = useSupportMode()
  const options = supportModes.map((mode) => ({
    label: t(mode),
    value: mode,
  }))

  return (
    <SegmentedControl<SupportMode>
      description={t('description')}
      label={t('label')}
      onChange={setSupportMode}
      options={options}
      value={supportMode}
    />
  )
}
