import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import enMessages from '../../../messages/en.json'
import { fireEvent, render, screen } from '@/test/render'
import { LanguageSwitcher } from './language-switcher'

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('source=component-test'),
}))

vi.mock('./navigation', () => ({
  usePathname: () => '/words',
  useRouter: () => ({ replace: mocks.replace }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mocks.replace.mockReset()
    window.history.replaceState({}, '', '/en/words?source=component-test#entry')
  })

  test('renders a translated native selector with the current locale', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    )

    const selector = screen.getByRole('combobox', {
      name: 'Interface language',
    })
    expect(selector).toHaveValue('en')
    expect(screen.getByRole('option', { name: 'বাংলা' })).toBeInTheDocument()
  })

  test('preserves the pathname, query, and fragment when changing locale', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    )

    fireEvent.change(
      screen.getByRole('combobox', { name: 'Interface language' }),
      { target: { value: 'bn' } },
    )

    expect(mocks.replace).toHaveBeenCalledWith(
      '/words?source=component-test#entry',
      { locale: 'bn' },
    )
  })
})
