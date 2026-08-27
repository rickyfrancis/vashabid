import { getPayload } from 'payload'
import configPromise from '@payload-config'

let cached: ReturnType<typeof getPayload> | null = null

export function getPayloadClient() {
  cached ??= getPayload({ config: configPromise })
  return cached
}
