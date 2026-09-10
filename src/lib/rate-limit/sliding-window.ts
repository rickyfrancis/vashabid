export interface RateLimitOptions {
  /** Maximum number of allowed hits inside one window. */
  limit: number
  /** Length of the sliding window in milliseconds. */
  windowMs: number
}

export interface RateLimitDecision {
  allowed: boolean
  /** Milliseconds until the oldest hit in the window expires. `0` when allowed. */
  retryAfterMs: number
}

/**
 * A sliding-window counter held in process memory.
 *
 * The clock and the backing store are injected so the whole thing is
 * deterministic under test: no timers, no sleeping, no wall-clock reads.
 *
 * This is deliberately *not* a distributed limiter. The window lives in one
 * Node process, so it resets on deploy and is not shared between instances.
 * That is good enough to stop a naive script; Phase 24 introduces real rate
 * limiting alongside the translation provider and should absorb this.
 */
export class SlidingWindowRateLimiter {
  constructor(
    private readonly options: RateLimitOptions,
    private readonly now: () => number = Date.now,
    private readonly hits = new Map<string, number[]>(),
  ) {}

  consume(key: string): RateLimitDecision {
    const timestamp = this.now()
    const windowStart = timestamp - this.options.windowMs

    this.pruneColdKeys(windowStart)

    const recent = (this.hits.get(key) ?? []).filter(
      (hit) => hit > windowStart,
    )

    if (recent.length >= this.options.limit) {
      this.hits.set(key, recent)
      const oldest = recent[0] as number

      return {
        allowed: false,
        retryAfterMs: Math.max(0, oldest + this.options.windowMs - timestamp),
      }
    }

    recent.push(timestamp)
    this.hits.set(key, recent)

    return { allowed: true, retryAfterMs: 0 }
  }

  /**
   * Drops keys whose every hit has aged out. Without this the map grows once
   * per distinct client forever, which is a slow memory leak on a public form.
   */
  private pruneColdKeys(windowStart: number): void {
    for (const [key, timestamps] of this.hits) {
      const last = timestamps.at(-1)

      if (last === undefined || last <= windowStart) {
        this.hits.delete(key)
      }
    }
  }
}
