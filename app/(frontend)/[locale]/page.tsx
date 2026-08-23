import { ArrowDownRight, Languages } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageContainer } from '@/components/layout'
import { Badge, Card } from '@/components/ui'

export default function HomePage() {
  const home = useTranslations('Home')
  const support = useTranslations('SupportMode')

  return (
    <PageContainer className="flex flex-1 items-center py-16 sm:py-24 lg:py-28">
      <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-center lg:gap-16">
        <section className="relative max-w-4xl">
          <div
            aria-hidden="true"
            className="absolute -left-5 top-1 hidden h-full w-px bg-accent-500 sm:block"
          />
          <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.22em] text-brand-800 dark:text-brand-200">
            <span className="h-px w-9 bg-brand-700 dark:bg-brand-300" />
            {home('eyebrow')}
          </p>
          <h1 className="mt-6 max-w-4xl text-balance font-display text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
            {home('title')}
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-muted sm:text-xl">
            {home('description')}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone="brand">{support('en')}</Badge>
            <Badge tone="accent">{support('bn')}</Badge>
            <Badge>{support('both')}</Badge>
          </div>
        </section>

        <Card className="relative overflow-hidden p-7 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 size-24 border-b border-l border-border bg-surface-muted/70"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-5">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-800 text-lg font-bold text-white shadow-sm dark:bg-brand-300 dark:text-brand-950">
                03
              </span>
              <ArrowDownRight
                aria-hidden="true"
                className="text-accent-600 dark:text-accent-300"
                size={28}
                strokeWidth={1.5}
              />
            </div>
            <Languages
              aria-hidden="true"
              className="mt-10 text-brand-700 dark:text-brand-300"
              size={26}
              strokeWidth={1.7}
            />
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
              {home('foundationTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              {home('foundationDescription')}
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
