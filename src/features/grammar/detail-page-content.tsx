'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Languages,
  NotebookPen,
  Quote,
  Tags,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { PageContainer } from '@/components/layout'
import { Badge, Card, buttonStyles } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { useSupportMode } from '@/features/i18n/support-mode-provider'
import { SupportSnippet } from '@/features/words/support-snippet'
import { cn } from '@/lib/cn'
import type {
  GrammarDetailLanguageViewModel,
  GrammarDetailPageViewModel,
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
  const t = useTranslations('GrammarDetail')

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
  support: GrammarDetailPageViewModel['support']
}) {
  const t = useTranslations('GrammarDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const banglaAvailable = Boolean(
    support.bangla &&
      (support.bangla.explanation ||
        support.bangla.commonMistakes.length > 0),
  )
  const showEnglish = supportMode !== 'bn' || !banglaAvailable
  const showBangla = supportMode !== 'en' && banglaAvailable

  const content = (language: GrammarDetailLanguageViewModel) => (
    <>
      {language.explanation ? (
        <div className={richTextStyles}>
          <RichText data={language.explanation} disableContainer />
        </div>
      ) : null}
    </>
  )

  return (
    <section aria-labelledby="grammar-explanation">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
        <span className="h-px w-8 bg-accent-500" />
        {t('supportEyebrow')}
      </p>
      <h2
        className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground"
        id="grammar-explanation"
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

function Mistakes({
  support,
}: {
  support: GrammarDetailPageViewModel['support']
}) {
  const t = useTranslations('GrammarDetail')
  const learnerSupport = useTranslations('LearnerSupport')
  const { supportMode } = useSupportMode()
  const banglaMistakes = support.bangla?.commonMistakes ?? []
  const banglaAvailable = banglaMistakes.length > 0
  const showEnglish = supportMode !== 'bn' || !banglaAvailable
  const showBangla = supportMode !== 'en' && banglaAvailable

  if (support.english.commonMistakes.length === 0 && !banglaAvailable) {
    return null
  }

  const list = (mistakes: string[]) => (
    <ul className="space-y-3">
      {mistakes.map((mistake) => (
        <li className="flex items-start gap-3" key={mistake}>
          <AlertTriangle
            aria-hidden="true"
            className="mt-1 shrink-0 text-warning"
            size={16}
          />
          <span>{mistake}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-labelledby="grammar-mistakes">
      <h2
        className="font-display text-3xl font-semibold tracking-tight text-foreground"
        id="grammar-mistakes"
      >
        {t('mistakesTitle')}
      </h2>
      <div
        className={cn(
          'mt-6 grid gap-4',
          showEnglish && showBangla ? 'lg:grid-cols-2' : null,
        )}
      >
        {showEnglish && support.english.commonMistakes.length > 0 ? (
          <LanguagePanel label={learnerSupport('englishLabel')} language="en">
            {list(support.english.commonMistakes)}
          </LanguagePanel>
        ) : null}
        {showBangla ? (
          <LanguagePanel label={learnerSupport('banglaLabel')} language="bn">
            {list(banglaMistakes)}
          </LanguagePanel>
        ) : null}
      </div>
    </section>
  )
}

function Examples({ topic }: { topic: GrammarDetailPageViewModel }) {
  const t = useTranslations('GrammarDetail')

  if (topic.examples.length === 0) return null

  return (
    <section aria-labelledby="grammar-examples">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
        <span className="h-px w-8 bg-accent-500" />
        {t('practiceEyebrow')}
      </p>
      <h2
        className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground"
        id="grammar-examples"
      >
        {t('examplesTitle')}
      </h2>
      <ol className="mt-6 space-y-5">
        {topic.examples.map((example, index) => (
          <li
            className="relative rounded-2xl border border-border bg-surface p-5 pl-14 sm:p-6 sm:pl-16"
            key={example.germanSentence}
          >
            <span
              aria-hidden="true"
              className="absolute left-5 top-5 grid size-7 place-items-center rounded-full bg-brand-800 font-mono text-xs font-bold text-white dark:bg-brand-300 dark:text-brand-950 sm:left-6 sm:top-6"
            >
              {index + 1}
            </span>
            <Quote
              aria-hidden="true"
              className="mb-2 text-accent-500"
              size={16}
            />
            <p
              className="font-display text-xl font-medium leading-8 text-foreground"
              lang="de"
            >
              {example.germanSentence}
            </p>
            <SupportSnippet className="mt-3" support={example.support} />
          </li>
        ))}
      </ol>
    </section>
  )
}

export function GrammarDetailPageContent({
  topic,
}: {
  topic: GrammarDetailPageViewModel
}) {
  const t = useTranslations('GrammarDetail')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
        href="/grammar"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {t('backToGrammar')}
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
          {topic.name}
        </h1>
        <p
          className="mt-6 max-w-3xl border-l-4 border-accent-500 pl-4 font-display text-xl italic leading-8 text-foreground"
          lang="de"
        >
          {topic.shortRule}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div className="min-w-0 space-y-12">
          <Explanation support={topic.support} />
          <Examples topic={topic} />
          <Mistakes support={topic.support} />

          {topic.relatedWords.length > 0 ? (
            <section aria-labelledby="grammar-related-words">
              <h2
                className="font-display text-3xl font-semibold tracking-tight text-foreground"
                id="grammar-related-words"
              >
                {t('relatedWordsTitle')}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {topic.relatedWords.map((word) => (
                  <Card
                    className="group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                    data-testid={`grammar-related-word-${word.slug}`}
                    key={word.slug}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone="brand">{word.cefrLevel}</Badge>
                      <ArrowRight
                        aria-hidden="true"
                        className="text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
                        size={18}
                      />
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
                      <Link
                        className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        href={`/words/${word.slug}`}
                        lang="de"
                      >
                        {word.article ? (
                          <span className="mr-2 text-base font-medium italic text-accent-700 dark:text-accent-300">
                            {word.article}
                          </span>
                        ) : null}
                        {word.headword}
                      </Link>
                    </h3>
                    <SupportSnippet className="mt-2" support={word.support} />
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <NotebookPen aria-hidden="true" size={18} />
              {t('quickFactsTitle')}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-muted">{t('levelLabel')}</dt>
                <dd className="mt-1">
                  <Badge tone="brand">{topic.cefrLevel}</Badge>
                </dd>
              </div>
              {topic.topics.length > 0 ? (
                <div>
                  <dt className="font-semibold text-muted">
                    {t('topicsLabel')}
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {topic.topics.map((tag) => (
                      <Badge className="gap-1.5" key={tag.slug}>
                        <Tags aria-hidden="true" size={12} />
                        {tag.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
            <Link
              className={buttonStyles({
                className: 'mt-6 w-full',
                variant: 'secondary',
              })}
              href="/words"
            >
              <BookOpenText aria-hidden="true" size={16} />
              {t('relatedWordsTitle')}
            </Link>
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}
