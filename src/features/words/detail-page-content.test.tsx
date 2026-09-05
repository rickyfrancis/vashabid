import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import {
  SupportModeProvider,
  useSupportMode,
} from '@/features/i18n/support-mode-provider'
import { fireEvent, render, screen, within } from '@/test/render'
import { WordDetailPageContent } from './detail-page-content'
import type { WordDetailPageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const detail: WordDetailPageViewModel = {
  article: 'der',
  audioAvailable: false,
  cefrLevel: 'A2',
  grammar: [
    { cefrLevel: 'B1', name: 'Relativsätze', slug: 'relativsaetze' },
  ],
  examples: [
    {
      germanSentence: 'Ich habe morgen einen Termin.',
      support: {
        bangla: 'আগামীকাল আমার একটি অ্যাপয়েন্টমেন্ট আছে।',
        english: 'I have an appointment tomorrow.',
      },
    },
  ],
  headword: 'Termin',
  ipa: '/tɛʁˈmiːn/',
  lemma: 'der Termin',
  noun: { gender: 'der', pluralForm: 'die Termine' },
  register: 'neutral',
  relatedWords: [
    {
      article: null,
      cefrLevel: 'A1',
      headword: 'arbeiten',
      slug: 'arbeiten',
      support: { bangla: 'কাজ করা', english: 'to work' },
      wordType: 'verb',
    },
  ],
  slug: 'der-termin',
  support: {
    bangla: {
      commonMistakes: ['আর্টিকেল বাদ দেবেন না।'],
      explanation: 'নির্দিষ্ট সময়ে দেখা করার জন্য ঠিক করা সময়।',
      meanings: ['অ্যাপয়েন্টমেন্ট'],
      pronunciationHints: ['শেষ অংশে দীর্ঘ “ই” ধ্বনি দিন।'],
    },
    english: {
      commonMistakes: ['Use einen Termin in the accusative.'],
      explanation: 'A scheduled time for a meeting or visit.',
      meanings: ['appointment'],
    },
  },
  topics: [{ name: 'Alltag', slug: 'alltag' }],
  usefulnessScore: 5,
  wordType: 'noun',
}

function ModeButton({ mode }: { mode: SupportMode }) {
  const { setSupportMode } = useSupportMode()
  return (
    <button onClick={() => setSupportMode(mode)} type="button">
      Set {mode}
    </button>
  )
}

function renderDetail(
  word: WordDetailPageViewModel = detail,
  initialMode: SupportMode = 'en',
  nextMode?: SupportMode,
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <WordDetailPageContent word={word} />
        {nextMode ? <ModeButton mode={nextMode} /> : null}
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('WordDetailPageContent', () => {
  test('renders German identity, English learning content, and working links', () => {
    renderDetail()

    const article = screen.getByTestId('word-detail-der-termin')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(
      'derTermin',
    )
    expect(screen.getByText('/tɛʁˈmiːn/')).toHaveAttribute('lang', 'de')
    expect(screen.getByText('appointment')).toBeInTheDocument()
    expect(screen.queryByText('অ্যাপয়েন্টমেন্ট')).not.toBeInTheDocument()
    expect(screen.getByText('Ich habe morgen einen Termin.')).toHaveAttribute(
      'lang',
      'de',
    )
    expect(screen.getByText('die Termine')).toHaveAttribute('lang', 'de')
    expect(screen.getByText('Use einen Termin in the accusative.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alltag' })).toHaveAttribute(
      'href',
      '/words?topic=alltag',
    )
    expect(screen.getByRole('link', { name: 'arbeiten' })).toHaveAttribute(
      'href',
      '/words/arbeiten',
    )
    expect(screen.getByText('Audio not available yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /audio/i })).not.toBeInTheDocument()
  })

  test('switches to side-by-side support and Bangla-specific guidance', () => {
    renderDetail(detail, 'en', 'both')

    fireEvent.click(screen.getByRole('button', { name: 'Set both' }))

    expect(screen.getByText('appointment')).toBeInTheDocument()
    expect(
      screen.getByText('অ্যাপয়েন্টমেন্ট').closest('div[lang="bn"]'),
    ).not.toBeNull()
    expect(
      screen.getByText('আগামীকাল আমার একটি অ্যাপয়েন্টমেন্ট আছে।'),
    ).toHaveAttribute('lang', 'bn')
    expect(screen.getByText('আর্টিকেল বাদ দেবেন না।')).toBeInTheDocument()
    expect(screen.getByText('শেষ অংশে দীর্ঘ “ই” ধ্বনি দিন।')).toBeInTheDocument()
  })

  test('shows English and localized notices when requested Bangla is absent', () => {
    renderDetail(
      {
        ...detail,
        examples: [
          {
            ...detail.examples[0],
            support: { ...detail.examples[0].support, bangla: null },
          },
        ],
        support: { ...detail.support, bangla: null },
      },
      'bn',
    )

    expect(screen.getByText('appointment')).toBeInTheDocument()
    expect(screen.getByText('I have an appointment tomorrow.')).toBeInTheDocument()
    expect(
      screen.getAllByText(
        'Bangla guidance is not available for this section, so English is shown instead.',
      ).length,
    ).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('অ্যাপয়েন্টমেন্ট')).not.toBeInTheDocument()
  })

  test('links out to the grammar patterns behind the word', () => {
    renderDetail(detail)

    const card = screen.getByTestId('word-grammar-relativsaetze')

    expect(
      within(card).getByRole('link', { name: 'Relativsätze' }),
    ).toHaveAttribute('href', '/grammar/relativsaetze')
    expect(within(card).getByText('B1')).toBeInTheDocument()
  })

  test('omits optional sections without crashing', () => {
    renderDetail({
      ...detail,
      examples: [],
      grammar: [],
      ipa: null,
      noun: null,
      relatedWords: [],
      support: {
        bangla: null,
        english: { commonMistakes: [], explanation: null, meanings: ['word'] },
      },
      topics: [],
      wordType: 'verb',
    })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Termin')
    expect(screen.queryByText('German examples')).not.toBeInTheDocument()
    expect(screen.queryByText('Common mistakes')).not.toBeInTheDocument()
    expect(screen.queryByText('Noun notes')).not.toBeInTheDocument()
    expect(screen.queryByText('Keep following the thread')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Grammar behind this word'),
    ).not.toBeInTheDocument()
  })
})
