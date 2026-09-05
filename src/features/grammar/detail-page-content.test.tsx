import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { richTextParagraphs } from '@/lib/payload/fields'
import { render, screen, within } from '@/test/render'
import { GrammarDetailPageContent } from './detail-page-content'
import type { GrammarDetailPageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const topic = (
  overrides: Partial<GrammarDetailPageViewModel> = {},
): GrammarDetailPageViewModel => ({
  cefrLevel: 'A2',
  examples: [
    {
      germanSentence: 'Ich bin nach Berlin gereist.',
      support: {
        bangla: 'গতিবাচক, তাই sein।',
        english: 'reisen expresses movement.',
      },
    },
  ],
  name: 'Perfekt mit haben und sein',
  relatedWords: [
    {
      article: null,
      cefrLevel: 'A1',
      headword: 'reisen',
      slug: 'reisen',
      support: { bangla: null, english: 'to travel' },
      wordType: 'verb',
    },
  ],
  shortRule: 'Das Perfekt bildet man mit haben oder sein.',
  slug: 'perfekt-mit-haben-und-sein',
  support: {
    bangla: {
      commonMistakes: ['ভুল সহায়ক ক্রিয়া।'],
      explanation: richTextParagraphs('বাংলা ব্যাখ্যা এখানে।'),
    },
    english: {
      commonMistakes: ['Using haben with verbs of movement.'],
      explanation: richTextParagraphs('The Perfekt combines haben or sein.'),
    },
  },
  topics: [{ name: 'Grammatik', slug: 'grammatik' }],
  ...overrides,
})

function renderDetail(
  value: GrammarDetailPageViewModel,
  supportMode: SupportMode = 'en',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={supportMode}>
        <GrammarDetailPageContent topic={value} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('GrammarDetailPageContent', () => {
  test('presents the German name and rule with correct language tags', () => {
    renderDetail(topic())

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Perfekt mit haben und sein',
    })

    expect(heading).toHaveAttribute('lang', 'de')
    expect(
      screen.getByText('Das Perfekt bildet man mit haben oder sein.'),
    ).toHaveAttribute('lang', 'de')
  })

  test('renders the rich-text explanation as real markup', () => {
    renderDetail(topic())

    expect(
      screen.getByText('The Perfekt combines haben or sein.'),
    ).toBeInTheDocument()
  })

  test('shows only English in English support mode', () => {
    renderDetail(topic(), 'en')

    expect(
      screen.getByText('The Perfekt combines haben or sein.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('বাংলা ব্যাখ্যা এখানে।')).not.toBeInTheDocument()
  })

  test('shows only Bangla in Bangla support mode when it is approved', () => {
    renderDetail(topic(), 'bn')

    expect(screen.getByText('বাংলা ব্যাখ্যা এখানে।')).toBeInTheDocument()
    expect(
      screen.queryByText('The Perfekt combines haben or sein.'),
    ).not.toBeInTheDocument()
  })

  test('shows both explanations side by side in combined mode', () => {
    renderDetail(topic(), 'both')

    expect(
      screen.getByText('The Perfekt combines haben or sein.'),
    ).toBeInTheDocument()
    expect(screen.getByText('বাংলা ব্যাখ্যা এখানে।')).toBeInTheDocument()
  })

  test('explains the English fallback when Bangla is unavailable', () => {
    renderDetail(topic({ support: { ...topic().support, bangla: null } }), 'bn')

    expect(
      screen.getByText('The Perfekt combines haben or sein.'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('note').some((note) =>
        note.textContent?.includes('Bangla guidance is not available'),
      ),
    ).toBe(true)
  })

  test('numbers examples and shows aligned learner support', () => {
    renderDetail(topic(), 'both')

    expect(screen.getByText('Ich bin nach Berlin gereist.')).toHaveAttribute(
      'lang',
      'de',
    )
    expect(screen.getByText('reisen expresses movement.')).toBeInTheDocument()
    expect(screen.getByText('গতিবাচক, তাই sein।')).toBeInTheDocument()
  })

  test('links related words to their word pages', () => {
    renderDetail(topic())

    const card = screen.getByTestId('grammar-related-word-reisen')

    expect(within(card).getByRole('link', { name: 'reisen' })).toHaveAttribute(
      'href',
      '/words/reisen',
    )
  })

  test('omits optional sections instead of rendering empty shells', () => {
    renderDetail(
      topic({
        examples: [],
        relatedWords: [],
        support: {
          bangla: null,
          english: {
            commonMistakes: [],
            explanation: richTextParagraphs('Only an explanation.'),
          },
        },
        topics: [],
      }),
    )

    expect(
      screen.queryByRole('heading', { name: 'German examples' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Common mistakes' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: 'Vocabulary that shows this pattern',
      }),
    ).not.toBeInTheDocument()
  })

  test('never renders Bangla the view model withheld', () => {
    const withheld = topic({
      examples: [
        {
          germanSentence: 'Ich fange an.',
          support: { bangla: null, english: 'The prefix detaches.' },
        },
      ],
      support: { ...topic().support, bangla: null },
    })

    const { container } = renderDetail(withheld, 'both')

    expect(container.textContent).not.toContain('বাংলা ব্যাখ্যা এখানে।')
    expect(container.textContent).not.toContain('ভুল সহায়ক ক্রিয়া।')
    expect(container.textContent).not.toContain('গতিবাচক, তাই sein।')
  })

  test('offers a way back to the grammar index', () => {
    renderDetail(topic())

    expect(
      screen.getByRole('link', { name: 'Back to grammar index' }),
    ).toHaveAttribute('href', '/grammar')
  })
})
