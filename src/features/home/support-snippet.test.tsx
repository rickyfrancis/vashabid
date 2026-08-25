import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test } from 'vitest'

import enMessages from '../../../messages/en.json'
import { SupportModeProvider, useSupportMode } from '@/features/i18n/support-mode-provider'
import type { SupportMode } from '@/features/i18n/support-mode'
import { fireEvent, render, screen } from '@/test/render'
import { SupportSnippet } from './support-snippet'

const approved = { bangla: 'রুটি', english: 'bread' }

function ModeButton({ mode }: { mode: SupportMode }) {
  const { setSupportMode } = useSupportMode()

  return (
    <button onClick={() => setSupportMode(mode)} type="button">
      Set {mode}
    </button>
  )
}

function renderSnippet(
  initialMode: SupportMode,
  support = approved,
  withControls = false,
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <SupportSnippet support={support} />
        {withControls ? <ModeButton mode="both" /> : null}
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('SupportSnippet', () => {
  test('shows only English in English support mode', () => {
    renderSnippet('en')

    expect(screen.getByText('bread')).toBeInTheDocument()
    expect(screen.queryByText('রুটি')).not.toBeInTheDocument()
  })

  test('shows approved Bangla in Bangla support mode', () => {
    renderSnippet('bn')

    expect(screen.getByText('রুটি')).toBeInTheDocument()
    expect(screen.queryByText('bread')).not.toBeInTheDocument()
  })

  test('falls back silently to English in Bangla support mode', () => {
    renderSnippet('bn', { bangla: null, english: 'bread' })

    expect(screen.getByText('bread')).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  test('shows both approved languages in both mode', () => {
    renderSnippet('both')

    expect(screen.getByText(/bread/)).toBeInTheDocument()
    expect(screen.getByText(/রুটি/)).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  test('explains the English fallback in both mode', () => {
    renderSnippet('both', { bangla: null, english: 'bread' })

    expect(screen.getByText('bread')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent(
      'Bangla is still under review, so English is shown for now.',
    )
  })

  test('reacts immediately when support mode changes', () => {
    renderSnippet('en', approved, true)

    fireEvent.click(screen.getByRole('button', { name: 'Set both' }))

    expect(screen.getByText(/bread/)).toBeInTheDocument()
    expect(screen.getByText(/রুটি/)).toBeInTheDocument()
  })
})
