import type { TopicTag } from '@payload-types'

import { findPublished } from '@/lib/payload'

export class TopicTagRepository {
  constructor(private readonly find = findPublished) {}

  async findForHome(limit: number): Promise<TopicTag[]> {
    const { docs } = await this.find('topic-tags', {
      depth: 0,
      limit,
      sort: ['sortOrder', 'name'],
    })

    return docs as TopicTag[]
  }

  async findForBrowse(): Promise<TopicTag[]> {
    const { docs } = await this.find('topic-tags', {
      depth: 0,
      pagination: false,
      sort: ['sortOrder', 'name'],
    })

    return docs as TopicTag[]
  }
}
