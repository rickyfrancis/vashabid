import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type PageContainerProps = ComponentPropsWithoutRef<'div'> & {
  size?: 'standard' | 'narrow'
}

export function PageContainer({
  className,
  size = 'standard',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8 lg:px-10',
        size === 'standard' ? 'max-w-7xl' : 'max-w-4xl',
        className,
      )}
      {...props}
    />
  )
}
