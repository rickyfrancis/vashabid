import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { AuthPageContent } from '@/features/auth/auth-page-content'
import { getSession } from '@/features/auth/session.server'
import type { Locale } from '@/features/i18n/types'

type SignupPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: SignupPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth' })

  return { description: t('signupDescription'), title: t('signupTitle') }
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params

  // Route protection lives here rather than in `proxy.ts`: the proxy is
  // deliberately just locale routing, and verifying a Payload token in that
  // context is awkward when the page can simply ask.
  if (await getSession()) redirect(`/${locale}`)

  return <AuthPageContent locale={locale} variant="signup" />
}
