import { getPayloadClient } from '../getPayload'
import { seedTopicTags } from './seedTopicTags'

async function runSeed(): Promise<void> {
  const payload = await getPayloadClient()
  const summary = await seedTopicTags(payload)

  payload.logger.info(
    `Topic tags seeded: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged.`,
  )
}

try {
  await runSeed()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
