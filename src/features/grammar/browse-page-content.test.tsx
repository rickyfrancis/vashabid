import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { render, screen, within } from '@/test/render'
import { GrammarBrowsePageContent } from './browse-page-content'
import type { GrammarBrowsePageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const populated: GrammarBrowsePageViewModel = {
  filters: { level: 'A2', page: 2, topic: 'grammatik' },
  options: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    topics: [
      { name: 'Grammatik', slug: 'grammatik' },
      { name: 'Alltag', slug: 'alltag' },
    ],
  },
  pagination: {
    hasNextPage: true,
    hasPrevPage: true,
    page: 2,
    totalDocs: 13,
    totalPages: 3,
  },
  topics: [
    {
      cefrLevel: 'A2',
      name: 'Modalverben',
      shortRule: 'Das Modalverb wird konjugiert.',
      slug: 'modalverben',
      support: { bangla: 'মোডাল ক্রিয়া।', english: 'Modal verbs.' },
      topics: [{ name: 'Grammatik', slug: 'grammatik' }],
    },
    {
      cefrLevel: 'A2',
      name: 'Trennbare Verben',
      shortRule: 'Die Vorsilbe steht am Satzende.',
      slug: 'trennbare-verben',
      support: { bangla: null, english: 'Separable verbs.' },
      topics: [],
    },
  ],
}

const empty: GrammarBrowsePageViewModel = {
  ...populated,
  pagination: {
    hasNextPage: false,
    hasPrevPage: false,
    page: 1,
    totalDocs: 0,
    totalPages: 0,
  },
  topics: [],
}

function renderBrowse(
  browse: GrammarBrowsePageViewModel,
  supportMode: SupportMode = 'en',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={supportMode}>
        <GrammarBrowsePageContent browse={browse} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('GrammarBrowsePageContent', () => {
  test('renders one card per topic with its German rule and link', () => {
    renderBrowse(populated)

    const card = screen.getByTestId('browse-grammar-modalverben')

    expect(
      within(card).getByRole('link', { name: 'Modalverben' }),
    ).toHaveAttribute('href', '/grammar/modalverben')
    expect(within(card).getByText('Das Modalverb wird konjugiert.')).toHaveAttribute(
      'lang',
      'de',
    )
    expect(within(card).getByText('A2')).toBeInTheDocument()
    expect(within(card).getByText('Grammatik')).toBeInTheDocument()
  })

  test('reports the published total and preselects active filters', () => {
    renderBrowse(populated)

    expect(screen.getByText('13 published topics')).toBeInTheDocument()
    expect(screen.getByLabelText('CEFR level')).toHaveValue('A2')
    expect(screen.getByLabelText('Learning topic')).toHaveValue('grammatik')
  })

  test('shows English only in English support mode', () => {
    renderBrowse(populated, 'en')
    const card = screen.getByTestId('browse-grammar-modalverben')

    expect(within(card).getByText('Modal verbs.')).toBeInTheDocument()
    expect(within(card).queryByText('মোডাল ক্রিয়া।')).not.toBeInTheDocument()
  })

  test('shows both languages side by side in combined mode', () => {
    renderBrowse(populated, 'both')
    const card = screen.getByTestId('browse-grammar-modalverben')

    expect(within(card).getByText('Modal verbs.')).toBeInTheDocument()
    expect(within(card).getByText('মোডাল ক্রিয়া।')).toBeInTheDocument()
  })

  test('falls back to English with a notice when Bangla is unavailable', () => {
    renderBrowse(populated, 'bn')
    const card = screen.getByTestId('browse-grammar-trennbare-verben')

    expect(within(card).getByText('Separable verbs.')).toBeInTheDocument()
    expect(within(card).getByRole('note')).toHaveTextContent(
      'Bangla is still under review',
    )
  })

  test('labels a topic with no tags instead of leaving a gap', () => {
    renderBrowse(populated)

    expect(
      within(screen.getByTestId('browse-grammar-trennbare-verben')).getByText(
        'No topic assigned',
      ),
    ).toBeInTheDocument()
  })

  test('builds pagination links that preserve the active filters', () => {
    renderBrowse(populated)

    const pagination = screen.getByRole('navigation', {
      name: 'Grammar topic pages',
    })

    expect(
      within(pagination).getByRole('link', { name: 'Previous' }),
    ).toHaveAttribute('href', '/grammar?level=A2&topic=grammatik')
    expect(
      within(pagination).getByRole('link', { name: 'Next' }),
    ).toHaveAttribute('href', '/grammar?level=A2&topic=grammatik&page=3')
    expect(within(pagination).getByText('Page 2 of 3')).toBeInTheDocument()
  })

  test('offers a way back to the full list when nothing matches', () => {
    renderBrowse(empty)

    expect(
      screen.getByRole('heading', { name: 'No topics match this workbook' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('grammar-browse-grid')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Grammar topic pages' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Clear filters' })[0],
    ).toHaveAttribute('href', '/grammar')
  })
})
