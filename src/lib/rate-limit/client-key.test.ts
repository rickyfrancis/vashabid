import { describe, expect, test } from 'vitest'

import { resolveClientKey, UNKNOWN_CLIENT_KEY } from './client-key'

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries)
}

describe('resolveClientKey', () => {
  test('uses the last forwarded hop, not the client-supplied first one', () => {
    const spoofed = resolveClientKey(
      headers({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }),
    )
    const direct = resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' }))

    expect(spoofed).toBe(direct)
  })

  test('a client cannot change its bucket by prepending addresses', () => {
    const first = resolveClientKey(
      headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }),
    )
    const second = resolveClientKey(
      headers({ 'x-forwarded-for': '2.2.2.2, 203.0.113.7' }),
    )

    expect(first).toBe(second)
  })

  test('separates distinct clients', () => {
    expect(resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' }))).not.toBe(
      resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.8' })),
    )
  })

  test('tolerates padding and empty entries', () => {
    expect(
      resolveClientKey(headers({ 'x-forwarded-for': ' 1.1.1.1 ,  203.0.113.7 ' })),
    ).toBe(resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' })))
  })

  test('falls back to x-real-ip', () => {
    expect(resolveClientKey(headers({ 'x-real-ip': '203.0.113.9' }))).toBe(
      resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.9' })),
    )
  })

  test('prefers the forwarded header over x-real-ip', () => {
    expect(
      resolveClientKey(
        headers({ 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '203.0.113.9' }),
      ),
    ).toBe(resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' })))
  })

  test('honours a configured forwarded header name', () => {
    expect(
      resolveClientKey(headers({ 'cf-connecting-ip': '203.0.113.7' }), 'cf-connecting-ip'),
    ).toBe(resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' })))
  })

  test.each([
    ['no headers at all', undefined],
    ['an empty header set', headers({})],
    ['a blank forwarded header', headers({ 'x-forwarded-for': '' })],
    ['a forwarded header of only separators', headers({ 'x-forwarded-for': ' , , ' })],
    ['a blank x-real-ip', headers({ 'x-real-ip': '   ' })],
  ])('falls back to the shared bucket for %s', (_label, value) => {
    expect(resolveClientKey(value)).toBe(UNKNOWN_CLIENT_KEY)
  })

  test('never returns the raw address', () => {
    const key = resolveClientKey(headers({ 'x-forwarded-for': '203.0.113.7' }))

    expect(key).not.toContain('203.0.113.7')
    expect(key).toMatch(/^[0-9a-f]{32}$/)
  })
})
