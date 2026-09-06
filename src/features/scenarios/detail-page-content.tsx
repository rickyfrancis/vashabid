'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Globe2,
  Languages,
  MessagesSquare,
  NotebookPen,
  Tags,
  Target,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { PageContainer } from '@/components/layout'
import { Badge, Button, Card } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { useSupportMode } from '@/features/i18n/support-mode-provider'
import { SupportSnippet } from '@/features/words/support-snippet'
import { WordSummaryCard } from '@/features/words/word-summary-card'
import { cn } from '@/lib/cn'
import type {
  ScenarioDetailLanguageViewModel,
  ScenarioDetailPageViewModel,
} from './types'

function LanguagePanel({
  children,
  language,
  label,
}: {
  children: ReactNode
  language: 'bn' | 'en'
  label: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 sm:p-6',
        language === 'bn'
          ? 'border-accent-300/80 bg-accent-50/55 dark:border-accent-800 dark:bg-accent-950/25'
          : 'border-brand-200/80 bg-brand-50/55 dark:border-brand-800 dark:bg-brand-950/25',
      )}
      lang={language}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="mt-4 space-y-4 text-base leading-7 text-foreground">
        {children}
      </div>
    </div>
  )
}

function FallbackNotice() {
  const t = useTranslations('ScenarioDetail')

  return (
    <p
      className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium leading-6 text-warning"
      role="note"
    >
      <Languages aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
      {t('fallbackNotice')}
    </p>
  )
}

const richTextStyles =
  '[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_a]:underline [&_a]:underline-offset-4 [&>*+*]:mt-4'

function Explanation({
  support,
}: {
  support: ScenarioDetailPageViewModel['support']
}) {
  const t = useTranslations('ScenarioDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const banglaAvailable = Boolean(support.bangla?.explanation)
  const showEnglish = supportMode !== 'bn' || !banglaAvailable
  const showBangla = supportMode !== 'en' && banglaAvailable

  const content = (language: ScenarioDetailLanguageViewModel) =>
    language.explanation ? (
      <div className={richTextStyles}>
        <RichText data={language.explanation} disableContainer />
      </div>
    ) : null

  return (
    <section aria-labelledby="scenario-explanation">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
        <span className="h-px w-8 bg-accent-500" />
        {t('supportEyebrow')}
      </p>
      <h2
        className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground"
        id="scenario-explanation"
      >
        {t('explanationTitle')}
      </h2>

      <div
        className={cn(
          'mt-6 grid gap-4',
          showEnglish && showBangla ? 'lg:grid-cols-2' : null,
        )}
      >
        {showEnglish ? (
          <LanguagePanel label={learnerSupport('englishLabel')} language="en">
            {content(support.english)}
          </LanguagePanel>
        ) : null}
        {showBangla && support.bangla ? (
          <LanguagePanel label={learnerSupport('banglaLabel')} language="bn">
            {content(support.bangla)}
          </LanguagePanel>
        ) : null}
      </div>

      {supportMode !== 'en' && !banglaAvailable ? <FallbackNotice /> : null}
    </section>
  )
}

function CulturalNotes({
  support,
}: {
  support: ScenarioDetailPageViewModel['support']
}) {
  const t = useTranslations('ScenarioDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const banglaNotes = support.bangla?.culturalNotes ?? []
  const banglaAvailable = banglaNotes.length > 0
  const showEnglish = supportMode !== 'bn' || !banglaAvailable
  const showBangla = supportMode !== 'en' && banglaAvailable

  if (support.english.culturalNotes.length === 0 && !banglaAvailable) {
    return null
  }

  const list = (notes: string[]) => (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li className="flex items-start gap-3" key={note}>
          <Globe2
            aria-hidden="true"
            className="mt-1 shrink-0 text-accent-600 dark:text-accent-300"
            size={16}
          />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-labelledby="scenario-cultural-notes">
      <h2
        className="font-display text-3xl font-semibold tracking-tight text-foreground"
        id="scenario-cultural-notes"
      >
        {t('culturalNotesTitle')}
      </h2>
      <div
        className={cn(
          'mt-6 grid gap-4',
          showEnglish && showBangla ? 'lg:grid-cols-2' : null,
        )}
      >
        {showEnglish && support.english.culturalNotes.length > 0 ? (
          <LanguagePanel label={learnerSupport('englishLabel')} language="en">
            {list(support.english.culturalNotes)}
          </LanguagePanel>
        ) : null}
        {showBangla ? (
          <LanguagePanel label={learnerSupport('banglaLabel')} language="bn">
            {list(banglaNotes)}
          </LanguagePanel>
        ) : null}
      </div>
    </section>
  )
}

function Dialogue({ scenario }: { scenario: ScenarioDetailPageViewModel }) {
  const t = useTranslations('ScenarioDetail')

  if (scenario.dialogue.length === 0) return null

  return (
    <section aria-labelledby="scenario-dialogue">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
        <span className="h-px w-8 bg-accent-500" />
        {t('dialogueEyebrow')}
      </p>
      <h2
        className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground"
        id="scenario-dialogue"
      >
        {t('dialogueTitle')}
      </h2>
      <ol className="mt-6 space-y-4" data-testid="scenario-dialogue-lines">
        {scenario.dialogue.map((line, index) => (
          <li
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
            key={`${index}-${line.germanLine}`}
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">
              <span
                aria-hidden="true"
                className="grid size-6 place-items-center rounded-full bg-brand-800 font-mono text-[0.65rem] text-white dark:bg-brand-300 dark:text-brand-950"
              >
                {index + 1}
              </span>
              <span lang="de">{line.speaker}</span>
            </p>
            <p
              className="mt-3 font-display text-xl font-medium leading-8 text-foreground"
              lang="de"
            >
              {line.germanLine}
            </p>
            <SupportSnippet className="mt-3" support={line.support} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function SaveVocabularyPlaceholder() {
  const t = useTranslations('ScenarioDetail')

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <BookmarkPlus aria-hidden="true" size={18} />
          {t('saveVocabularyTitle')}
        </h2>
        <Badge tone="accent">{t('comingSoon')}</Badge>
      </div>
      <p
        className="mt-3 text-sm leading-6 text-muted"
        id="scenario-save-vocabulary-description"
      >
        {t('saveVocabularyDescription')}
      </p>
      <Button
        aria-describedby="scenario-save-vocabulary-description"
        className="mt-5 w-full"
        data-testid="scenario-save-vocabulary"
        disabled
        type="button"
        variant="secondary"
      >
        <BookmarkPlus aria-hidden="true" size={16} />
        {t('saveVocabularyAction')}
      </Button>
    </Card>
  )
}

export function ScenarioDetailPageContent({
  scenario,
}: {
  scenario: ScenarioDetailPageViewModel
}) {
  const t = useTranslations('ScenarioDetail')
  const situation = useTranslations('SituationTypes')

  return (
    <PageContainer
      className="flex-1 py-12 sm:py-16 lg:py-20"
      data-testid={`scenario-detail-${scenario.slug}`}
    >
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
        href="/scenarios"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {t('backToScenarios')}
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
          <span className="h-px w-8 bg-accent-500" />
          {t('eyebrow')}
        </p>
        <h1
          className="mt-5 text-balance font-display text-5xl font-semibold leading-[1] tracking-[-0.035em] text-foreground sm:text-6xl"
          lang="de"
        >
          {scenario.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{scenario.cefrLevel}</Badge>
          <Badge>{situation(scenario.situationType)}</Badge>
        </div>
        <p className="mt-6 max-w-3xl border-l-4 border-accent-500 pl-4">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            <Target aria-hidden="true" size={13} />
            {t('goalTitle')}
          </span>
          <span
            className="mt-2 block font-display text-xl italic leading-8 text-foreground"
            lang="de"
          >
            {scenario.learnerGoal}
          </span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div className="min-w-0 space-y-12">
          <Explanation support={scenario.support} />
          <Dialogue scenario={scenario} />
          <CulturalNotes support={scenario.support} />

          {scenario.keyVocabulary.length > 0 ? (
            <section aria-labelledby="scenario-key-vocabulary">
              <h2
                className="font-display text-3xl font-semibold tracking-tight text-foreground"
                id="scenario-key-vocabulary"
              >
                {t('keyVocabularyTitle')}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {scenario.keyVocabulary.map((word) => (
                  <WordSummaryCard
                    key={word.slug}
                    testId={`scenario-word-${word.slug}`}
                    word={word}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {scenario.grammarTopics.length > 0 ? (
            <section aria-labelledby="scenario-related-grammar">
              <h2
                className="font-display text-3xl font-semibold tracking-tight text-foreground"
                id="scenario-related-grammar"
              >
                {t('relatedGrammarTitle')}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {scenario.grammarTopics.map((topic) => (
                  <Card
                    className="group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                    data-testid={`scenario-grammar-${topic.slug}`}
                    key={topic.slug}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone="brand">{topic.cefrLevel}</Badge>
                      <ArrowRight
                        aria-hidden="true"
                        className="text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
                        size={18}
                      />
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
                      <Link
                        className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        href={`/grammar/${topic.slug}`}
                        lang="de"
                      >
                        {topic.name}
                      </Link>
                    </h3>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <NotebookPen aria-hidden="true" size={18} />
              {t('quickFactsTitle')}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-muted">{t('levelLabel')}</dt>
                <dd className="mt-1">
                  <Badge tone="brand">{scenario.cefrLevel}</Badge>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">
                  {t('situationLabel')}
                </dt>
                <dd className="mt-1">
                  <Badge className="gap-1.5">
                    <MessagesSquare aria-hidden="true" size={12} />
                    {situation(scenario.situationType)}
                  </Badge>
                </dd>
              </div>
              {scenario.topics.length > 0 ? (
                <div>
                  <dt className="font-semibold text-muted">
                    {t('topicsLabel')}
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {scenario.topics.map((tag) => (
                      <Badge className="gap-1.5" key={tag.slug}>
                        <Tags aria-hidden="true" size={12} />
                        {tag.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <SaveVocabularyPlaceholder />
        </aside>
      </div>
    </PageContainer>
  )
}
