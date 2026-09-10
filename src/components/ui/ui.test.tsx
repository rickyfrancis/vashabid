import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/render'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  SegmentedControl,
  Select,
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

  test('select is a labeled native combobox carrying its options', () => {
    render(
      <>
        <label htmlFor="feedback-type">Problem</label>
        <Select defaultValue="wrong-cefr" id="feedback-type">
          <option value="bad-example">Bad example</option>
          <option value="wrong-cefr">Wrong CEFR level</option>
        </Select>
      </>,
    )

    const select = screen.getByRole('combobox', { name: 'Problem' })
    expect(select).toHaveValue('wrong-cefr')
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  test('select exposes native invalid and disabled semantics', () => {
    render(
      <>
        <Select aria-invalid="true" aria-label="Broken">
          <option value="a">A</option>
        </Select>
        <Select aria-label="Unavailable" disabled>
          <option value="a">A</option>
        </Select>
      </>,
    )

    expect(screen.getByRole('combobox', { name: 'Broken' })).toBeInvalid()
    expect(screen.getByRole('combobox', { name: 'Unavailable' })).toBeDisabled()
  })

  test('select changes value through native interaction', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="Problem" defaultValue="a" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    )

    const select = screen.getByRole('combobox', { name: 'Problem' })
    fireEvent.change(select, { target: { value: 'b' } })

    expect(select).toHaveValue('b')
    expect(onChange).toHaveBeenCalledOnce()
  })

  test('select picks one height per size and appends custom classes', () => {
    render(
      <>
        <Select aria-label="Default">
          <option value="a">A</option>
        </Select>
        <Select aria-label="Large" className="mt-2" size="lg">
          <option value="a">A</option>
        </Select>
      </>,
    )

    const standard = screen.getByRole('combobox', { name: 'Default' })
    const large = screen.getByRole('combobox', { name: 'Large' })

    // Height is a prop, not a className override, so the two utilities must
    // never appear together on one element.
    expect(standard).toHaveClass('h-11')
    expect(standard).not.toHaveClass('h-12')
    expect(large).toHaveClass('h-12')
    expect(large).not.toHaveClass('h-11')
    expect(large).toHaveClass('mt-2')
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
