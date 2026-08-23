import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-muted text-foreground',
  brand:
    'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200',
  accent:
    'border-accent-300 bg-accent-100 text-accent-900 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-200',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  error: 'border-error/30 bg-error/10 text-error',
}

export type BadgeProps = ComponentPropsWithoutRef<'span'> & {
  tone?: BadgeTone
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none tracking-wide',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}
