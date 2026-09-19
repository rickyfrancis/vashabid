import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import { render, screen } from '@/test/render'
import { HONEYPOT_FIELD } from './constants'
import type { SignupFormState } from './types'

const { signup } = vi.hoisted(() => ({ signup: vi.fn() }))

vi.mock('./actions', () => ({ signup }))

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

/**
 * `useActionState` only surfaces a result after a real submission, which jsdom
 * cannot drive end to end. Stubbing it lets each state be rendered directly;
 * the round trip is covered by the Playwright spec.
 */
const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: 'idle' } as SignupFormState },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  }
})

import { SignupForm } from './signup-form'

function renderForm({
  locale = 'en',
  state = { status: 'idle' } as SignupFormState,
}: { locale?: 'bn' | 'en'; state?: SignupFormState } = {}) {
  actionState.current = state

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'bn' ? bnMessages : enMessages}
    >
      <SignupForm />
    </NextIntlClientProvider>,
  )
}

describe('SignupForm', () => {
  test('asks for a name, an email, and a password', () => {
    renderForm()

    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeRequired()
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
  })

  test('carries the locale so the redirect stays in the reader language', () => {
    const { container } = renderForm({ locale: 'bn' })

    expect(container.querySelector('input[name="locale"]')).toHaveValue('bn')
  })

  test('wires a field error to the input it belongs to', () => {
    renderForm({
      state: {
        fieldErrors: { password: 'errorPasswordTooShort' },
        status: 'invalid',
        values: { displayName: 'Rifat', email: 'rifat@example.com' },
      },
    })

    const password = screen.getByLabelText('Password')
    const message = screen.getByText('Use at least 10 characters.')

    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-describedby', message.id)
  })

  test('keeps what was typed after a rejection', () => {
    renderForm({
      state: {
        fieldErrors: { email: 'errorEmailTaken' },
        status: 'invalid',
        values: { displayName: 'Rifat', email: 'rifat@example.com' },
      },
    })

    expect(screen.getByRole('textbox', { name: 'Display name' })).toHaveValue(
      'Rifat',
    )
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'rifat@example.com',
    )
  })

  test('never echoes the password back', () => {
    renderForm({
      state: {
        fieldErrors: { email: 'errorEmailTaken' },
        status: 'invalid',
        values: { displayName: 'Rifat', email: 'rifat@example.com' },
      },
    })

    // Re-entering it is the correct trade: a password should not survive a
    // round trip through the rendered HTML.
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  test('explains a taken email in terms the visitor can act on', () => {
    renderForm({
      state: {
        fieldErrors: { email: 'errorEmailTaken' },
        status: 'invalid',
        values: { displayName: 'Rifat', email: 'rifat@example.com' },
      },
    })

    expect(
      screen.getByText(
        'An account with this email already exists. Try signing in instead.',
      ),
    ).toBeInTheDocument()
  })

  test('surfaces the rate limit as an alert', () => {
    renderForm({
      state: {
        status: 'rate-limited',
        values: { displayName: '', email: '' },
      },
    })

    expect(screen.getByTestId('signup-error')).toHaveAttribute('role', 'alert')
  })

  test('renders a validation message in Bangla for a Bangla reader', () => {
    renderForm({
      locale: 'bn',
      state: {
        fieldErrors: { password: 'errorPasswordTooShort' },
        status: 'invalid',
        values: { displayName: '', email: '' },
      },
    })

    // The server returns a key, so the wording follows the reader rather than
    // whatever language the server happens to speak.
    expect(
      screen.getByText('কমপক্ষে ১০টি অক্ষর ব্যবহার করুন।'),
    ).toBeInTheDocument()
  })

  test('hides the honeypot from the accessibility tree and the tab order', () => {
    const { container } = renderForm()

    const honeypot = container.querySelector(`input[name="${HONEYPOT_FIELD}"]`)

    expect(honeypot).not.toBeNull()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(
      screen.queryByRole('textbox', { name: 'Website' }),
    ).not.toBeInTheDocument()
  })

  test('offers a way to the sign-in page', () => {
    renderForm()

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    )
  })
})
