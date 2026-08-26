import { beforeEach, describe, expect, test, vi } from 'vitest'

const { getPayload } = vi.hoisted(() => ({ getPayload: vi.fn() }))

vi.mock('payload', () => ({ getPayload }))
vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))

describe('getPayloadClient', () => {
  beforeEach(() => {
    vi.resetModules()
    getPayload.mockReset()
  })

  test('shares one initialization promise across concurrent first requests', async () => {
    const client = { find: vi.fn() }
    getPayload.mockResolvedValue(client)
    const { getPayloadClient } = await import('./getPayload')

    const first = getPayloadClient()
    const second = getPayloadClient()

    expect(first).toBe(second)
    await expect(Promise.all([first, second])).resolves.toEqual([client, client])
    expect(getPayload).toHaveBeenCalledOnce()
  })
})
