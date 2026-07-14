import { getPayload } from 'payload'
import configPromise from '@payload-config'

let cached: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadClient() {
  if (cached) return cached
  cached = await getPayload({ config: configPromise })
  return cached
}
