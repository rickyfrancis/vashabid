import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/render'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  SegmentedControl,
  Skeleton,
} from '.'

describe('UI primitives', () => {
  test('button preserves native disabled behavior', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Continue' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  test('input exposes native invalid and disabled semantics', () => {
    render(
      <>
        <label htmlFor="email">Email</label>
        <Input aria-invalid="true" id="email" />
        <Input aria-label="Unavailable" disabled />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid()
    expect(screen.getByRole('textbox', { name: 'Unavailable' })).toBeDisabled()
  })

  test('segmented control is a labeled native radio group', () => {
    function Fixture() {
      const [value, setValue] = useState<'en' | 'bn'>('en')
      return (
        <SegmentedControl
          description="Explanation language"
          label="Support"
          onChange={setValue}
          options={[
            { label: 'English', value: 'en' },
            { label: 'বাংলা', value: 'bn' },
          ]}
          value={value}
        />
      )
    }

    render(<Fixture />)
    const group = screen.getByRole('group', { name: 'Support' })
    const bangla = screen.getByRole('radio', { name: 'বাংলা' })

    expect(group).toHaveAccessibleDescription('Explanation language')
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked()
    fireEvent.click(bangla)
    expect(bangla).toBeChecked()
  })

  test('skeleton is decorative inside an announced loading region', () => {
    const { container } = render(
      <div aria-label="Loading lesson" role="status">
        <Skeleton data-testid="skeleton" />
      </div>,
    )

    expect(screen.getByRole('status')).toHaveAccessibleName('Loading lesson')
    expect(container.querySelector('[data-testid="skeleton"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})

describe('shared states', () => {
  test('empty state exposes status semantics and an optional action', () => {
    render(
      <EmptyState
        action={<button type="button">Browse words</button>}
        description="Save a word to begin."
        title="Your list is empty"
      />,
    )

    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Your list is empty',
    )
    expect(screen.getByRole('button', { name: 'Browse words' })).toBeEnabled()
  })

  test('error state announces the failure and action works', () => {
    const retry = vi.fn()
    render(
      <ErrorState
        action={<Button onClick={retry}>Try again</Button>}
        description="The lesson could not be loaded."
        title="Something went wrong"
      />,
    )

    expect(screen.getByRole('alert')).toHaveAccessibleName(
      'Something went wrong',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
