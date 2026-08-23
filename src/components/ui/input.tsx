import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = ComponentPropsWithRef<'input'>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20',
        className,
      )}
      {...props}
    />
  )
}
