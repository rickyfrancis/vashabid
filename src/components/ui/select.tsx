import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

export type SelectSize = 'lg' | 'md'

export type SelectProps = {
  /** `md` matches `Input`; `lg` matches the taller filter and tool controls. */
  size?: SelectSize
} & Omit<ComponentPropsWithRef<'select'>, 'size'>

const sizeStyles: Record<SelectSize, string> = {
  lg: 'h-12',
  md: 'h-11',
}

/**
 * Native `<select>` sibling of `Input` and `Textarea`, sharing their border,
 * focus ring, and invalid styling so a form can mix all three without drift.
 *
 * Kept as a real `<select>` rather than a custom listbox: it stays keyboard
 * accessible, uses the platform picker on mobile, and works inside a plain
 * form with no JavaScript.
 *
 * Height is a prop rather than a `className` override because `cn` is a plain
 * join with no conflict resolution, so two competing height utilities would
 * resolve by stylesheet order rather than by intent.
 */
export function Select({ className, size = 'md', ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-border-strong bg-surface px-3 text-base text-foreground shadow-sm outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error/20',
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  )
}
