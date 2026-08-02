import { describe, test, expect } from 'vitest'

describe('jest-dom matchers', () => {
  test('toBeInTheDocument and toHaveTextContent work', () => {
    document.body.innerHTML = '<div>hello</div>'
    const el = document.querySelector('div')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('hello')
  })
})
