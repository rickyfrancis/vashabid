import { BookOpen, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type StateProps = {
  action?: ReactNode
  className?: string
  description: string
  headingLevel?: 1 | 2
  icon?: LucideIcon
  title: string
}

function StatePanel({
  action,
  className,
  description,
  headingLevel = 1,
  icon: Icon,
  role,
  title,
}: StateProps & { icon: LucideIcon; role?: 'alert' | 'status' }) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-border bg-surface px-6 py-12 text-center shadow-md sm:px-10',
        className,
      )}
      role={role}
    >
      <span className="grid size-12 place-items-center rounded-full border border-accent-300 bg-accent-100 text-accent-800 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-200">
        <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
      </span>
      {headingLevel === 2 ? (
        <h2
          className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          id={titleId}
        >
          {title}
        </h2>
      ) : (
        <h1
          className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          id={titleId}
        >
          {title}
        </h1>
      )}
      <p className="mt-3 max-w-md text-pretty leading-7 text-muted">
        {description}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </section>
  )
}

export function EmptyState({ icon = BookOpen, ...props }: StateProps) {
  return <StatePanel icon={icon} role="status" {...props} />
}

export function ErrorState({ icon = TriangleAlert, ...props }: StateProps) {
  return <StatePanel icon={icon} role="alert" {...props} />
}
