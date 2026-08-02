/**
 * Creates a test fixture with guaranteed override behavior.
 * All values are deterministic. No random data, timestamps, or UUIDs.
 */
export function createFixture<T extends Record<string, unknown>>(
  defaults: T,
): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({ ...defaults, ...overrides })
}
