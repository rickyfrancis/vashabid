import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import { render, screen } from '@/test/render'
import type { FeedbackFormState } from './types'

const { submitFeedback } = vi.hoisted(() => ({ submitFeedback: vi.fn() }))

vi.mock('./actions', () => ({ submitFeedback }))

/**
 * `useActionState` only surfaces a result after a real submission, which jsdom
 * cannot drive end to end. Stubbing it lets each state be rendered directly,
 * which is what these tests are about; the action itself is covered by the
 * service and hook suites, and the round trip by the Playwright spec.
 */
const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: 'idle' } as FeedbackFormState },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  }
})

import { FeedbackForm } from './feedback-form'

function renderForm({
  locale = 'en',
  state = { status: 'idle' } as FeedbackFormState,
}: { locale?: 'bn' | 'en'; state?: FeedbackFormState } = {}) {
  actionState.current = state

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'bn' ? bnMessages : enMessages}
    >
      <FeedbackForm contentType="word" slug="das-brot" />
    </NextIntlClientProvider>,
  )
}

describe('FeedbackForm', () => {
  beforeEach(() => {
    submitFeedback.mockReset()
    actionState.current = { status: 'idle' }
  })

  test('renders the reporting fields', () => {
    renderForm()

    expect(
      screen.getByRole('combobox', { name: 'What kind of problem is it?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'What went wrong?' }),
    ).toBeRequired()
    expect(
      screen.getByRole('textbox', { name: 'Email (optional)' }),
    ).not.toBeRequired()
    expect(screen.getByTestId('feedback-submit')).toBeEnabled()
  })

  test('offers every documented problem type', () => {
    renderForm()

    expect(screen.getAllByRole('option')).toHaveLength(9)
    expect(
      screen.getByRole('option', { name: 'The CEFR level looks wrong' }),
    ).toBeInTheDocument()
  })

  test('carries the reported entry in hidden inputs', () => {
    const { container } = renderForm()

    expect(container.querySelector('input[name="contentType"]')).toHaveValue('word')
    expect(container.querySelector('input[name="slug"]')).toHaveValue('das-brot')
    expect(container.querySelector('input[name="locale"]')).toHaveValue('en')
  })

  test('opens without JavaScript through a native disclosure', () => {
    const { container } = renderForm()

    expect(container.querySelector('details')).toBeInTheDocument()
    expect(container.querySelector('summary')).toHaveTextContent(
      'Report a problem with this entry',
    )
  })

  test('keeps the honeypot out of the accessibility tree and the tab order', () => {
    const { container } = renderForm()

    const honeypot = container.querySelector('input[name="website"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(
      screen.queryByRole('textbox', { name: 'Website' }),
    ).not.toBeInTheDocument()
  })

  test('marks an invalid field and links its message', () => {
    renderForm({
      state: {
        fieldErrors: { message: 'errorMessageTooShort' },
        status: 'invalid',
        values: { email: '', feedbackType: 'wrong-cefr', message: 'short' },
      },
    })

    const field = screen.getByRole('textbox', { name: 'What went wrong?' })
    expect(field).toBeInvalid()
    expect(field).toHaveAccessibleDescription(
      'Describe the problem in a little more detail.',
    )
  })

  test('keeps what was typed when a submission is rejected', () => {
    renderForm({
      state: {
        fieldErrors: { email: 'errorEmailInvalid' },
        status: 'invalid',
        values: {
          email: 'nope',
          feedbackType: 'missing-audio',
          message: 'The audio never plays for this word.',
        },
      },
    })

    expect(screen.getByRole('textbox', { name: 'What went wrong?' })).toHaveValue(
      'The audio never plays for this word.',
    )
    expect(screen.getByRole('combobox')).toHaveValue('missing-audio')
    expect(screen.getByRole('textbox', { name: 'Email (optional)' })).toHaveValue(
      'nope',
    )
  })

  test('describes the email field with a privacy hint until it errors', () => {
    renderForm()
    expect(
      screen.getByRole('textbox', { name: 'Email (optional)' }),
    ).toHaveAccessibleDescription(/never shown publicly/)

    renderForm({
      state: {
        fieldErrors: { email: 'errorEmailInvalid' },
        status: 'invalid',
        values: { email: 'nope', feedbackType: 'other', message: 'x' },
      },
    })
    expect(
      screen.getAllByRole('textbox', { name: 'Email (optional)' })[1],
    ).toHaveAccessibleDescription(/valid email address/)
  })

  test('announces success and removes the form', () => {
    renderForm({ state: { status: 'success' } })

    expect(screen.getByTestId('feedback-success')).toHaveTextContent(
      'Thank you — your report was sent',
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByTestId('feedback-form')).not.toBeInTheDocument()
  })

  test.each([
    ['rate-limited', /a lot of reports in a short time/],
    ['unknown-target', /could not be found/],
  ] as const)('announces the %s outcome as an alert', (status, expected) => {
    renderForm({
      state: {
        status,
        values: { email: '', feedbackType: 'other', message: 'x' },
      },
    })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(expected)
    // The form stays available so the reporter can try again.
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
  })

  test('renders in Bangla with the Bangla locale carried through', () => {
    const { container } = renderForm({ locale: 'bn' })

    expect(container.querySelector('summary')).toHaveTextContent(
      'এই এন্ট্রি নিয়ে সমস্যা জানান',
    )
    expect(container.querySelector('input[name="locale"]')).toHaveValue('bn')
    expect(
      screen.getByRole('option', { name: 'CEFR স্তরটি ভুল মনে হচ্ছে' }),
    ).toBeInTheDocument()
  })

  test('shows a Bangla validation message for a Bangla reader', () => {
    renderForm({
      locale: 'bn',
      state: {
        fieldErrors: { message: 'errorMessageTooShort' },
        status: 'invalid',
        values: { email: '', feedbackType: 'other', message: 'x' },
      },
    })

    expect(screen.getByText('সমস্যাটি আর একটু বিস্তারিতভাবে লিখুন।')).toBeInTheDocument()
  })
})
