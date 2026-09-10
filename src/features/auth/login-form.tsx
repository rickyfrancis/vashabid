'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

import { Button, Input } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { login } from './actions'
import { FieldError, FormAlert } from './auth-form-parts'
import type { AuthFieldErrors, LoginFormState } from './types'

const initialState: LoginFormState = { status: 'idle' }

function SubmitButton() {
  const t = useTranslations('Auth')
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full"
      data-testid="login-submit"
      disabled={pending}
      type="submit"
    >
      {pending ? t('loginSubmitting') : t('loginSubmit')}
    </Button>
  )
}

/**
 * The sign-in form.
 *
 * A failed sign-in reports one message for the pair rather than naming the
 * field that was wrong: a suspended account, a locked account, an unknown email
 * and a bad password all look the same from here, which is what keeps the form
 * from confirming whether an address is registered.
 */
export function LoginForm() {
  const locale = useLocale()
  const t = useTranslations('Auth')
  const [state, formAction] = useActionState(login, initialState)
  const baseId = useId()

  const ids = {
    email: `${baseId}-email`,
    emailError: `${baseId}-email-error`,
    password: `${baseId}-password`,
  }

  const fieldErrors: AuthFieldErrors =
    state.status === 'invalid' ? state.fieldErrors : {}
  const values = 'values' in state ? state.values : undefined

  return (
    <form action={formAction} className="space-y-5" data-testid="login-form">
      <input name="locale" type="hidden" value={locale} />

      {state.status === 'invalid-credentials' ? (
        <FormAlert testId="login-error">
          {t('errorInvalidCredentials')}
        </FormAlert>
      ) : null}

      {state.status === 'rate-limited' ? (
        <FormAlert testId="login-error">{t('errorRateLimited')}</FormAlert>
      ) : null}

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.email}
        >
          {t('emailLabel')}
        </label>
        <Input
          aria-describedby={fieldErrors.email ? ids.emailError : undefined}
          aria-invalid={fieldErrors.email ? true : undefined}
          autoComplete="email"
          defaultValue={values?.email ?? ''}
          id={ids.email}
          name="email"
          required
          type="email"
        />
        {fieldErrors.email ? (
          <FieldError id={ids.emailError} messageKey={fieldErrors.email} />
        ) : null}
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.password}
        >
          {t('passwordLabel')}
        </label>
        <Input
          autoComplete="current-password"
          id={ids.password}
          name="password"
          required
          type="password"
        />
      </div>

      <SubmitButton />

      <p className="text-sm text-muted">
        {t('noAccount')}{' '}
        <Link
          className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300"
          href="/signup"
        >
          {t('signupLink')}
        </Link>
      </p>
    </form>
  )
}
