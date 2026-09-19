import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { OnboardingPageContent } from '@/features/auth/onboarding-page-content'
import { getSession } from '@/features/auth/session.server'
import type { Locale } from '@/features/i18n/types'

type OnboardingPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: OnboardingPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Onboarding' })

  return { description: t('description'), title: t('title') }
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
  const { locale } = await params
  const session = await getSession()

  // Onboarding writes to the signed-in account, so there is nothing to show and
  // nowhere to write without one.
  if (!session) redirect(`/${locale}/login`)

  return <OnboardingPageContent locale={locale} session={session} />
}
