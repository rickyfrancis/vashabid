import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, test, vi } from 'vitest'

import enMessages from '../../../messages/en.json'
import type { SupportMode } from '@/features/i18n/support-mode'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { richTextParagraphs } from '@/lib/payload/fields'
import { render, screen, within } from '@/test/render'
import { ScenarioDetailPageContent } from './detail-page-content'
import type { ScenarioDetailPageViewModel } from './types'

vi.mock('@/features/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}))

const ENGLISH_EXPLANATION = 'Greet, then order politely.'
const BANGLA_EXPLANATION = 'ক্যাফেতে বিনয়ীভাবে অর্ডার করুন।'

const scenario = (
  overrides: Partial<ScenarioDetailPageViewModel> = {},
): ScenarioDetailPageViewModel => ({
  cefrLevel: 'A1',
  dialogue: [
    {
      germanLine: 'Ich hätte gern einen Kaffee.',
      speaker: 'Kundin',
      support: { bangla: 'বিনয়ী অনুরোধ।', english: 'A polite order.' },
    },
  ],
  grammarTopics: [
    {
      cefrLevel: 'A1',
      name: 'Bestimmter Artikel',
      slug: 'bestimmter-artikel',
    },
  ],
  keyVocabulary: [
    {
      article: 'das',
      cefrLevel: 'A1',
      headword: 'Brot',
      slug: 'das-brot',
      support: { bangla: null, english: 'bread' },
      wordType: 'noun',
    },
  ],
  learnerGoal: 'Ich kann ein Getränk höflich bestellen.',
  situationType: 'everyday',
  slug: 'im-cafe-bestellen',
  support: {
    bangla: {
      culturalNotes: ['বাংলা সাংস্কৃতিক নোট।'],
      explanation: richTextParagraphs(BANGLA_EXPLANATION),
    },
    english: {
      culturalNotes: ['Greet before ordering.'],
      explanation: richTextParagraphs(ENGLISH_EXPLANATION),
    },
  },
  title: 'Im Café bestellen',
  topics: [{ name: 'Alltag', slug: 'alltag' }],
  ...overrides,
})

function renderDetail(
  page: ScenarioDetailPageViewModel = scenario(),
  initialMode: SupportMode = 'en',
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SupportModeProvider initialMode={initialMode}>
        <ScenarioDetailPageContent scenario={page} />
      </SupportModeProvider>
    </NextIntlClientProvider>,
  )
}

describe('ScenarioDetailPageContent', () => {
  test('renders the German identity, goal, and situation', () => {
    renderDetail()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Im Café bestellen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ich kann ein Getränk höflich bestellen.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Everyday life').length).toBeGreaterThan(0)
    expect(
      screen.getByTestId('scenario-detail-im-cafe-bestellen'),
    ).toBeInTheDocument()
  })

  test('renders the dialogue as an ordered transcript with speakers', () => {
    renderDetail()

    const dialogue = screen.getByTestId('scenario-dialogue-lines')

    expect(within(dialogue).getByText('Kundin')).toBeInTheDocument()
    expect(
      within(dialogue).getByText('Ich hätte gern einen Kaffee.'),
    ).toBeInTheDocument()
    expect(within(dialogue).getByText('A polite order.')).toBeInTheDocument()
  })

  test.each([
    ['en', ENGLISH_EXPLANATION, BANGLA_EXPLANATION],
    ['bn', BANGLA_EXPLANATION, ENGLISH_EXPLANATION],
  ])('support mode %s shows the chosen explanation', (mode, shown, hidden) => {
    renderDetail(scenario(), mode as SupportMode)

    expect(screen.getByText(shown)).toBeInTheDocument()
    expect(screen.queryByText(hidden)).not.toBeInTheDocument()
  })

  test('support mode both shows English and Bangla side by side', () => {
    renderDetail(scenario(), 'both')

    expect(screen.getByText(ENGLISH_EXPLANATION)).toBeInTheDocument()
    expect(screen.getByText(BANGLA_EXPLANATION)).toBeInTheDocument()
    expect(screen.getAllByText('English').length).toBeGreaterThan(0)
    expect(screen.getAllByText('বাংলা').length).toBeGreaterThan(0)
  })

  test('shows a fallback notice when Bangla is withheld', () => {
    renderDetail(
      scenario({
        support: {
          bangla: null,
          english: {
            culturalNotes: ['Greet before ordering.'],
            explanation: richTextParagraphs(ENGLISH_EXPLANATION),
          },
        },
      }),
      'bn',
    )

    expect(screen.getByText(ENGLISH_EXPLANATION)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Bangla guidance is not available for this section, so English is shown instead.',
      ),
    ).toBeInTheDocument()
  })

  test('never renders withheld Bangla in any support mode', () => {
    const withheld = scenario({
      dialogue: [
        {
          germanLine: 'Ich hätte gern einen Kaffee.',
          speaker: 'Kundin',
          support: { bangla: null, english: 'A polite order.' },
        },
      ],
      support: {
        bangla: null,
        english: {
          culturalNotes: ['Greet before ordering.'],
          explanation: richTextParagraphs(ENGLISH_EXPLANATION),
        },
      },
    })

    for (const mode of ['en', 'bn', 'both'] as SupportMode[]) {
      const { unmount } = renderDetail(withheld, mode)
      expect(document.body.textContent).not.toContain(BANGLA_EXPLANATION)
      expect(document.body.textContent).not.toContain('বিনয়ী অনুরোধ।')
      unmount()
    }
  })

  test('links key vocabulary and related grammar to their own pages', () => {
    renderDetail()

    expect(
      within(screen.getByTestId('scenario-word-das-brot')).getByRole('link'),
    ).toHaveAttribute('href', '/words/das-brot')
    expect(
      within(
        screen.getByTestId('scenario-grammar-bestimmter-artikel'),
      ).getByRole('link'),
    ).toHaveAttribute('href', '/grammar/bestimmter-artikel')
  })

  test('offers an inert learning-queue placeholder with an explanation', () => {
    renderDetail()

    const action = screen.getByTestId('scenario-save-vocabulary')

    expect(action).toBeDisabled()
    expect(action).toHaveAttribute(
      'aria-describedby',
      'scenario-save-vocabulary-description',
    )
    expect(action.tagName).toBe('BUTTON')
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  test('omits optional sections that have no content', () => {
    renderDetail(
      scenario({
        dialogue: [],
        grammarTopics: [],
        keyVocabulary: [],
        support: {
          bangla: null,
          english: {
            culturalNotes: [],
            explanation: richTextParagraphs(ENGLISH_EXPLANATION),
          },
        },
        topics: [],
      }),
    )

    expect(
      screen.queryByTestId('scenario-dialogue-lines'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Cultural notes' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Vocabulary you need here' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', {
        name: 'Grammar this conversation practises',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Im Café bestellen' }),
    ).toBeInTheDocument()
  })

  test('links back to the scenario index', () => {
    renderDetail()

    expect(
      screen.getByRole('link', { name: 'Back to scenario index' }),
    ).toHaveAttribute('href', '/scenarios')
  })
})
