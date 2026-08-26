import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import {
  SupportModeProvider,
  useSupportMode,
} from '@/features/i18n/support-mode-provider'
import { fireEvent, render, screen } from '@/test/render'
import { SearchPageContent } from './search-page-content'
import type { SearchPageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const populatedSearch: SearchPageViewModel = {
  pagination: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 2,
    totalDocs: 14,
    totalPages: 3,
  },
  query: 'bread',
  state: 'results',
  words: [
    {
      article: 'das',
      cefrLevel: 'A1',
      headword: 'Brot',
      slug: 'das-brot',
      support: { bangla: 'রুটি', english: 'bread' },
      topics: [{ name: 'Essen und Trinken', slug: 'essen-und-trinken' }],
      wordType: 'noun',
    },
  ],
}

function ModeButton({ mode }: { mode: SupportMode }) {
  const { setSupportMode } = useSupportMode()
  return (
    <button onClick={() => setSupportMode(mode)} type="button">
      Set {mode}
    </button>
  )
}

function renderSearch(
  search: SearchPageViewModel,
  initialMode: SupportMode = 'en',
  withModeButton = false,
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <SearchPageContent search={search} />
        {withModeButton ? <ModeButton mode="both" /> : null}
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('SearchPageContent', () => {
  test('renders a localized GET search form with current query state', () => {
    renderSearch(populatedSearch)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Find the German word you need.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('search')).toHaveAttribute('action', '/en/search')
    expect(screen.getByRole('searchbox')).toHaveValue('bread')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  test('offers multilingual examples before the first query', () => {
    renderSearch({
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        page: 1,
        totalDocs: 0,
        totalPages: 0,
      },
      query: '',
      state: 'idle',
      words: [],
    })

    expect(
      screen.getByRole('heading', {
        name: 'Three languages, one vocabulary index',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /German: der Termin/ })).toHaveAttribute(
      'href',
      '/search?q=der+Termin',
    )
    expect(screen.getByRole('link', { name: /বাংলা: খাওয়া/ })).toHaveAttribute(
      'href',
      expect.stringContaining('%E0%A6'),
    )
  })

  test('renders safe word results and preserves query pagination', () => {
    renderSearch(populatedSearch)

    expect(screen.getByText('14 matching words')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'das Brot' })).toHaveAttribute(
      'href',
      '/words/das-brot',
    )
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/search?q=bread',
    )
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/search?q=bread&page=3',
    )
  })

  test('updates approved result support from the shared preference', () => {
    renderSearch(populatedSearch, 'en', true)

    fireEvent.click(screen.getByRole('button', { name: 'Set both' }))

    expect(screen.getByTestId('search-word-das-brot')).toHaveTextContent('bread')
    expect(screen.getByTestId('search-word-das-brot')).toHaveTextContent('রুটি')
  })

  test('renders a useful no-result state without pagination', () => {
    renderSearch({
      ...populatedSearch,
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        page: 1,
        totalDocs: 0,
        totalPages: 0,
      },
      query: 'missing',
      words: [],
    })

    expect(
      screen.getByRole('heading', { name: 'No published words matched' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse all words' })).toHaveAttribute(
      'href',
      '/words',
    )
    expect(
      screen.queryByRole('navigation', { name: 'Search result pages' }),
    ).not.toBeInTheDocument()
  })
})
