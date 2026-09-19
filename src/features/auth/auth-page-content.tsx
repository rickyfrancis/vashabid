import { getTranslations } from 'next-intl/server'

import { PageContainer } from '@/components/layout'
import { Card } from '@/components/ui'
import type { Locale } from '@/features/i18n/types'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

/**
 * The shared frame for signup and login.
 *
 * Both are single-purpose pages with one short form, so they use the narrow
 * container the error and not-found pages already use rather than the standard
 * content width.
 */
export async function AuthPageContent({
  locale,
  variant,
}: {
  locale: Locale
  variant: 'login' | 'signup'
}) {
  const t = await getTranslations({ locale, namespace: 'Auth' })

  return (
    <PageContainer className="flex-1 py-12 sm:py-16" size="narrow">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {variant === 'signup' ? t('signupTitle') : t('loginTitle')}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {variant === 'signup'
            ? t('signupDescription')
            : t('loginDescription')}
        </p>

        <Card className="mt-8 p-6 sm:p-8">
          {variant === 'signup' ? <SignupForm /> : <LoginForm />}
        </Card>
      </div>
    </PageContainer>
  )
}
