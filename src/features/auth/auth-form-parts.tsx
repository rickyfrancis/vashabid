'use client'

import { TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { AuthErrorMessageKey } from './validation'

/**
 * Errors arrive from the server as message *keys*, so the wording is chosen
 * here in the reader's language rather than being fixed to English on the
 * server. Shared by the signup, login, and onboarding forms.
 */
export function FieldError({
  id,
  messageKey,
}: {
  id: string
  messageKey: AuthErrorMessageKey
}) {
  const t = useTranslations('Auth')

  return (
    <p className="mt-2 text-sm font-medium text-error" id={id}>
      {t(messageKey)}
    </p>
  )
}

export function FormAlert({
  children,
  testId,
}: {
  children: React.ReactNode
  testId: string
}) {
  return (
    <div
      className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
      data-testid={testId}
      role="alert"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-warning"
        size={18}
      />
      <p className="text-sm leading-6 text-foreground">{children}</p>
    </div>
  )
}

/**
 * Honeypot: off-screen rather than `display: none`, because some bots skip
 * hidden inputs. Removed from the accessibility tree and the tab order so a
 * person never reaches it.
 */
export function Honeypot({ id, name }: { id: string; name: string }) {
  const t = useTranslations('Auth')

  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto">
      <label htmlFor={id}>{t('honeypotLabel')}</label>
      <input
        autoComplete="off"
        defaultValue=""
        id={id}
        name={name}
        tabIndex={-1}
        type="text"
      />
    </div>
  )
}
