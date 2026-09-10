import { describe, expect, test } from 'vitest'

import { SlidingWindowRateLimiter } from './sliding-window'

/** Injected clock so no test depends on wall-clock time. */
function clock(start = 1_000_000) {
  let current = start
  return {
    advance: (ms: number) => {
      current += ms
    },
    now: () => current,
  }
}

function limiter(limit = 3, windowMs = 10_000, time = clock()) {
  return {
    subject: new SlidingWindowRateLimiter({ limit, windowMs }, time.now),
    time,
  }
}

describe('SlidingWindowRateLimiter', () => {
  test('allows hits up to the limit', () => {
    const { subject } = limiter(3)

    expect(subject.consume('a')).toEqual({ allowed: true, retryAfterMs: 0 })
    expect(subject.consume('a')).toEqual({ allowed: true, retryAfterMs: 0 })
    expect(subject.consume('a')).toEqual({ allowed: true, retryAfterMs: 0 })
  })

  test('blocks the hit that would exceed the limit', () => {
    const { subject } = limiter(2)

    subject.consume('a')
    subject.consume('a')

    expect(subject.consume('a')).toEqual({
      allowed: false,
      retryAfterMs: 10_000,
    })
  })

  test('reports the wait until the oldest hit leaves the window', () => {
    const { subject, time } = limiter(1, 10_000)

    subject.consume('a')
    time.advance(4_000)

    expect(subject.consume('a')).toEqual({
      allowed: false,
      retryAfterMs: 6_000,
    })
  })

  test('allows again once the window has slid past the old hits', () => {
    const { subject, time } = limiter(1, 10_000)

    subject.consume('a')
    time.advance(10_001)

    expect(subject.consume('a')).toEqual({ allowed: true, retryAfterMs: 0 })
  })

  test('lets a partially aged window through without a full reset', () => {
    const { subject, time } = limiter(2, 10_000)

    subject.consume('a')
    time.advance(6_000)
    subject.consume('a')
    expect(subject.consume('a').allowed).toBe(false)

    // Only the first hit ages out, which frees exactly one slot.
    time.advance(4_001)
    expect(subject.consume('a').allowed).toBe(true)
    expect(subject.consume('a').allowed).toBe(false)
  })

  test('counts each key independently', () => {
    const { subject } = limiter(1)

    expect(subject.consume('a').allowed).toBe(true)
    expect(subject.consume('b').allowed).toBe(true)
    expect(subject.consume('a').allowed).toBe(false)
  })

  test('prunes keys whose hits have all aged out', () => {
    const store = new Map<string, number[]>()
    const time = clock()
    const subject = new SlidingWindowRateLimiter(
      { limit: 5, windowMs: 1_000 },
      time.now,
      store,
    )

    subject.consume('cold')
    expect(store.has('cold')).toBe(true)

    time.advance(1_001)
    subject.consume('warm')

    expect(store.has('cold')).toBe(false)
    expect(store.has('warm')).toBe(true)
  })

  test('does not grow the store while a client stays blocked', () => {
    const store = new Map<string, number[]>()
    const subject = new SlidingWindowRateLimiter(
      { limit: 1, windowMs: 10_000 },
      clock().now,
      store,
    )

    for (let attempt = 0; attempt < 20; attempt += 1) subject.consume('a')

    expect(store.get('a')).toHaveLength(1)
  })

  test('a zero limit blocks everything', () => {
    const { subject } = limiter(0)

    expect(subject.consume('a').allowed).toBe(false)
  })
})
