import type { Word } from '@payload-types'

import { findPublished } from '@/lib/payload'

export class WordRepository {
  constructor(private readonly find = findPublished) {}

  async findNewestPublished(): Promise<Word | null> {
    const { docs } = await this.find('words', {
      depth: 0,
      limit: 1,
      sort: '-createdAt',
      where: {
        lifecycleStatus: { equals: 'active' },
      },
    })

    return (docs[0] as Word | undefined) ?? null
  }

  async findBeginnerPublished(limit: number): Promise<Word[]> {
    const { docs } = await this.find('words', {
      depth: 0,
      limit,
      sort: ['cefrLevel', 'lemma'],
      where: {
        and: [
          { lifecycleStatus: { equals: 'active' } },
          { cefrLevel: { in: ['A1', 'A2'] } },
        ],
      },
    })

    return docs as Word[]
  }
}
