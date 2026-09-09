import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { render, screen, within } from '@/test/render'
import { ScenarioBrowsePageContent } from './browse-page-content'
import type { ScenarioBrowsePageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const card = (
  overrides: Partial<ScenarioBrowsePageViewModel['scenarios'][number]> = {},
) => ({
  cefrLevel: 'A1' as const,
  learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
  situationType: 'everyday' as const,
  slug: 'im-cafe-bestellen',
  support: {
    bangla: 'ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।',
    english: 'Greet, then order politely.',
  },
  title: 'Im Café bestellen',
  topics: [{ name: 'Alltag', slug: 'alltag' }],
  ...overrides,
})

const browse = (
  overrides: Partial<ScenarioBrowsePageViewModel> = {},
): ScenarioBrowsePageViewModel => ({
  filters: { page: 1 },
  options: {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    situations: [
      'everyday',
      'travel',
      'work',
      'study',
      'health',
      'services',
      'social',
    ],
    topics: [{ name: 'Alltag', slug: 'alltag' }],
  },
  pagination: {
    hasNextPage: true,
    hasPrevPage: false,
    page: 1,
    totalDocs: 8,
    totalPages: 2,
  },
  scenarios: [card()],
  ...overrides,
})

function renderBrowse(
  page: ScenarioBrowsePageViewModel = browse(),
  initialMode: SupportMode = 'en',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <ScenarioBrowsePageContent browse={page} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('ScenarioBrowsePageContent', () => {
  test('renders the published count and one card per scenario', () => {
    renderBrowse()

    expect(screen.getByText('8 published scenarios')).toBeInTheDocument()
    expect(
      screen.getByTestId('browse-scenario-im-cafe-bestellen'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('scenario-browse-grid')).toBeInTheDocument()
  })

  test('links each card to its localized detail route', () => {
    renderBrowse()

    expect(
      within(
        screen.getByTestId('browse-scenario-im-cafe-bestellen'),
      ).getByRole('link', { name: 'Im Café bestellen' }),
    ).toHaveAttribute('href', '/scenarios/im-cafe-bestellen')
  })

  test('offers level, situation, and topic filters with current values', () => {
    renderBrowse(
      browse({ filters: { level: 'A1', page: 1, situation: 'travel' } }),
    )

    expect(screen.getByLabelText('CEFR level')).toHaveValue('A1')
    expect(screen.getByLabelText('Situation')).toHaveValue('travel')
    expect(screen.getByLabelText('Learning topic')).toHaveValue('')
    expect(
      screen.getByRole('option', { name: 'Everyday life' }),
    ).toBeInTheDocument()
  })

  test('shows the situation type on each card as a localized label', () => {
    renderBrowse()

    expect(
      within(
        screen.getByTestId('browse-scenario-im-cafe-bestellen'),
      ).getByText('Everyday life'),
    ).toBeInTheDocument()
  })

  test.each([
    ['en', 'Greet, then order politely.', 'ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।'],
    ['bn', 'ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।', 'Greet, then order politely.'],
  ])('support mode %s shows the chosen language', (mode, shown, hidden) => {
    renderBrowse(browse(), mode as SupportMode)

    expect(screen.getByText(shown)).toBeInTheDocument()
    expect(screen.queryByText(hidden)).not.toBeInTheDocument()
  })

  test('support mode both shows English and Bangla together', () => {
    renderBrowse(browse(), 'both')

    expect(screen.getByText('Greet, then order politely.')).toBeInTheDocument()
    expect(
      screen.getByText('ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।'),
    ).toBeInTheDocument()
  })

  test('falls back to English with a notice when Bangla is withheld', () => {
    renderBrowse(
      browse({
        scenarios: [
          card({ support: { bangla: null, english: 'Greet, then order.' } }),
        ],
      }),
      'bn',
    )

    expect(screen.getByText('Greet, then order.')).toBeInTheDocument()
    expect(screen.getByRole('note')).toBeInTheDocument()
  })

  test('explains how to recover from an unmatched filter combination', () => {
    renderBrowse(
      browse({
        pagination: {
          hasNextPage: false,
          hasPrevPage: false,
          page: 1,
          totalDocs: 0,
          totalPages: 0,
        },
        scenarios: [],
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'No scenarios match this workbook' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('scenario-browse-grid')).not.toBeInTheDocument()
    expect(screen.getByText('No published scenarios')).toBeInTheDocument()
  })

  test('builds pagination links that carry the active filters', () => {
    renderBrowse(
      browse({ filters: { level: 'A1', page: 1, situation: 'travel' } }),
    )

    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/scenarios?level=A1&situation=travel&page=2',
    )
  })

  test('renders a card with no topics without breaking', () => {
    renderBrowse(browse({ scenarios: [card({ topics: [] })] }))

    expect(screen.getByText('No topic assigned')).toBeInTheDocument()
  })
})
