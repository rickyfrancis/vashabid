import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type SkeletonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'aria-hidden'
>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}
