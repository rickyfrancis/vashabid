import {
  ArrowRight,
  BookmarkPlus,
  Info,
  Languages,
  LibraryBig,
  Sparkles,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Textarea,
  buttonStyles,
} from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { WordSummaryCard } from '@/features/words/word-summary-card'
import { MAX_TRANSLATE_INPUT } from './constants'
import { splitDirection, toTranslateQuery } from './normalization'
import { TranslatedText } from './translated-text'
import type { TranslatePageViewModel } from './types'

const selectStyles =
  'h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20'

function translateHref(
  text: string,
  direction: TranslatePageViewModel['direction'],
) {
  const query = new URLSearchParams(toTranslateQuery(text, direction)).toString()
  return `/translate${query ? `?${query}` : ''}`
}

function TranslateForm({ page }: { page: TranslatePageViewModel }) {
  const locale = useLocale()
  const t = useTranslations('Translator')
  const { from, to } = splitDirection(page.direction)
  const languageLabel = {
    bn: t('languageBn'),
    both: t('languageBoth'),
    de: t('languageDe'),
    en: t('languageEn'),
  } as const

  return (
    <form
      action={`/${locale}/translate`}
      className="relative"
      data-testid="translate-form"
      method="get"
    >
      <label
        className="mb-3 block text-sm font-semibold text-foreground"
        htmlFor="translate-text"
      >
        {t('label')}
      </label>
      <Textarea
        className="text-lg shadow-md"
        defaultValue={page.text}
        id="translate-text"
        maxLength={MAX_TRANSLATE_INPUT}
        name="text"
        placeholder={t('placeholder')}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-foreground"
            htmlFor="translate-from"
          >
            {t('sourceLabel')}
          </label>
          <select
            className={selectStyles}
            defaultValue={from}
            id="translate-from"
            name="from"
          >
            {page.options.sources.map((value) => (
              <option key={value} value={value}>
                {languageLabel[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-foreground"
            htmlFor="translate-to"
          >
            {t('targetLabel')}
          </label>
          <select
            className={selectStyles}
            defaultValue={to}
            id="translate-to"
            name="to"
          >
            {page.options.targets.map((value) => (
              <option key={value} value={value}>
                {languageLabel[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button className="mt-5 h-14 w-full rounded-2xl px-7" size="lg" type="submit">
        {t('action')}
        <ArrowRight aria-hidden="true" size={19} />
      </Button>
    </form>
  )
}

function Suggestions() {
  const t = useTranslations('Translator')
  const suggestions = [
    { direction: 'de-en' as const, value: t('exampleSentence') },
    { direction: 'de-en' as const, value: t('exampleInflected') },
    { direction: 'en-de' as const, value: t('exampleEnglish') },
  ]

  return (
    <div className="mt-7">
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-muted">
        {t('tryThese')}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map(({ direction, value }) => (
          <Link
            className={buttonStyles({ size: 'sm', variant: 'secondary' })}
            href={translateHref(value, direction)}
            key={`${direction}-${value}`}
          >
            <Sparkles aria-hidden="true" size={14} />
            {value}
          </Link>
        ))}
      </div>
    </div>
  )
}

/**
 * The honesty guard: shown whenever output came from dictionary lookup rather
 * than a translation engine, so the page never implies it translated anything.
 */
function DictionaryNotice() {
  const t = useTranslations('Translator')

  return (
    <div
      className="mt-6 flex gap-3 rounded-xl border border-accent-300 bg-accent-50/70 p-4 dark:border-accent-800 dark:bg-accent-950/30"
      data-testid="translate-dictionary-notice"
      role="note"
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-accent-700 dark:text-accent-300"
        size={18}
      />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t('dictionaryNoticeTitle')}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {t('dictionaryNoticeDescription')}
        </p>
      </div>
    </div>
  )
}

function SaveSentencePlaceholder() {
  const t = useTranslations('Translator')

  return (
    <Card className="mt-8 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <BookmarkPlus aria-hidden="true" size={18} />
          {t('saveSentenceTitle')}
        </h2>
        <Badge tone="accent">{t('comingSoon')}</Badge>
      </div>
      <p
        className="mt-3 text-sm leading-6 text-muted"
        id="translate-save-sentence-description"
      >
        {t('saveSentenceDescription')}
      </p>
      <Button
        aria-describedby="translate-save-sentence-description"
        className="mt-5 w-full"
        data-testid="translate-save-sentence"
        disabled
        type="button"
        variant="secondary"
      >
        <BookmarkPlus aria-hidden="true" size={16} />
        {t('saveSentenceAction')}
      </Button>
    </Card>
  )
}

export function TranslatePageContent({
  page,
}: {
  page: TranslatePageViewModel
}) {
  const t = useTranslations('Translator')
  const matches = page.result?.matches ?? []

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="relative grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1.2fr)] lg:items-end lg:gap-14">
          <div>
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
              <span className="h-px w-8 bg-accent-500" />
              {t('eyebrow')}
            </p>
            <h1 className="mt-5 max-w-3xl text-balance font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted">
              {t('description')}
            </p>
          </div>

          <Card className="relative overflow-hidden border-t-4 border-t-accent-500 p-5 shadow-lg sm:p-7">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 size-44 rounded-full border border-accent-200/70 bg-accent-50/60 dark:border-accent-800/50 dark:bg-accent-950/20"
            />
            <TranslateForm page={page} />
          </Card>
        </header>

        {page.state === 'idle' ? (
          <section
            aria-labelledby="translate-idle-heading"
            className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]"
          >
            <Card className="relative overflow-hidden border-l-4 border-l-brand-700 p-7 sm:p-9 dark:border-l-brand-300">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                <Languages aria-hidden="true" size={22} strokeWidth={1.8} />
              </span>
              <h2
                className="mt-7 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                id="translate-idle-heading"
              >
                {t('idleTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">
                {t('idleDescription')}
              </p>
              <Suggestions />
            </Card>
            <div
              aria-hidden="true"
              className="hidden flex-col justify-between rounded-2xl border border-border bg-surface-muted/70 p-6 font-mono text-xs uppercase tracking-[0.2em] text-muted lg:flex"
            >
              <span>Deutsch</span>
              <span className="self-center text-5xl text-accent-600 dark:text-accent-300">
                /
              </span>
              <span className="self-end">English · বাংলা</span>
            </div>
          </section>
        ) : null}

        {page.state === 'too-long' ? (
          <div className="mt-10">
            <EmptyState
              description={t('tooLongDescription', {
                limit: MAX_TRANSLATE_INPUT,
              })}
              headingLevel={2}
              icon={Info}
              title={t('tooLongTitle')}
            />
          </div>
        ) : null}

        {page.state === 'results' && page.result ? (
          <section aria-labelledby="translate-results-heading" className="mt-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  {t('resultsEyebrow')}
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl"
                  id="translate-results-heading"
                >
                  {t('resultsTitle')}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="gap-2" tone="accent">
                  <LibraryBig aria-hidden="true" size={14} />
                  {t('matchCount', { count: matches.length })}
                </Badge>
                <span className="text-sm text-muted">{t('supportHint')}</span>
              </div>
            </div>

            <Card className="mt-8 p-6 sm:p-8">
              <TranslatedText segments={page.result.segments} />
              {page.result.isDictionaryAssisted ? <DictionaryNotice /> : null}
            </Card>

            {matches.length > 0 ? (
              <section
                aria-labelledby="translate-matches-heading"
                className="mt-12"
              >
                <h2
                  className="font-display text-2xl font-semibold text-foreground"
                  id="translate-matches-heading"
                >
                  {t('matchesTitle')}
                </h2>
                <div
                  className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                  data-testid="translate-match-grid"
                >
                  {matches.map((word) => (
                    <WordSummaryCard
                      key={word.slug}
                      testId={`translate-word-${word.slug}`}
                      word={word}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="mt-10">
                <EmptyState
                  action={
                    <Link
                      className={buttonStyles({ variant: 'secondary' })}
                      href="/words"
                    >
                      {t('browseWords')}
                    </Link>
                  }
                  description={t('emptyDescription')}
                  headingLevel={2}
                  icon={Languages}
                  title={t('emptyTitle')}
                />
              </div>
            )}

            <SaveSentencePlaceholder />
          </section>
        ) : null}
      </div>
    </PageContainer>
  )
}
