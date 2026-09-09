import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = ComponentPropsWithRef<'textarea'>

/**
 * Multi-line sibling of `Input`. Shares the same border, focus ring, and
 * invalid styling so a form can mix the two without visual drift.
 */
export function Textarea({ className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full resize-y rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-base leading-7 text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20',
        className,
      )}
      rows={rows}
      {...props}
    />
  )
}
