import { describe, test, expect } from 'vitest'
import { createFixture } from '@/test/fixtures'

type TestDefaults = {
  id: number
  name: string
  role: string
}

const defaults: TestDefaults = {
  id: 1,
  name: 'test',
  role: 'admin',
}

describe('createFixture', () => {
  test('returns exact defaults when called with no overrides', () => {
    const make = createFixture(defaults)
    expect(make()).toEqual(defaults)
  })

  test('merges partial overrides with defaults', () => {
    const make = createFixture(defaults)
    expect(make({ name: 'override' })).toEqual({
      id: 1,
      name: 'override',
      role: 'admin',
    })
  })

  test('does not mutate the original defaults object', () => {
    const make = createFixture(defaults)
    const snapshot = { ...defaults }
    make({ name: 'override' })
    expect(defaults).toEqual(snapshot)
  })

  test('produces deterministic output for repeated calls with same input', () => {
    const make = createFixture(defaults)
    const overrides = { name: 'same', role: 'learner' }
    const first = make(overrides)
    const second = make(overrides)
    expect(first).toEqual(second)
  })
})
