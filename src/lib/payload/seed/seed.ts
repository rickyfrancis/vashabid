import { getPayloadClient } from '../getPayload'
import { seedGrammarTopics } from './seedGrammarTopics'
import { seedScenarios } from './seedScenarios'
import { seedTopicTags } from './seedTopicTags'
import { seedUsers } from './seedUsers'
import { seedWords } from './seedWords'

async function runSeed(): Promise<void> {
  const payload = await getPayloadClient()
  // Users come first: an admin must exist before anything else, and nothing
  // reachable over HTTP can create one.
  const userSummary = await seedUsers(payload)
  const topicSummary = await seedTopicTags(payload)
  const wordSummary = await seedWords(payload)
  const grammarSummary = await seedGrammarTopics(payload)
  const scenarioSummary = await seedScenarios(payload)

  payload.logger.info(
    `Users seeded: ${userSummary.created} created, ${userSummary.updated} updated, ${userSummary.unchanged} unchanged.`,
  )
  payload.logger.info(
    `Topic tags seeded: ${topicSummary.created} created, ${topicSummary.updated} updated, ${topicSummary.unchanged} unchanged.`,
  )
  payload.logger.info(
    `Words seeded: ${wordSummary.created} created, ${wordSummary.updated} updated, ${wordSummary.unchanged} unchanged.`,
  )
  payload.logger.info(
    `Grammar topics seeded: ${grammarSummary.created} created, ${grammarSummary.updated} updated, ${grammarSummary.unchanged} unchanged.`,
  )
  payload.logger.info(
    `Scenarios seeded: ${scenarioSummary.created} created, ${scenarioSummary.updated} updated, ${scenarioSummary.unchanged} unchanged.`,
  )
}

try {
  await runSeed()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
