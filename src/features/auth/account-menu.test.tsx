import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import bnMessages from '../../../messages/bn.json'
import enMessages from '../../../messages/en.json'
import { render, screen } from '@/test/render'
import { AccountMenu } from './account-menu'
import type { Session } from './types'

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('./actions', () => ({ logout }))

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const session: Session = {
  profile: null,
  user: {
    displayName: 'Rifat',
    email: 'rifat@example.com',
    id: 7,
    role: 'learner',
    supportMode: 'bn',
    uiLocale: 'bn',
  },
}

function renderMenu(value: Session | null, locale: 'bn' | 'en' = 'en') {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'bn' ? bnMessages : enMessages}
    >
      <AccountMenu linkClassName="link" session={value} />
    </NextIntlClientProvider>,
  )
}

describe('AccountMenu', () => {
  test('offers sign in and sign up to a visitor', () => {
    renderMenu(null)

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    )
    expect(screen.queryByTestId('logout')).not.toBeInTheDocument()
  })

  test('greets a signed-in learner by display name', () => {
    renderMenu(session)

    expect(screen.getByText('Signed in as Rifat')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })

  test('signs out through a form POST, never a link', () => {
    renderMenu(session)

    const button = screen.getByTestId('logout')

    // A GET must not end a session, so this is a submit button inside a form
    // rather than an anchor a prefetcher could follow.
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button.closest('form')).not.toBeNull()
  })

  test('carries the locale so sign-out returns to the same language', () => {
    const { container } = renderMenu(session, 'bn')

    expect(
      container.querySelector('input[name="locale"]'),
    ).toHaveValue('bn')
  })

  test('renders the account controls in Bangla', () => {
    renderMenu(null, 'bn')

    expect(screen.getByRole('link', { name: 'সাইন ইন' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'সাইন আপ' })).toBeInTheDocument()
  })

  test('falls back to the email when no display name was given', () => {
    renderMenu({
      ...session,
      user: { ...session.user, displayName: 'rifat@example.com' },
    })

    expect(
      screen.getByText('Signed in as rifat@example.com'),
    ).toBeInTheDocument()
  })
})
