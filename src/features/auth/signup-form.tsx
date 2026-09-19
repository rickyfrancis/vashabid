'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

import { Button, Input } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { signup } from './actions'
import { FieldError, FormAlert, Honeypot } from './auth-form-parts'
import { HONEYPOT_FIELD } from './constants'
import type { AuthFieldErrors, SignupFormState } from './types'

const initialState: SignupFormState = { status: 'idle' }

function SubmitButton() {
  const t = useTranslations('Auth')
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full"
      data-testid="signup-submit"
      disabled={pending}
      type="submit"
    >
      {pending ? t('signupSubmitting') : t('signupSubmit')}
    </Button>
  )
}

/**
 * The public signup form.
 *
 * Fields are uncontrolled and echoed back through `values` after a rejection,
 * so a server-side refusal never costs the visitor what they typed. The
 * password is deliberately *not* echoed back — it is re-entered instead.
 */
export function SignupForm() {
  const locale = useLocale()
  const t = useTranslations('Auth')
  const [state, formAction] = useActionState(signup, initialState)
  const baseId = useId()

  const ids = {
    displayName: `${baseId}-display-name`,
    displayNameError: `${baseId}-display-name-error`,
    displayNameHint: `${baseId}-display-name-hint`,
    email: `${baseId}-email`,
    emailError: `${baseId}-email-error`,
    password: `${baseId}-password`,
    passwordError: `${baseId}-password-error`,
    passwordHint: `${baseId}-password-hint`,
  }

  const fieldErrors: AuthFieldErrors =
    state.status === 'invalid' ? state.fieldErrors : {}
  const values = 'values' in state ? state.values : undefined

  return (
    <form action={formAction} className="space-y-5" data-testid="signup-form">
      <input name="locale" type="hidden" value={locale} />
      <Honeypot id={`${baseId}-website`} name={HONEYPOT_FIELD} />

      {state.status === 'rate-limited' ? (
        <FormAlert testId="signup-error">{t('errorRateLimited')}</FormAlert>
      ) : null}

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.displayName}
        >
          {t('displayNameLabel')}
        </label>
        <Input
          aria-describedby={
            fieldErrors.displayName ? ids.displayNameError : ids.displayNameHint
          }
          aria-invalid={fieldErrors.displayName ? true : undefined}
          autoComplete="nickname"
          defaultValue={values?.displayName ?? ''}
          id={ids.displayName}
          name="displayName"
          required
        />
        {fieldErrors.displayName ? (
          <FieldError
            id={ids.displayNameError}
            messageKey={fieldErrors.displayName}
          />
        ) : (
          <p className="mt-2 text-sm text-muted" id={ids.displayNameHint}>
            {t('displayNameHint')}
          </p>
        )}
      </div>

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
          aria-describedby={
            fieldErrors.password ? ids.passwordError : ids.passwordHint
          }
          aria-invalid={fieldErrors.password ? true : undefined}
          autoComplete="new-password"
          id={ids.password}
          name="password"
          required
          type="password"
        />
        {fieldErrors.password ? (
          <FieldError
            id={ids.passwordError}
            messageKey={fieldErrors.password}
          />
        ) : (
          <p className="mt-2 text-sm text-muted" id={ids.passwordHint}>
            {t('passwordHint')}
          </p>
        )}
      </div>

      <SubmitButton />

      <p className="text-sm text-muted">
        {t('haveAccount')}{' '}
        <Link
          className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300"
          href="/login"
        >
          {t('loginLink')}
        </Link>
      </p>
    </form>
  )
}
