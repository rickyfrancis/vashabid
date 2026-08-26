import {
  ArrowRight,
  BookOpenCheck,
  BookOpenText,
  Compass,
  MessageCircleMore,
  Search,
  Sparkles,
  Tags,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PageContainer } from '@/components/layout'
import { Badge, Button, Card, Input, buttonStyles } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { SupportSnippet } from '@/features/words/support-snippet'
import { cn } from '@/lib/cn'
import type {
  HomePageViewModel,
  HomeWordViewModel,
} from './types'

function SectionHeading({
  description,
  eyebrow,
  id,
  title,
}: {
  description?: string
  eyebrow: string
  id: string
  title: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800 dark:text-brand-200">
        <span className="h-px w-8 bg-accent-500" />
        {eyebrow}
      </p>
      <h2
        className="mt-4 text-balance font-display text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl"
        id={id}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function HomeEmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <Card className="border-dashed bg-surface/80 px-6 py-10 text-center shadow-sm">
      <BookOpenText
        aria-hidden="true"
        className="mx-auto text-accent-600 dark:text-accent-300"
        size={28}
        strokeWidth={1.6}
      />
      <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
        {description}
      </p>
    </Card>
  )
}

function WordCard({ word }: { word: HomeWordViewModel }) {
  const t = useTranslations('Home')

  return (
    <Card
      className="group flex h-full flex-col p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-700"
      data-testid={`word-card-${word.slug}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{word.cefrLevel}</Badge>
          <Badge>{t(`wordTypes.${word.wordType}`)}</Badge>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
          size={19}
          strokeWidth={1.7}
        />
      </div>
      <h3 className="mt-7 font-display text-3xl font-semibold tracking-tight text-foreground">
        <Link
          className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          href={`/words/${word.slug}`}
          lang="de"
        >
          {word.lemma}
        </Link>
      </h3>
      <SupportSnippet className="mt-3" support={word.support} />
    </Card>
  )
}

export function HomePageContent({ home }: { home: HomePageViewModel }) {
  const t = useTranslations('Home')

  return (
    <PageContainer className="flex-1 py-12 sm:py-16 lg:py-20">
      <div className="space-y-20 sm:space-y-24">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-end lg:gap-12">
          <div className="relative max-w-4xl">
            <div
              aria-hidden="true"
              className="absolute -left-5 top-1 hidden h-full w-px bg-accent-500 sm:block"
            />
            <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-brand-800 dark:text-brand-200">
              <span className="h-px w-9 bg-brand-700 dark:bg-brand-300" />
              {t('eyebrow')}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
              {t('title')}
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted sm:text-xl">
              {t('description')}
            </p>
          </div>

          <Card className="relative overflow-hidden border-t-4 border-t-accent-500 p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 size-36 rounded-full border border-brand-200/70 bg-brand-50/60 dark:border-brand-800/50 dark:bg-brand-950/30"
            />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                  <Search aria-hidden="true" size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {t('searchTitle')}
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">
                    {t('comingSoon')}
                  </p>
                </div>
              </div>
              <div aria-describedby="home-search-note" className="mt-7">
                <label
                  className="mb-2 block text-sm font-semibold text-foreground"
                  htmlFor="home-search-preview"
                >
                  {t('searchLabel')}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    disabled
                    id="home-search-preview"
                    placeholder={t('searchPlaceholder')}
                    type="search"
                  />
                  <Button disabled type="button">
                    {t('searchAction')}
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted" id="home-search-note">
                  {t('searchComingSoon')}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section aria-labelledby="featured-word-heading">
          <SectionHeading
            eyebrow={t('featuredEyebrow')}
            id="featured-word-heading"
            title={t('featuredTitle')}
          />
          <div className="mt-8">
            {home.featuredWord ? (
              <Card
                className="relative overflow-hidden border-l-4 border-l-accent-500 p-7 sm:p-10"
                data-testid={`featured-word-${home.featuredWord.slug}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-24 size-72 rounded-full border border-brand-200/60 bg-brand-50/50 dark:border-brand-800/40 dark:bg-brand-950/20"
                />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.45fr)] lg:items-end">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="accent">{t('newestBadge')}</Badge>
                      <Badge tone="brand">{home.featuredWord.cefrLevel}</Badge>
                      <Badge>{t(`wordTypes.${home.featuredWord.wordType}`)}</Badge>
                    </div>
                    <h3
                      className="mt-7 text-balance font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-6xl"
                      lang="de"
                    >
                      {home.featuredWord.lemma}
                    </h3>
                    <SupportSnippet
                      className="mt-5 max-w-2xl text-base leading-7"
                      support={home.featuredWord.support}
                    />
                  </div>
                  <Link
                    className={buttonStyles({
                      className: 'w-full sm:w-auto lg:justify-self-end',
                      size: 'lg',
                    })}
                    href={`/words/${home.featuredWord.slug}`}
                  >
                    {t('openWord')}
                    <ArrowRight aria-hidden="true" size={19} />
                  </Link>
                </div>
              </Card>
            ) : (
              <HomeEmptyState
                description={t('emptyWordsDescription')}
                title={t('emptyWordsTitle')}
              />
            )}
          </div>
        </section>

        <section aria-labelledby="beginner-words-heading">
          <SectionHeading
            description={t('beginnerDescription')}
            eyebrow={t('beginnerEyebrow')}
            id="beginner-words-heading"
            title={t('beginnerTitle')}
          />
          {home.beginnerWords.length > 0 ? (
            <div
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="beginner-word-grid"
            >
              {home.beginnerWords.map((word) => (
                <div className="relative" key={word.slug}>
                  <WordCard word={word} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <HomeEmptyState
                description={t('emptyWordsDescription')}
                title={t('emptyWordsTitle')}
              />
            </div>
          )}
        </section>

        <section aria-labelledby="topics-heading">
          <SectionHeading
            description={t('topicsDescription')}
            eyebrow={t('topicsEyebrow')}
            id="topics-heading"
            title={t('topicsTitle')}
          />
          {home.topics.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.topics.map((topic, index) => (
                <Card
                  className={cn(
                    'relative overflow-hidden p-6 shadow-sm',
                    index === 0 && 'sm:col-span-2 lg:col-span-1',
                  )}
                  key={topic.slug}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-brand-800 dark:text-brand-200">
                      <Tags aria-hidden="true" size={19} strokeWidth={1.8} />
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold text-foreground" lang="de">
                    {topic.name}
                  </h3>
                  <SupportSnippet className="mt-3" support={topic.description} />
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <HomeEmptyState
                description={t('emptyTopicsDescription')}
                title={t('emptyTopicsTitle')}
              />
            </div>
          )}
        </section>

        <section aria-labelledby="next-lessons-heading">
          <SectionHeading
            eyebrow={t('nextEyebrow')}
            id="next-lessons-heading"
            title={t('nextTitle')}
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {[
              {
                description: t('grammarDescription'),
                icon: BookOpenCheck,
                title: t('grammarTitle'),
              },
              {
                description: t('scenariosDescription'),
                icon: MessageCircleMore,
                title: t('scenariosTitle'),
              },
            ].map(({ description, icon: Icon, title }) => (
              <Card className="relative overflow-hidden bg-surface-muted/70 p-7 sm:p-8" key={title}>
                <div className="flex items-start justify-between gap-5">
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950">
                    <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                  </span>
                  <Badge tone="accent">{t('comingSoon')}</Badge>
                </div>
                <h3 className="mt-8 font-display text-3xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-3 max-w-xl leading-7 text-muted">{description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            <Compass aria-hidden="true" size={16} />
            {t('roadmapNote')}
            <Sparkles aria-hidden="true" size={15} />
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
