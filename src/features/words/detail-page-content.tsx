'use client'

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpenText,
  Gauge,
  Languages,
  NotebookPen,
  NotebookTabs,
  Quote,
  Sparkles,
  Tags,
  VolumeX,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { PageContainer } from '@/components/layout'
import { Badge, Card, buttonStyles } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { useSupportMode } from '@/features/i18n/support-mode-provider'
import { cn } from '@/lib/cn'
import { SupportSnippet } from './support-snippet'
import type {
  WordDetailLanguageViewModel,
  WordDetailPageViewModel,
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
  const t = useTranslations('WordDetail')

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

function Meanings({ support }: { support: WordDetailPageViewModel['support'] }) {
  const t = useTranslations('WordDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const banglaAvailable = Boolean(
    support.bangla &&
      (support.bangla.meanings.length > 0 || support.bangla.explanation),
  )
  const showEnglish = supportMode !== 'bn' || !banglaAvailable
  const showBangla = supportMode !== 'en' && banglaAvailable

  const content = (language: WordDetailLanguageViewModel) => (
    <>
      <ul className="flex flex-wrap gap-2" aria-label={t('meaningsLabel')}>
        {language.meanings.map((meaning) => (
          <li
            className="rounded-full border border-current/15 bg-surface/70 px-3 py-1.5 font-semibold"
            key={meaning}
          >
            {meaning}
          </li>
        ))}
      </ul>
      {language.explanation ? <p>{language.explanation}</p> : null}
    </>
  )

  return (
    <>
      <div
        className={cn(
          'grid gap-4',
          showEnglish && showBangla ? 'lg:grid-cols-2' : '',
        )}
      >
        {showEnglish ? (
          <LanguagePanel language="en" label={learnerSupport('englishLabel')}>
            {content(support.english)}
          </LanguagePanel>
        ) : null}
        {showBangla && support.bangla ? (
          <LanguagePanel language="bn" label={learnerSupport('banglaLabel')}>
            {content(support.bangla)}
          </LanguagePanel>
        ) : null}
      </div>
      {supportMode !== 'en' && !banglaAvailable ? <FallbackNotice /> : null}
    </>
  )
}

function Examples({
  examples,
}: {
  examples: WordDetailPageViewModel['examples']
}) {
  const t = useTranslations('WordDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const needsFallback =
    supportMode !== 'en' && examples.some((example) => !example.support.bangla)

  return (
    <section aria-labelledby="word-examples-title">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
          <Quote aria-hidden="true" size={18} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            {t('practiceEyebrow')}
          </p>
          <h2
            className="font-display text-3xl font-semibold tracking-tight text-foreground"
            id="word-examples-title"
          >
            {t('examplesTitle')}
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {examples.map((example, index) => {
          const banglaAvailable = Boolean(example.support.bangla)
          const showEnglish = supportMode !== 'bn' || !banglaAvailable
          const showBangla = supportMode !== 'en' && banglaAvailable

          return (
            <Card
              className="relative overflow-hidden border-l-4 border-l-accent-500 p-6 sm:p-7"
              key={`${example.germanSentence}-${index}`}
            >
              <span className="absolute right-5 top-4 font-mono text-4xl font-semibold text-border">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p
                className="max-w-3xl pr-12 font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl"
                lang="de"
              >
                {example.germanSentence}
              </p>
              <div
                className={cn(
                  'mt-5 grid gap-3 border-t border-border pt-5 text-sm leading-6 text-muted',
                  showEnglish && showBangla ? 'md:grid-cols-2' : '',
                )}
              >
                {showEnglish ? (
                  <p lang="en">
                    {supportMode === 'both' ? (
                      <span className="mr-2 font-semibold text-foreground">
                        {learnerSupport('englishLabel')}
                      </span>
                    ) : null}
                    {example.support.english}
                  </p>
                ) : null}
                {showBangla ? (
                  <p lang="bn">
                    {supportMode === 'both' ? (
                      <span className="mr-2 font-semibold text-foreground">
                        {learnerSupport('banglaLabel')}
                      </span>
                    ) : null}
                    {example.support.bangla}
                  </p>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>
      {needsFallback ? <FallbackNotice /> : null}
    </section>
  )
}

function Mistakes({ support }: { support: WordDetailPageViewModel['support'] }) {
  const t = useTranslations('WordDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const english = support.english.commonMistakes
  const bangla = support.bangla?.commonMistakes ?? []
  const banglaAvailable = bangla.length > 0
  const showEnglish =
    english.length > 0 && (supportMode !== 'bn' || !banglaAvailable)
  const showBangla = supportMode !== 'en' && banglaAvailable

  if (english.length === 0 && !showBangla) return null

  return (
    <section aria-labelledby="word-mistakes-title">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-error/10 text-error">
          <AlertTriangle aria-hidden="true" size={18} strokeWidth={1.8} />
        </span>
        <h2
          className="font-display text-3xl font-semibold tracking-tight text-foreground"
          id="word-mistakes-title"
        >
          {t('mistakesTitle')}
        </h2>
      </div>
      <div
        className={cn(
          'mt-6 grid gap-4',
          showEnglish && showBangla ? 'lg:grid-cols-2' : '',
        )}
      >
        {showEnglish ? (
          <LanguagePanel language="en" label={learnerSupport('englishLabel')}>
            <ul className="list-disc space-y-2 pl-5">
              {english.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </LanguagePanel>
        ) : null}
        {showBangla ? (
          <LanguagePanel language="bn" label={learnerSupport('banglaLabel')}>
            <ul className="list-disc space-y-2 pl-5">
              {bangla.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </LanguagePanel>
        ) : null}
      </div>
      {supportMode !== 'en' && !banglaAvailable && english.length > 0 ? (
        <FallbackNotice />
      ) : null}
    </section>
  )
}

export function WordDetailPageContent({
  word,
}: {
  word: WordDetailPageViewModel
}) {
  const t = useTranslations('WordDetail')
  const wordType = useTranslations('WordTypes')
  const { supportMode } = useSupportMode()
  const banglaHints = word.support.bangla?.pronunciationHints ?? []

  return (
    <PageContainer className="flex-1 py-10 sm:py-14 lg:py-18">
      <Link
        className={buttonStyles({ className: 'mb-7', variant: 'ghost' })}
        href="/words"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        {t('backToWords')}
      </Link>

      <article data-testid={`word-detail-${word.slug}`}>
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-stretch">
          <Card className="relative overflow-hidden border-t-4 border-t-brand-700 p-7 shadow-md sm:p-10 lg:p-12 dark:border-t-brand-300">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 size-64 rounded-full border border-brand-200/60 bg-brand-50/60 dark:border-brand-800/50 dark:bg-brand-950/30"
            />
            <div className="relative">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
                <span className="h-px w-8 bg-accent-500" />
                {t('eyebrow')}
              </p>
              <h1
                className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl"
                lang="de"
              >
                {word.article ? (
                  <span className="text-2xl font-medium italic text-accent-700 sm:text-3xl dark:text-accent-300">
                    {word.article}
                  </span>
                ) : null}
                <span>{word.headword}</span>
              </h1>
              <div className="mt-7 flex flex-wrap gap-2">
                <Badge tone="brand">{word.cefrLevel}</Badge>
                <Badge>{wordType(word.wordType)}</Badge>
                <Badge className="capitalize" tone="accent">
                  {t(`registers.${word.register}`)}
                </Badge>
              </div>
              {word.ipa ? (
                <p className="mt-7 font-mono text-lg text-muted" lang="de">
                  <span className="sr-only">{t('ipaLabel')}: </span>
                  {word.ipa}
                </p>
              ) : null}
              {word.topics.length > 0 ? (
                <nav
                  aria-label={t('topicsLabel')}
                  className="mt-8 flex flex-wrap gap-2"
                >
                  {word.topics.map((topic) => (
                    <Link
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      href={`/words?topic=${encodeURIComponent(topic.slug)}`}
                      key={topic.slug}
                    >
                      <Badge className="gap-1.5">
                        <Tags aria-hidden="true" size={12} />
                        {topic.name}
                      </Badge>
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
          </Card>

          <Card className="flex flex-col justify-between border-t-4 border-t-accent-500 bg-surface-muted/70 p-6 sm:p-7">
            <div>
              <span className="grid size-11 place-items-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200">
                <Gauge aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">
                {t('quickFactsTitle')}
              </h2>
              <dl className="mt-5 divide-y divide-border text-sm">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-muted">{t('wordTypeLabel')}</dt>
                  <dd className="font-semibold text-foreground">
                    {wordType(word.wordType)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-muted">{t('registerLabel')}</dt>
                  <dd className="font-semibold capitalize text-foreground">
                    {t(`registers.${word.register}`)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-muted">{t('usefulnessLabel')}</dt>
                  <dd className="font-semibold text-foreground">
                    {t('usefulnessValue', { score: word.usefulnessScore })}
                  </dd>
                </div>
              </dl>
            </div>
            <div
              className="mt-7 rounded-2xl border border-dashed border-border-strong bg-surface/70 p-4"
              role="note"
            >
              <div className="flex items-center gap-3">
                <VolumeX aria-hidden="true" className="text-muted" size={20} />
                <div>
                  <p className="font-semibold text-foreground">
                    {t('audioUnavailableTitle')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {t('audioUnavailableDescription')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-12">
            <section aria-labelledby="word-meaning-title">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                  <BookOpenText aria-hidden="true" size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    {t('supportEyebrow')}
                  </p>
                  <h2
                    className="font-display text-3xl font-semibold tracking-tight text-foreground"
                    id="word-meaning-title"
                  >
                    {t('meaningTitle')}
                  </h2>
                </div>
              </div>
              <div className="mt-6">
                <Meanings support={word.support} />
              </div>
            </section>

            {word.examples.length > 0 ? (
              <Examples examples={word.examples} />
            ) : null}
            <Mistakes support={word.support} />

            {word.grammar.length > 0 ? (
              <section aria-labelledby="related-grammar-title">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200">
                    <NotebookPen aria-hidden="true" size={18} strokeWidth={1.8} />
                  </span>
                  <h2
                    className="font-display text-3xl font-semibold tracking-tight text-foreground"
                    id="related-grammar-title"
                  >
                    {t('relatedGrammarTitle')}
                  </h2>
                </div>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {word.grammar.map((topic) => (
                    <li key={topic.slug}>
                      <Card
                        className="group relative flex items-center justify-between gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                        data-testid={`word-grammar-${topic.slug}`}
                      >
                        <div className="min-w-0">
                          <Badge tone="brand">{topic.cefrLevel}</Badge>
                          <p
                            className="mt-2 font-display text-lg font-semibold text-foreground"
                            lang="de"
                          >
                            <Link
                              className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                              href={`/grammar/${topic.slug}`}
                            >
                              {topic.name}
                            </Link>
                          </p>
                        </div>
                        <ArrowRight
                          aria-hidden="true"
                          className="shrink-0 text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
                          size={18}
                        />
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {word.relatedWords.length > 0 ? (
              <section aria-labelledby="related-words-title">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200">
                    <NotebookTabs aria-hidden="true" size={18} strokeWidth={1.8} />
                  </span>
                  <h2
                    className="font-display text-3xl font-semibold tracking-tight text-foreground"
                    id="related-words-title"
                  >
                    {t('relatedWordsTitle')}
                  </h2>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {word.relatedWords.map((related) => (
                    <Card
                      className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                      key={related.slug}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="brand">{related.cefrLevel}</Badge>
                          <Badge>{wordType(related.wordType)}</Badge>
                        </div>
                        <ArrowRight
                          aria-hidden="true"
                          className="text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
                          size={18}
                        />
                      </div>
                      <h3
                        className="mt-5 font-display text-2xl font-semibold text-foreground"
                        lang="de"
                      >
                        <Link
                          className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          href={`/words/${related.slug}`}
                        >
                          {related.article ? (
                            <span className="mr-2 text-base italic text-accent-700 dark:text-accent-300">
                              {related.article}
                            </span>
                          ) : null}
                          {related.headword}
                        </Link>
                      </h3>
                      <SupportSnippet
                        className="mt-2"
                        support={related.support}
                      />
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-8">
            {word.noun ? (
              <Card className="border-t-4 border-t-brand-700 p-6 dark:border-t-brand-300">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                  <Sparkles aria-hidden="true" size={18} strokeWidth={1.8} />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                  {t('nounDetailsTitle')}
                </h2>
                <dl className="mt-4 space-y-4 text-sm">
                  {word.noun.gender ? (
                    <div>
                      <dt className="text-muted">{t('articleLabel')}</dt>
                      <dd
                        className="mt-1 font-display text-2xl font-semibold text-foreground"
                        lang="de"
                      >
                        {word.noun.gender}
                      </dd>
                    </div>
                  ) : null}
                  {word.noun.pluralForm ? (
                    <div className="border-t border-border pt-4">
                      <dt className="text-muted">{t('pluralLabel')}</dt>
                      <dd
                        className="mt-1 font-semibold text-foreground"
                        lang="de"
                      >
                        {word.noun.pluralForm}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            ) : null}

            {supportMode !== 'en' && banglaHints.length > 0 ? (
              <Card
                className="border-t-4 border-t-accent-500 p-6"
                lang="bn"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200">
                  <AudioLines aria-hidden="true" size={18} strokeWidth={1.8} />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                  {t('pronunciationTitle')}
                </h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                  {banglaHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </aside>
        </div>
      </article>
    </PageContainer>
  )
}
