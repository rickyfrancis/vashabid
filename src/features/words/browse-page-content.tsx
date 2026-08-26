import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Filter,
  LibraryBig,
  Tags,
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
import { SupportSnippet } from './support-snippet'
import { toWordBrowseQuery } from './service'
import type {
  WordBrowseCardViewModel,
  WordBrowseFilters,
  WordBrowsePageViewModel,
} from './types'

const selectStyles =
  'h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20'

function browseHref(filters: WordBrowseFilters, page: number) {
  const query = toWordBrowseQuery({ ...filters, page })
  const search = new URLSearchParams(query).toString()
  return `/words${search ? `?${search}` : ''}`
}

function WordCard({ word }: { word: WordBrowseCardViewModel }) {
  const t = useTranslations('Words')
  const wordType = useTranslations('WordTypes')

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden border-t-4 border-t-brand-700 p-5 transition duration-200 hover:-translate-y-1 hover:border-t-accent-500 hover:shadow-lg dark:border-t-brand-300"
      data-testid={`browse-word-${word.slug}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-28 rounded-full border border-brand-200/60 bg-brand-50/50 transition group-hover:scale-110 dark:border-brand-800/50 dark:bg-brand-950/25"
      />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{word.cefrLevel}</Badge>
            <Badge>{wordType(word.wordType)}</Badge>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="mt-1 text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
            size={19}
            strokeWidth={1.7}
          />
        </div>

        <h2 className="mt-7 text-balance font-display text-3xl font-semibold tracking-tight text-foreground">
          <Link
            aria-label={`${word.article ? `${word.article} ` : ''}${word.headword}`}
            className="inline-flex items-baseline gap-2 rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={`/words/${word.slug}`}
            lang="de"
          >
            {word.article ? (
              <span className="text-lg font-medium italic text-accent-700 dark:text-accent-300">
                {word.article}
              </span>
            ) : null}
            <span>{word.headword}</span>
          </Link>
        </h2>

        <SupportSnippet className="mt-3" support={word.support} />

        <div className="mt-auto pt-6">
          {word.topics.length > 0 ? (
            <div
              aria-label={t('cardTopics')}
              className="flex flex-wrap gap-2 border-t border-border pt-4"
            >
              {word.topics.map((topic) => (
                <Badge className="gap-1.5" key={topic.slug}>
                  <Tags aria-hidden="true" size={12} />
                  {topic.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-xs font-medium text-muted">
              {t('noTopics')}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function Pagination({ browse }: { browse: WordBrowsePageViewModel }) {
  const t = useTranslations('Words')
  const { filters, pagination } = browse

  if (pagination.totalPages <= 1) return null

  const previous = pagination.page - 1
  const next = pagination.page + 1

  return (
    <nav
      aria-label={t('paginationLabel')}
      className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
    >
      {pagination.hasPrevPage ? (
        <Link
          className={buttonStyles({ variant: 'secondary' })}
          href={browseHref(filters, previous)}
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
          href={browseHref(filters, next)}
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

export function WordBrowsePageContent({
  browse,
}: {
  browse: WordBrowsePageViewModel
}) {
  const t = useTranslations('Words')
  const wordType = useTranslations('WordTypes')

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
              <LibraryBig aria-hidden="true" size={14} />
              {t('resultCount', { count: browse.pagination.totalDocs })}
            </Badge>
            <span className="text-sm text-muted">
              {t('supportHint')}
            </span>
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
                    htmlFor="word-filter-level"
                  >
                    {t('levelLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.level ?? ''}
                    id="word-filter-level"
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
                    htmlFor="word-filter-type"
                  >
                    {t('typeLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.type ?? ''}
                    id="word-filter-type"
                    name="type"
                  >
                    <option value="">{t('allTypes')}</option>
                    {browse.options.wordTypes.map((type) => (
                      <option key={type} value={type}>
                        {wordType(type)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-foreground"
                    htmlFor="word-filter-topic"
                  >
                    {t('topicLabel')}
                  </label>
                  <select
                    className={selectStyles}
                    defaultValue={browse.filters.topic ?? ''}
                    id="word-filter-topic"
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
                  href="/words"
                >
                  {t('clearFilters')}
                </Link>
              </div>
            </form>
          </Card>
        </aside>

        <div className="min-w-0 lg:col-start-2 lg:row-start-2">
          {browse.words.length > 0 ? (
            <div
              className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              data-testid="word-browse-grid"
            >
              {browse.words.map((word) => (
                <WordCard key={word.slug} word={word} />
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
                    {t('clearFilters')}
                  </Link>
                }
                description={t('emptyDescription')}
                headingLevel={2}
                icon={BookOpenText}
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
