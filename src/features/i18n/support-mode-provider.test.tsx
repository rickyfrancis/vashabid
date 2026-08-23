import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'
import enMessages from '../../../messages/en.json'
import { fireEvent, render, screen } from '@/test/render'
import { SUPPORT_MODE_COOKIE } from './support-mode'
import { SupportModeProvider, useSupportMode } from './support-mode-provider'
import { SupportModeSwitcher } from './support-mode-switcher'

function SupportModeValue() {
  const { supportMode, setSupportMode } = useSupportMode()

  return (
    <div>
      <output>{supportMode}</output>
      <button onClick={() => setSupportMode('both')} type="button">
        Set both
      </button>
    </div>
  )
}

describe('SupportModeProvider', () => {
  test('provides the server-resolved initial mode and persists changes', () => {
    render(
      <SupportModeProvider initialMode="bn">
        <SupportModeValue />
      </SupportModeProvider>,
    )

    expect(screen.getByText('bn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Set both' }))
    expect(screen.getByText('both')).toBeInTheDocument()
    expect(document.cookie).toContain(`${SUPPORT_MODE_COOKIE}=both`)
  })

  test('renders an accessible translated radio group for every mode', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SupportModeProvider initialMode="en">
          <SupportModeSwitcher />
        </SupportModeProvider>
      </NextIntlClientProvider>,
    )

    const group = screen.getByRole('group', {
      name: /Learning support/,
    })
    const english = screen.getByRole('radio', { name: 'English' })
    const bangla = screen.getByRole('radio', { name: 'বাংলা' })

    expect(group).toHaveAccessibleDescription(
      'Choose the language used for explanations and translations.',
    )
    expect(english).toBeChecked()

    fireEvent.click(bangla)
    expect(bangla).toBeChecked()
    expect(document.cookie).toContain(`${SUPPORT_MODE_COOKIE}=bn`)
  })
})
