import { ArrowRight, MessagesSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge, Card } from '@/components/ui'
import { Link } from '@/features/i18n/navigation'
import type { ScenarioLinkViewModel } from './types'

/**
 * The compact scenario card used by the word and grammar detail pages to point
 * back at the conversations that put their content to work.
 */
export function ScenarioSummaryCard({
  scenario,
  testId,
}: {
  scenario: ScenarioLinkViewModel
  testId?: string
}) {
  const situation = useTranslations('SituationTypes')

  return (
    <Card
      className="group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{scenario.cefrLevel}</Badge>
          <Badge className="gap-1.5">
            <MessagesSquare aria-hidden="true" size={12} />
            {situation(scenario.situationType)}
          </Badge>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="text-accent-600 transition group-hover:translate-x-1 dark:text-accent-300"
          size={18}
        />
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
        <Link
          className="rounded-md underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          href={`/scenarios/${scenario.slug}`}
          lang="de"
        >
          {scenario.title}
        </Link>
      </h3>
    </Card>
  )
}
