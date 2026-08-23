import type { ComponentPropsWithRef } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200',
  secondary:
    'border border-border-strong bg-surface text-foreground shadow-sm hover:bg-surface-muted active:bg-surface-raised',
  ghost: 'text-foreground hover:bg-surface-muted active:bg-surface',
  danger:
    'bg-error text-white shadow-sm hover:brightness-90 active:brightness-75',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

export function buttonStyles({
  className,
  size = 'md',
  variant = 'primary',
}: {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )
}

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ className, size, variant })}
      type={type}
      {...props}
    />
  )
}
