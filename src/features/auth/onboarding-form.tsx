'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Button, SegmentedControl, Select } from '@/components/ui'
import { cefrLevels } from '@/lib/payload/fields'
import { submitOnboarding } from './actions'
import { FieldError, FormAlert } from './auth-form-parts'
import {
  dailyStudyTargets,
  learningGoals,
  practiceStyles,
  supportLanguages,
  type SupportLanguage,
} from './constants'
import type { AuthFieldErrors, OnboardingFormState } from './types'

const initialState: OnboardingFormState = { status: 'idle' }

/** The empty option for "no second language", posted as an empty string. */
const NO_SECONDARY = ''

function SubmitButton() {
  const t = useTranslations('Onboarding')
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full sm:w-auto"
      data-testid="onboarding-submit"
      disabled={pending}
      type="submit"
    >
      {pending ? t('submitting') : t('submit')}
    </Button>
  )
}

/**
 * Asks the six onboarding questions and writes them across the account and the
 * learner profile.
 *
 * The two language questions are asked the way a learner thinks about them —
 * a first language and an optional second — rather than as the three-valued
 * `supportMode` the rest of the app reads. `deriveSupportMode` does that
 * translation on the server, so the wording here never has to explain "both".
 */
export function OnboardingForm({
  defaults,
}: {
  defaults?: {
    germanLevel?: string
    primarySupportLanguage?: SupportLanguage
    secondarySupportLanguage?: SupportLanguage | null
  }
}) {
  const locale = useLocale()
  const t = useTranslations('Onboarding')
  const [state, formAction] = useActionState(submitOnboarding, initialState)
  const baseId = useId()

  const [primary, setPrimary] = useState<SupportLanguage>(
    defaults?.primarySupportLanguage ?? (locale as SupportLanguage),
  )
  const [secondary, setSecondary] = useState<string>(
    defaults?.secondarySupportLanguage ?? NO_SECONDARY,
  )
  const [level, setLevel] = useState<string>(defaults?.germanLevel ?? 'A1')

  const fieldErrors: AuthFieldErrors =
    state.status === 'invalid' ? state.fieldErrors : {}

  const languageOptions = supportLanguages.map((value) => ({
    label: t(`language_${value}`),
    value,
  }))

  const ids = {
    goal: `${baseId}-goal`,
    secondaryError: `${baseId}-secondary-error`,
    style: `${baseId}-style`,
    target: `${baseId}-target`,
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
      data-testid="onboarding-form"
    >
      <input name="locale" type="hidden" value={locale} />

      {state.status === 'unauthenticated' ? (
        <FormAlert testId="onboarding-error">
          {t('errorUnauthenticated')}
        </FormAlert>
      ) : null}

      <SegmentedControl<SupportLanguage>
        description={t('primaryLanguageDescription')}
        label={t('primaryLanguageLabel')}
        name="primarySupportLanguage"
        onChange={setPrimary}
        options={languageOptions}
        value={primary}
      />

      <div>
        <SegmentedControl
          description={t('secondaryLanguageDescription')}
          label={t('secondaryLanguageLabel')}
          name="secondarySupportLanguage"
          onChange={setSecondary}
          options={[
            { label: t('secondaryNone'), value: NO_SECONDARY },
            ...languageOptions,
          ]}
          value={secondary}
        />
        {fieldErrors.secondarySupportLanguage ? (
          <FieldError
            id={ids.secondaryError}
            messageKey={fieldErrors.secondarySupportLanguage}
          />
        ) : null}
      </div>

      <SegmentedControl
        description={t('levelDescription')}
        label={t('levelLabel')}
        name="germanLevel"
        onChange={setLevel}
        options={cefrLevels.map((value) => ({ label: value, value }))}
        value={level}
      />

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.goal}
        >
          {t('goalLabel')}
        </label>
        <Select defaultValue="travel" id={ids.goal} name="learningGoal" required>
          {learningGoals.map((value) => (
            <option key={value} value={value}>
              {t(`goal_${value}`)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.style}
        >
          {t('styleLabel')}
        </label>
        <Select
          defaultValue="mixed"
          id={ids.style}
          name="practiceStyle"
          required
        >
          {practiceStyles.map((value) => (
            <option key={value} value={value}>
              {t(`style_${value}`)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-foreground"
          htmlFor={ids.target}
        >
          {t('targetLabel')}
        </label>
        <Select
          defaultValue="10"
          id={ids.target}
          name="dailyStudyTarget"
          required
        >
          {dailyStudyTargets.map((value) => (
            <option key={value} value={value}>
              {t(`target_${value}`)}
            </option>
          ))}
        </Select>
      </div>

      <SubmitButton />
    </form>
  )
}
