import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge, Card } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import { SupportSnippet } from './support-snippet'
import type { WordDetailRelatedWordViewModel } from './types'

/**
 * The compact word card used wherever another page links into vocabulary:
 * related words on word detail, and the word lists on grammar and scenario
 * detail. Shared rather than duplicated because three surfaces now render it.
 */
export function WordSummaryCard({
  showWordType = true,
  testId,
  word,
}: {
  showWordType?: boolean
  testId?: string
  word: WordDetailRelatedWordViewModel
}) {
  const wordType = useTranslations('WordTypes')

  return (
    <Card
      className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{word.cefrLevel}</Badge>
          {showWordType ? <Badge>{wordType(word.wordType)}</Badge> : null}
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
          href={`/words/${word.slug}`}
        >
          {word.article ? (
            <span className="mr-2 text-base italic text-accent-700 dark:text-accent-300">
              {word.article}
            </span>
          ) : null}
          {word.headword}
        </Link>
      </h3>
      <SupportSnippet className="mt-2" support={word.support} />
    </Card>
  )
}
