import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import { render, screen } from '@/test/render'
import type { LoginFormState } from './types'

const { login } = vi.hoisted(() => ({ login: vi.fn() }))

vi.mock('./actions', () => ({ login }))

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: 'idle' } as LoginFormState },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  }
})

import { LoginForm } from './login-form'

function renderForm({
  locale = 'en',
  state = { status: 'idle' } as LoginFormState,
}: { locale?: 'bn' | 'en'; state?: LoginFormState } = {}) {
  actionState.current = state

  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'bn' ? bnMessages : enMessages}
    >
      <LoginForm />
    </NextIntlClientProvider>,
  )
}

describe('LoginForm', () => {
  test('asks only for an email and a password', () => {
    renderForm()

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
  })

  test('reports a failed sign-in without naming which half was wrong', () => {
    renderForm({
      state: { status: 'invalid-credentials', values: { email: 'x@y.com' } },
    })

    const alert = screen.getByTestId('login-error')

    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert).toHaveTextContent(
      'That email and password do not match an account.',
    )
    // An unknown email, a wrong password, a suspended account and a locked one
    // all look the same, so the form cannot be used to confirm who has an
    // account here.
    expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute(
      'aria-invalid',
    )
  })

  test('keeps the email after a failure so only the password is retyped', () => {
    renderForm({
      state: {
        status: 'invalid-credentials',
        values: { email: 'rifat@example.com' },
      },
    })

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'rifat@example.com',
    )
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  test('surfaces the rate limit separately from bad credentials', () => {
    renderForm({
      state: { status: 'rate-limited', values: { email: 'x@y.com' } },
    })

    expect(screen.getByTestId('login-error')).toHaveTextContent(
      'That is a lot of attempts in a short time. Please try again in a few minutes.',
    )
  })

  test('renders the failure message in Bangla for a Bangla reader', () => {
    renderForm({
      locale: 'bn',
      state: { status: 'invalid-credentials', values: { email: 'x@y.com' } },
    })

    expect(
      screen.getByText('এই ইমেইল ও পাসওয়ার্ড কোনো অ্যাকাউন্টের সঙ্গে মিলছে না।'),
    ).toBeInTheDocument()
  })

  test('offers a way to the signup page', () => {
    renderForm()

    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/signup')
  })

  test('has no honeypot, because a bot gains nothing from a login form', () => {
    const { container } = renderForm()

    expect(container.querySelector('input[name="website"]')).toBeNull()
  })
})
