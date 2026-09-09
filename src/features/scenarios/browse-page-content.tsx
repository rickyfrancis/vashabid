import {
  ArrowLeft,
  ArrowRight,
  Filter,
  MessagesSquare,
  SquareStack,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  buttonStyles,
} from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { cn } from '@/lib/cn'
import { ScenarioCard } from './scenario-card'
import { toScenarioBrowseQuery } from './service'
import type {
  ScenarioBrowseFilters,
  ScenarioBrowsePageViewModel,
} from './types'

const selectStyles =
  'h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20'

function browseHref(filters: ScenarioBrowseFilters, page: number) {
  const query = toScenarioBrowseQuery({ ...filters, page })
  const search = new URLSearchParams(query).toString()
  return `/scenarios${search ? `?${search}` : ''}`
}

function Pagination({ browse }: { browse: ScenarioBrowsePageViewModel }) {
  const t = useTranslations('Scenarios')
  const { filters, pagination } = browse

  if (pagination.totalPages <= 1) return null

  return (
    <nav
      aria-label={t('paginationLabel')}
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
    >
      {pagination.hasPrevPage ? (
        <Link
          className={buttonStyles({ variant: 'secondary' })}
          href={browseHref(filters, pagination.page - 1)}
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
          href={browseHref(filters, pagination.page + 1)}
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

export function ScenarioBrowsePageContent({
  browse,
}: {
  browse: ScenarioBrowsePageViewModel
}) {
  const t = useTranslations('Scenarios')
  const situation = useTranslations('SituationTypes')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
        <header className="relative border-b border-border pb-8 lg:col-start-2 lg:row-start-1">
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
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Badge className="gap-2" tone="accent">
              <SquareStack aria-hidden="true" size={14} />
              {t('resultCount', { count: browse.pagination.totalDocs })}
            </Badge>
            <span className="text-sm text-muted">{t('supportHint')}</span>
          </div>
        </header>

        <aside className="lg:sticky lg:top-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
          <Card className="relative overflow-hidden border-t-4 border-t-accent-500 p-5 shadow-sm sm:p-6">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-14 size-32 rounded-full border border-accent-200/60 bg-accent-50/50 dark:border-accent-800/50 dark:bg-accent-950/20"
            />
            <form className="relative" method="get">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                  <Filter aria-hidden="true" size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {t('filtersTitle')}
                  </h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-muted">
                    {t('filtersEyebrow')}
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-foreground"
                    htmlFor="scenario-filter-level"
                  >
                    {t('levelLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.level ?? ''}
                    id="scenario-filter-level"
                    name="level"
                  >
                    <option value="">{t('allLevels')}</option>
                    {browse.options.levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-foreground"
                    htmlFor="scenario-filter-situation"
                  >
                    {t('situationLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.situation ?? ''}
                    id="scenario-filter-situation"
                    name="situation"
                  >
                    <option value="">{t('allSituations')}</option>
                    {browse.options.situations.map((value) => (
                      <option key={value} value={value}>
                        {situation(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-foreground"
                    htmlFor="scenario-filter-topic"
                  >
                    {t('topicLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.topic ?? ''}
                    id="scenario-filter-topic"
                    name="topic"
                  >
                    <option value="">{t('allTopics')}</option>
                    {browse.options.topics.map((topic) => (
                      <option key={topic.slug} value={topic.slug}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Button className="w-full" type="submit">
                  {t('applyFilters')}
                </Button>
                <Link
                  className={buttonStyles({
                    className: 'w-full',
                    variant: 'secondary',
                  })}
                  href="/scenarios"
                >
                  {t('clearFilters')}
                </Link>
              </div>
            </form>
          </Card>
        </aside>

        <div className="min-w-0 lg:col-start-2 lg:row-start-2">
          {browse.scenarios.length > 0 ? (
            <div
              className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              data-testid="scenario-browse-grid"
            >
              {browse.scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.slug}
                  scenario={scenario}
                  testIdPrefix="browse-scenario"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                action={
                  <Link
                    className={buttonStyles({ variant: 'secondary' })}
                    href="/scenarios"
                  >
                    {t('clearFilters')}
                  </Link>
                }
                description={t('emptyDescription')}
                headingLevel={2}
                icon={MessagesSquare}
                title={t('emptyTitle')}
              />
            </div>
          )}

          <Pagination browse={browse} />
        </div>
      </div>
    </PageContainer>
  )
}
