import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Languages,
  NotebookPen,
  Search,
  Sparkles,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  buttonStyles,
} from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { GrammarCard } from '@/features/grammar/grammar-card'
import { WordCard } from '@/features/words/word-card'
import { cn } from '@/lib/cn'
import { toSearchQuery } from './normalization'
import type { SearchPageViewModel } from './types'

function searchHref(query: string, page = 1) {
  const search = new URLSearchParams(toSearchQuery(query, page)).toString()
  return `/search${search ? `?${search}` : ''}`
}

function SearchForm({ query }: { query: string }) {
  const locale = useLocale()
  const t = useTranslations('Search')

  return (
    <form
      action={`/${locale}/search`}
      className="relative"
      data-testid="search-form"
      method="get"
      role="search"
    >
      <label
        className="mb-3 block text-sm font-semibold text-foreground"
        htmlFor="search-query"
      >
        {t('label')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-700 dark:text-brand-300"
            size={21}
            strokeWidth={1.8}
          />
          <Input
            className="h-14 rounded-2xl pl-12 pr-4 text-lg shadow-md"
            defaultValue={query}
            id="search-query"
            name="q"
            placeholder={t('placeholder')}
            type="search"
          />
        </div>
        <Button className="h-14 rounded-2xl px-7" size="lg" type="submit">
          {t('action')}
          <ArrowRight aria-hidden="true" size={19} />
        </Button>
      </div>
    </form>
  )
}

function Suggestions() {
  const t = useTranslations('Search')
  const suggestions = [
    { label: t('exampleGerman'), value: 'der Termin' },
    { label: t('exampleEnglish'), value: 'appointment' },
    { label: t('exampleBangla'), value: 'খাওয়া' },
  ]

  return (
    <div className="mt-7">
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-muted">
        {t('tryThese')}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map(({ label, value }) => (
          <Link
            className={buttonStyles({ size: 'sm', variant: 'secondary' })}
            href={searchHref(value)}
            key={value}
          >
            <Sparkles aria-hidden="true" size={14} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function SearchPagination({ search }: { search: SearchPageViewModel }) {
  const t = useTranslations('Search')
  const { pagination, query } = search

  if (pagination.totalPages <= 1) return null

  return (
    <nav
      aria-label={t('paginationLabel')}
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
    >
      {pagination.hasPrevPage ? (
        <Link
          className={buttonStyles({ variant: 'secondary' })}
          href={searchHref(query, pagination.page - 1)}
          rel="prev"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          {t('previousPage')}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonStyles({ variant: 'secondary' }),
            'cursor-not-allowed opacity-45',
          )}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          {t('previousPage')}
        </span>
      )}

      <p className="text-sm font-semibold text-muted">
        {t('pagePosition', {
          page: pagination.page,
          totalPages: pagination.totalPages,
        })}
      </p>

      {pagination.hasNextPage ? (
        <Link
          className={buttonStyles({ variant: 'secondary' })}
          href={searchHref(query, pagination.page + 1)}
          rel="next"
        >
          {t('nextPage')}
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonStyles({ variant: 'secondary' }),
            'cursor-not-allowed opacity-45',
          )}
        >
          {t('nextPage')}
          <ArrowRight aria-hidden="true" size={18} />
        </span>
      )}
    </nav>
  )
}

export function SearchPageContent({
  search,
}: {
  search: SearchPageViewModel
}) {
  const t = useTranslations('Search')

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
            <SearchForm query={search.query} />
          </Card>
        </header>

        {search.state === 'idle' ? (
          <section
            aria-labelledby="search-idle-heading"
            className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]"
          >
            <Card className="relative overflow-hidden border-l-4 border-l-brand-700 p-7 sm:p-9 dark:border-l-brand-300">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                <Languages aria-hidden="true" size={22} strokeWidth={1.8} />
              </span>
              <h2
                className="mt-7 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                id="search-idle-heading"
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
              <span className="self-center text-5xl text-accent-600 dark:text-accent-300">/</span>
              <span className="self-end">English · বাংলা</span>
            </div>
          </section>
        ) : (
          <section aria-labelledby="search-results-heading" className="mt-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  {t('sectionWords')}
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl"
                  id="search-results-heading"
                >
                  {t('querySummary', { query: search.query })}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="gap-2" tone="accent">
                  <BookOpenText aria-hidden="true" size={14} />
                  {t('resultCount', { count: search.pagination.totalDocs })}
                </Badge>
                <span className="text-sm text-muted">{t('supportHint')}</span>
              </div>
            </div>

            {search.words.length > 0 ? (
              <div
                className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                data-testid="search-result-grid"
              >
                {search.words.map((word) => (
                  <WordCard
                    key={word.slug}
                    testIdPrefix="search-word"
                    word={word}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8">
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
                  icon={Search}
                  title={t('emptyTitle')}
                />
              </div>
            )}

            <SearchPagination search={search} />

            {search.grammar.length > 0 ? (
              <section
                aria-labelledby="search-grammar-heading"
                className="mt-14 border-t border-border pt-10"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                      {t('sectionGrammar')}
                    </p>
                    <h2
                      className="mt-2 font-display text-3xl font-semibold text-foreground"
                      id="search-grammar-heading"
                    >
                      {t('sectionGrammar')}
                    </h2>
                  </div>
                  <Badge className="gap-2" tone="accent">
                    <NotebookPen aria-hidden="true" size={14} />
                    {t('grammarResultCount', { count: search.grammar.length })}
                  </Badge>
                </div>
                <div
                  className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                  data-testid="search-grammar-grid"
                >
                  {search.grammar.map((topic) => (
                    <GrammarCard
                      key={topic.slug}
                      testIdPrefix="search-grammar"
                      topic={topic}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        )}
      </div>
    </PageContainer>
  )
}
