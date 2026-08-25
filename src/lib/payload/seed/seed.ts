import { getPayloadClient } from '../getPayload'
import { seedTopicTags } from './seedTopicTags'
import { seedWords } from './seedWords'

async function runSeed(): Promise<void> {
  const payload = await getPayloadClient()
  const topicSummary = await seedTopicTags(payload)
  const wordSummary = await seedWords(payload)

  payload.logger.info(
    `Topic tags seeded: ${topicSummary.created} created, ${topicSummary.updated} updated, ${topicSummary.unchanged} unchanged.`,
  )
  payload.logger.info(
    `Words seeded: ${wordSummary.created} created, ${wordSummary.updated} updated, ${wordSummary.unchanged} unchanged.`,
  )
}

try {
  await runSeed()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
