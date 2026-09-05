import { ArrowRight, Tags } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge, Card } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { SupportSnippet } from '@/features/words/support-snippet'
import type { GrammarBrowseCardViewModel } from './types'

export function GrammarCard({
  testIdPrefix,
  topic,
}: {
  testIdPrefix: 'browse-grammar' | 'search-grammar'
  topic: GrammarBrowseCardViewModel
}) {
  const t = useTranslations('Grammar')

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden border-t-4 border-t-brand-700 p-5 transition duration-200 hover:-translate-y-1 hover:border-t-accent-500 hover:shadow-lg dark:border-t-brand-300"
      data-testid={`${testIdPrefix}-${topic.slug}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-12 -top-12 size-28 rounded-full border border-brand-200/60 bg-brand-50/50 transition group-hover:scale-110 dark:border-brand-800/50 dark:bg-brand-950/25"
      />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <Badge tone="brand">{topic.cefrLevel}</Badge>
          <ArrowRight
            aria-hidden="true"
            className="mt-1 text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
            size={19}
            strokeWidth={1.7}
          />
        </div>

        <h2 className="mt-7 text-balance font-display text-2xl font-semibold tracking-tight text-foreground">
          <Link
            className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={`/grammar/${topic.slug}`}
            lang="de"
          >
            {topic.name}
          </Link>
        </h2>

        <p
          className="mt-3 border-l-2 border-accent-400 pl-3 text-sm italic leading-6 text-foreground"
          lang="de"
        >
          {topic.shortRule}
        </p>

        <SupportSnippet className="mt-3" support={topic.support} />

        <div className="mt-auto pt-6">
          {topic.topics.length > 0 ? (
            <div
              aria-label={t('cardTopics')}
              className="flex flex-wrap gap-2 border-t border-border pt-4"
            >
              {topic.topics.map((tag) => (
                <Badge className="gap-1.5" key={tag.slug}>
                  <Tags aria-hidden="true" size={12} />
                  {tag.name}
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
