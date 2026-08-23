'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

export type SegmentedControlOption<T extends string> = {
  disabled?: boolean
  label: string
  value: T
}

export type SegmentedControlProps<T extends string> = {
  className?: string
  description?: string
  disabled?: boolean
  label: string
  name?: string
  onChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  value: T
}

export function SegmentedControl<T extends string>({
  className,
  description,
  disabled = false,
  label,
  name,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  const generatedId = useId()
  const groupName = name ?? `segmented-${generatedId}`
  const descriptionId = description ? `${generatedId}-description` : undefined

  return (
    <fieldset
      aria-describedby={descriptionId}
      className={cn('min-w-0', className)}
      disabled={disabled}
    >
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="mt-2 grid auto-cols-fr grid-flow-col rounded-xl border border-border-strong bg-surface-muted p-1 shadow-inner">
        {options.map((option) => {
          const optionId = `${generatedId}-${option.value}`

          return (
            <div className="relative min-w-0" key={option.value}>
              <input
                checked={value === option.value}
                className="peer sr-only"
                disabled={disabled || option.disabled}
                id={optionId}
                name={groupName}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <label
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-sm font-medium text-muted transition hover:text-foreground peer-checked:bg-surface-raised peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                htmlFor={optionId}
              >
                {option.label}
              </label>
            </div>
          )
        })}
      </div>
      {description ? (
        <p className="mt-2 max-w-xl text-xs leading-5 text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
    </fieldset>
  )
}
