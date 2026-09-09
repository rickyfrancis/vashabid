import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { render, screen } from '@/test/render'
import {
  translationDirections,
  translationSourceLanguages,
  translationTargetLanguages,
} from './constants'
import { TranslatePageContent } from './translate-page-content'
import type { TranslatePageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const brot = {
  article: 'das' as const,
  cefrLevel: 'A1' as const,
  headword: 'Brot',
  slug: 'das-brot',
  support: { bangla: null, english: 'bread' },
  wordType: 'noun' as const,
}

const essen = {
  article: null,
  cefrLevel: 'A1' as const,
  headword: 'essen',
  slug: 'essen',
  support: { bangla: 'খাওয়া', english: 'to eat' },
  wordType: 'verb' as const,
}

const options = {
  directions: translationDirections,
  sources: translationSourceLanguages,
  targets: translationTargetLanguages,
}

function page(
  overrides: Partial<TranslatePageViewModel> = {},
): TranslatePageViewModel {
  return {
    direction: 'de-en',
    options,
    result: null,
    state: 'idle',
    text: '',
    ...overrides,
  }
}

function resultsPage(
  overrides: Partial<TranslatePageViewModel> = {},
): TranslatePageViewModel {
  return page({
    result: {
      isDictionaryAssisted: true,
      matches: [brot],
      segments: [
        { kind: 'match', precision: 'exact', text: 'Das Brot', word: brot },
        { kind: 'text', text: ' ist frisch.' },
      ],
      translation: null,
    },
    state: 'results',
    text: 'Das Brot ist frisch.',
    ...overrides,
  })
}

function renderPage(
  viewModel: TranslatePageViewModel,
  initialMode: SupportMode = 'en',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <TranslatePageContent page={viewModel} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('TranslatePageContent form', () => {
  test('submits text and direction through a GET form', () => {
    renderPage(page())

    const form = screen.getByTestId('translate-form')
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/en/translate')
    expect(screen.getByLabelText('Text to look up')).toHaveAttribute(
      'name',
      'text',
    )
    expect(screen.getByLabelText('From')).toHaveAttribute('name', 'from')
    expect(screen.getByLabelText('To')).toHaveAttribute('name', 'to')
  })

  test('preselects the current direction and keeps the submitted text', () => {
    renderPage(resultsPage({ direction: 'bn-de' }))

    expect(screen.getByLabelText('From')).toHaveValue('bn')
    expect(screen.getByLabelText('To')).toHaveValue('de')
    expect(screen.getByLabelText('Text to look up')).toHaveValue(
      'Das Brot ist frisch.',
    )
  })
})

describe('TranslatePageContent idle state', () => {
  test('explains that it is a dictionary view, not a translator', () => {
    renderPage(page())

    expect(
      screen.getByRole('heading', {
        name: 'A dictionary-assisted reading view',
      }),
    ).toBeVisible()
    expect(
      screen.getByText(/does not translate whole sentences yet/i),
    ).toBeVisible()
  })

  test('offers example links that carry their own direction', () => {
    renderPage(page())

    expect(
      screen.getByRole('link', { name: /Das Brot ist frisch/ }),
    ).toHaveAttribute('href', '/translate?text=Das+Brot+ist+frisch.')
    expect(screen.getByRole('link', { name: /bread/ })).toHaveAttribute(
      'href',
      '/translate?text=bread&from=en&to=de',
    )
  })

  test('shows no reading view or placeholder before a lookup', () => {
    renderPage(page())

    expect(screen.queryByTestId('translate-reading-view')).toBeNull()
    expect(screen.queryByTestId('translate-save-sentence')).toBeNull()
  })
})

describe('TranslatePageContent results', () => {
  test('renders the original text with the known word linked', () => {
    renderPage(resultsPage())

    const reading = screen.getByTestId('translate-reading-view')
    expect(reading).toHaveTextContent('Das Brot ist frisch.')
    expect(screen.getByTestId('translate-token-das-brot')).toHaveAttribute(
      'href',
      '/words/das-brot',
    )
  })

  test('always labels dictionary output as not machine translation', () => {
    renderPage(resultsPage())

    expect(screen.getByTestId('translate-dictionary-notice')).toBeVisible()
    expect(
      screen.getByText('Dictionary-assisted, not machine translation'),
    ).toBeVisible()
  })

  test('omits the notice when a real engine produced a translation', () => {
    renderPage(
      resultsPage({
        result: {
          isDictionaryAssisted: false,
          matches: [brot],
          segments: [{ kind: 'text', text: 'Das Brot ist frisch.' }],
          translation: 'The bread is fresh.',
        },
      }),
    )

    expect(screen.queryByTestId('translate-dictionary-notice')).toBeNull()
  })

  test('lists each matched word once, linked to its entry', () => {
    renderPage(resultsPage())

    expect(screen.getByTestId('translate-match-grid')).toBeVisible()
    expect(screen.getByTestId('translate-word-das-brot')).toBeVisible()
    expect(screen.getByText('1 known word')).toBeVisible()
  })

  test('shows an actionable empty state when nothing matched', () => {
    renderPage(
      resultsPage({
        result: {
          isDictionaryAssisted: true,
          matches: [],
          segments: [{ kind: 'text', text: 'Guten Tag' }],
          translation: null,
        },
        text: 'Guten Tag',
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'No known words in this text yet' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Browse words' })).toHaveAttribute(
      'href',
      '/words',
    )
    expect(screen.queryByTestId('translate-match-grid')).toBeNull()
  })

  test('offers sentence mining as an inert placeholder until Phase 18', () => {
    renderPage(resultsPage())

    const action = screen.getByTestId('translate-save-sentence')
    expect(action).toBeDisabled()
    expect(screen.getByText('Coming soon')).toBeVisible()
  })
})

describe('TranslatePageContent support modes', () => {
  test.each(['en', 'bn', 'both'] as const)(
    'never renders unapproved Bangla in %s mode',
    (mode) => {
      renderPage(
        resultsPage({
          result: {
            isDictionaryAssisted: true,
            matches: [brot],
            segments: [
              {
                kind: 'match',
                precision: 'exact',
                text: 'Das Brot',
                word: brot,
              },
            ],
            translation: null,
          },
        }),
        mode,
      )

      expect(document.body.textContent).not.toContain('রুটি')
    },
  )

  test('shows both languages side by side in both mode', () => {
    renderPage(
      resultsPage({
        result: {
          isDictionaryAssisted: true,
          matches: [essen],
          segments: [
            { kind: 'match', precision: 'exact', text: 'essen', word: essen },
          ],
          translation: null,
        },
      }),
      'both',
    )

    const card = screen.getByTestId('translate-word-essen')
    expect(card).toHaveTextContent('to eat')
    expect(card).toHaveTextContent('খাওয়া')
  })

  test('falls back to English when Bangla is unavailable', () => {
    renderPage(resultsPage(), 'bn')

    const card = screen.getByTestId('translate-word-das-brot')
    expect(card).toHaveTextContent('bread')
  })
})

describe('TranslatePageContent over-length input', () => {
  test('explains the limit instead of translating a truncation', () => {
    renderPage(page({ state: 'too-long', text: 'a'.repeat(1001) }))

    expect(
      screen.getByRole('heading', { name: 'That text is too long' }),
    ).toBeVisible()
    expect(
      screen.getByText(/1,?000 characters or fewer/),
    ).toBeVisible()
    expect(screen.queryByTestId('translate-reading-view')).toBeNull()
  })
})
