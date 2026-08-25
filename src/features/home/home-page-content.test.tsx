import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { render, screen } from '@/test/render'
import { HomePageContent } from './home-page-content'
import type { HomePageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const populatedHome: HomePageViewModel = {
  beginnerWords: [
    {
      cefrLevel: 'A1',
      lemma: 'machen',
      slug: 'machen',
      support: { bangla: 'করা', english: 'to do; to make' },
      wordType: 'verb',
    },
  ],
  featuredWord: {
    cefrLevel: 'A2',
    lemma: 'der Termin',
    slug: 'der-termin',
    support: { bangla: 'অ্যাপয়েন্টমেন্ট', english: 'appointment' },
    wordType: 'noun',
  },
  topics: [
    {
      description: {
        bangla: 'দৈনন্দিন শব্দভাণ্ডার।',
        english: 'Daily life vocabulary.',
      },
      name: 'Alltag',
      slug: 'alltag',
    },
  ],
}

function renderHome(home: HomePageViewModel) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode="en">
        <HomePageContent home={home} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('HomePageContent', () => {
  test('renders CMS view models and working localized preview links', () => {
    renderHome(populatedHome)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Learn German through the language you know.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('der Termin')).toBeInTheDocument()
    expect(screen.getByText('machen')).toBeInTheDocument()
    expect(screen.getByText('Alltag')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Open word preview' }),
    ).toHaveAttribute('href', '/words/der-termin')
  })

  test('renders an accessible unavailable search preview', () => {
    renderHome(populatedHome)

    expect(
      screen.getByRole('searchbox', { name: 'Search German vocabulary' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    expect(
      screen.getByText(/Search opens in Phase 11/),
    ).toBeInTheDocument()
  })

  test('renders independent word and topic empty states', () => {
    renderHome({ beginnerWords: [], featuredWord: null, topics: [] })

    expect(screen.getAllByText('The word desk is being prepared')).toHaveLength(
      2,
    )
    expect(screen.getByText('Topics are being organized')).toBeInTheDocument()
    expect(screen.getByText('Grammar bites')).toBeInTheDocument()
    expect(screen.getByText('Scenario practice')).toBeInTheDocument()
  })
})
