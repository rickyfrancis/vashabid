import { ArrowRight, Tags } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge, Card } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { SupportSnippet } from './support-snippet'
import type { WordBrowseCardViewModel } from './types'

export function WordCard({
  testIdPrefix,
  word,
}: {
  testIdPrefix: 'browse-word' | 'search-word'
  word: WordBrowseCardViewModel
}) {
  const t = useTranslations('Words')
  const wordType = useTranslations('WordTypes')

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden border-t-4 border-t-brand-700 p-5 transition duration-200 hover:-translate-y-1 hover:border-t-accent-500 hover:shadow-lg dark:border-t-brand-300"
      data-testid={`${testIdPrefix}-${word.slug}`}
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
