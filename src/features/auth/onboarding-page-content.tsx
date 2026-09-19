import { getTranslations } from 'next-intl/server'

import { PageContainer } from '@/components/layout'
import { Card } from '@/components/ui'
import type { Locale } from '@/features/i18n/types'
import { OnboardingForm } from './onboarding-form'
import type { Session } from './types'

export async function OnboardingPageContent({
  locale,
  session,
}: {
  locale: Locale
  session: Session
}) {
  const t = await getTranslations({ locale, namespace: 'Onboarding' })

  return (
    <PageContainer className="flex-1 py-12 sm:py-16" size="narrow">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          {t('description')}
        </p>

        <Card className="mt-8 p-6 sm:p-8">
          {/*
            Existing answers are passed back in so a learner revisiting
            onboarding edits their profile rather than starting over.
          */}
          <OnboardingForm
            defaults={{
              germanLevel: session.profile?.germanLevel,
              primarySupportLanguage: session.profile?.primarySupportLanguage,
              secondarySupportLanguage:
                session.profile?.secondarySupportLanguage,
            }}
          />
        </Card>
      </div>
    </PageContainer>
  )
}
