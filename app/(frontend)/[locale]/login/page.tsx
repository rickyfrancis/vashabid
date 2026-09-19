import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { AuthPageContent } from '@/features/auth/auth-page-content'
import { getSession } from '@/features/auth/session.server'
import type { Locale } from '@/features/i18n/types'

type LoginPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth' })

  return { description: t('loginDescription'), title: t('loginTitle') }
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params

  if (await getSession()) redirect(`/${locale}`)

  return <AuthPageContent locale={locale} variant="login" />
}
