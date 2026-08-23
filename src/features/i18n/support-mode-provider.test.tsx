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

  test('renders an accessible translated selector for every mode', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SupportModeProvider initialMode="en">
          <SupportModeSwitcher />
        </SupportModeProvider>
      </NextIntlClientProvider>,
    )

    const selector = screen.getByRole('combobox', {
      name: /Learning support/,
    })
    expect(selector).toHaveValue('en')

    fireEvent.change(selector, { target: { value: 'bn' } })
    expect(selector).toHaveValue('bn')
    expect(document.cookie).toContain(`${SUPPORT_MODE_COOKIE}=bn`)
  })
})
