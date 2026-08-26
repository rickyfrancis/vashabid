import type { Word } from '@payload-types'
import type { PaginatedDocs, Where } from 'payload'

import { findPublished } from '@/lib/payload'
import { WORD_BROWSE_PAGE_SIZE } from './constants'
import type { WordBrowseRepositoryFilters } from './types'

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

  async findPublishedBySlug(slug: string): Promise<Word | null> {
    const { docs } = await this.find('words', {
      depth: 0,
      limit: 1,
      where: {
        and: [
          { slug: { equals: slug } },
          { lifecycleStatus: { equals: 'active' } },
        ],
      },
    })

    return (docs[0] as Word | undefined) ?? null
  }

  async findPublishedByIDs(ids: number[]): Promise<Word[]> {
    if (ids.length === 0) return []

    const { docs } = await this.find('words', {
      depth: 0,
      limit: ids.length,
      where: {
        and: [
          { id: { in: ids } },
          { lifecycleStatus: { equals: 'active' } },
        ],
      },
    })

    return docs as Word[]
  }

  async findPublishedPage(
    filters: WordBrowseRepositoryFilters,
  ): Promise<PaginatedDocs<Word>> {
    const clauses: Where[] = [
      { lifecycleStatus: { equals: 'active' } },
    ]

    if (filters.cefrLevel) {
      clauses.push({ cefrLevel: { equals: filters.cefrLevel } })
    }
    if (filters.wordType) {
      clauses.push({ wordType: { equals: filters.wordType } })
    }
    if (filters.topicId !== undefined) {
      clauses.push({ topicTags: { equals: filters.topicId } })
    }

    return (await this.find('words', {
      depth: 0,
      limit: WORD_BROWSE_PAGE_SIZE,
      page: filters.page,
      sort: ['cefrLevel', 'lemma', 'slug'],
      where: { and: clauses },
    })) as PaginatedDocs<Word>
  }
}
