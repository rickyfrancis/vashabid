import type { GrammarTopic } from '@payload-types'
import type { PaginatedDocs, Where } from 'payload'

import { findPublished } from '@/lib/payload'
import { GRAMMAR_BROWSE_PAGE_SIZE } from './constants'
import type { GrammarBrowseRepositoryFilters } from './types'

export class GrammarRepository {
  constructor(private readonly find = findPublished) {}

  async findPublishedBySlug(slug: string): Promise<GrammarTopic | null> {
    const { docs } = await this.find('grammar-topics', {
      depth: 0,
      limit: 1,
      where: {
        slug: { equals: slug },
      },
    })

    return (docs[0] as GrammarTopic | undefined) ?? null
  }

  async findForBrowse(): Promise<GrammarTopic[]> {
    const { docs } = await this.find('grammar-topics', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'name', 'slug'],
    })

    return docs as GrammarTopic[]
  }

  /**
   * Reverse lookup used by word detail pages: which published grammar topics
   * name this word as an example of their pattern.
   */
  async findPublishedByRelatedWordID(
    wordId: number,
  ): Promise<GrammarTopic[]> {
    const { docs } = await this.find('grammar-topics', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'name', 'slug'],
      where: {
        relatedWords: { in: [wordId] },
      },
    })

    return docs as GrammarTopic[]
  }

  async findPublishedPage(
    filters: GrammarBrowseRepositoryFilters,
  ): Promise<PaginatedDocs<GrammarTopic>> {
    const clauses: Where[] = []

    if (filters.cefrLevel) {
      clauses.push({ cefrLevel: { equals: filters.cefrLevel } })
    }
    if (filters.topicId !== undefined) {
      clauses.push({ topicTags: { equals: filters.topicId } })
    }

    return (await this.find('grammar-topics', {
      depth: 0,
      limit: GRAMMAR_BROWSE_PAGE_SIZE,
      page: filters.page,
      sort: ['cefrLevel', 'name', 'slug'],
      ...(clauses.length > 0 ? { where: { and: clauses } } : {}),
    })) as PaginatedDocs<GrammarTopic>
  }
}
