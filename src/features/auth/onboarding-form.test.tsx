import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import { render, screen } from '@/test/render'
import type { OnboardingFormState } from './types'

const { submitOnboarding } = vi.hoisted(() => ({ submitOnboarding: vi.fn() }))

vi.mock('./actions', () => ({ submitOnboarding }))

const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: 'idle' } as OnboardingFormState },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  }
})

import { OnboardingForm } from './onboarding-form'

function renderForm({
  defaults,
  locale = 'en',
  state = { status: 'idle' } as OnboardingFormState,
}: {
  defaults?: Parameters<typeof OnboardingForm>[0]['defaults']
  locale?: 'bn' | 'en'
  state?: OnboardingFormState
} = {}) {
  actionState.current = state

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'bn' ? bnMessages : enMessages}
    >
      <OnboardingForm defaults={defaults} />
    </NextIntlClientProvider>,
  )
}

describe('OnboardingForm', () => {
  test('asks all six questions', () => {
    renderForm()

    expect(
      screen.getByRole('group', { name: 'Explain things to me in' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Also show a second language' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Your German level right now' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Why are you learning German?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {
        name: 'What would you like to practise most?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {
        name: 'How long do you want to study each day?',
      }),
    ).toBeInTheDocument()
  })

  test('offers every CEFR level as a real radio group', () => {
    renderForm()

    const levels = screen.getAllByRole('radio', { name: /^[ABC][12]$/ })

    expect(levels).toHaveLength(6)
  })

  test('lets the second language be declined', () => {
    renderForm()

    // The default is "just one language", so a learner who wants one is not
    // pushed into `both`.
    const none = screen.getByRole('radio', { name: 'Just one language' })

    expect(none).toBeChecked()
  })

  test('defaults the first language to the interface language', () => {
    renderForm({ locale: 'bn' })

    const group = screen.getByRole('group', { name: 'আমাকে ব্যাখ্যা করুন' })
    const bangla = screen.getAllByRole('radio', { name: 'বাংলা' })

    expect(group).toBeInTheDocument()
    expect(bangla.some((radio) => (radio as HTMLInputElement).checked)).toBe(
      true,
    )
  })

  test('restores existing answers so revisiting edits rather than restarts', () => {
    renderForm({
      defaults: {
        germanLevel: 'B2',
        primarySupportLanguage: 'en',
        secondarySupportLanguage: 'bn',
      },
    })

    expect(screen.getByRole('radio', { name: 'B2' })).toBeChecked()
  })

  test('posts every answer under the name the schema expects', () => {
    const { container } = renderForm()

    for (const name of [
      'primarySupportLanguage',
      'secondarySupportLanguage',
      'germanLevel',
      'learningGoal',
      'practiceStyle',
      'dailyStudyTarget',
      'locale',
    ]) {
      expect(container.querySelector(`[name="${name}"]`)).not.toBeNull()
    }
  })

  test('shows the duplicate-language error against that question', () => {
    renderForm({
      state: {
        fieldErrors: {
          secondarySupportLanguage: 'errorSecondaryLanguageDuplicate',
        },
        status: 'invalid',
      },
    })

    expect(
      screen.getByText(
        'Choose a different second language, or leave it blank.',
      ),
    ).toBeInTheDocument()
  })

  test('tells an expired session to sign in again', () => {
    renderForm({ state: { status: 'unauthenticated' } })

    expect(screen.getByTestId('onboarding-error')).toHaveAttribute(
      'role',
      'alert',
    )
  })

  test('renders the whole form in Bangla', () => {
    renderForm({ locale: 'bn' })

    expect(screen.getByText('আপনি কেন জার্মান শিখছেন?')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'ভ্রমণ' })).toBeInTheDocument()
  })
})
