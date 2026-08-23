import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type CardProps = ComponentPropsWithoutRef<'div'>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface-raised shadow-md',
        className,
      )}
      {...props}
    />
  )
}
