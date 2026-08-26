import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import {
  SupportModeProvider,
  useSupportMode,
} from '@/features/i18n/support-mode-provider'
import { fireEvent, render, screen, within } from '@/test/render'
import { WordBrowsePageContent } from './browse-page-content'
import type { WordBrowsePageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const populatedBrowse: WordBrowsePageViewModel = {
  filters: { level: 'A1', page: 2, topic: 'alltag', type: 'noun' },
  options: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    topics: [
      { name: 'Alltag', slug: 'alltag' },
      { name: 'Reisen', slug: 'reisen' },
    ],
    wordTypes: [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'preposition',
      'conjunction',
      'phrase',
      'idiom',
    ],
  },
  pagination: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 2,
    totalDocs: 13,
    totalPages: 3,
  },
  words: [
    {
      article: 'das',
      cefrLevel: 'A1',
      headword: 'Brot',
      slug: 'das-brot',
      support: { bangla: 'রুটি', english: 'bread' },
      topics: [{ name: 'Alltag', slug: 'alltag' }],
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

function renderBrowse(
  browse: WordBrowsePageViewModel,
  initialMode: SupportMode = 'en',
  withModeButton = false,
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <WordBrowsePageContent browse={browse} />
        {withModeButton ? <ModeButton mode="both" /> : null}
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('WordBrowsePageContent', () => {
  test('renders localized filters with their selected URL state', () => {
    renderBrowse(populatedBrowse)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Browse the German word desk.' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('CEFR level')).toHaveValue('A1')
    expect(screen.getByLabelText('Word type')).toHaveValue('noun')
    expect(screen.getByLabelText('Learning topic')).toHaveValue('alltag')
    expect(screen.getByRole('button', { name: 'Apply filters' })).toHaveAttribute(
      'type',
      'submit',
    )
    expect(screen.getByRole('link', { name: 'Clear filters' })).toHaveAttribute(
      'href',
      '/words',
    )
  })

  test('renders safe word-card content and the noun article once', () => {
    renderBrowse(populatedBrowse)

    expect(
      screen.getByRole('heading', { level: 2, name: /Brot/ }),
    ).toHaveTextContent('dasBrot')
    expect(screen.getByRole('link', { name: 'das Brot' })).toHaveAttribute(
      'href',
      '/words/das-brot',
    )
    expect(screen.getByText('bread')).toBeInTheDocument()
    expect(screen.queryByText('রুটি')).not.toBeInTheDocument()
    expect(
      within(screen.getByTestId('browse-word-das-brot')).getByText('Alltag'),
    ).toBeInTheDocument()
  })

  test('preserves active filters in previous and next page URLs', () => {
    renderBrowse(populatedBrowse)

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/words?level=A1&type=noun&topic=alltag',
    )
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/words?level=A1&type=noun&topic=alltag&page=3',
    )
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
  })

  test('updates card meanings immediately from the shared support preference', () => {
    renderBrowse(populatedBrowse, 'en', true)

    fireEvent.click(screen.getByRole('button', { name: 'Set both' }))

    expect(screen.getByText(/bread/)).toBeInTheDocument()
    expect(screen.getByText(/রুটি/)).toBeInTheDocument()
  })

  test('renders a useful empty state without pagination', () => {
    renderBrowse({
      ...populatedBrowse,
      pagination: {
        hasNextPage: false,
        hasPrevPage: false,
        page: 1,
        totalDocs: 0,
        totalPages: 0,
      },
      words: [],
    })

    expect(
      screen.getByRole('heading', { name: 'No words match this index' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Word browse pages' })).not.toBeInTheDocument()
  })
})
