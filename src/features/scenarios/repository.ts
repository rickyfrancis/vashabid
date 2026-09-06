import type { Scenario } from '@payload-types'
import type { PaginatedDocs, Where } from 'payload'

import { findPublished } from '@/lib/payload'
import { SCENARIO_BROWSE_PAGE_SIZE } from './constants'
import type { ScenarioBrowseRepositoryFilters } from './types'

export class ScenarioRepository {
  constructor(private readonly find = findPublished) {}

  async findPublishedBySlug(slug: string): Promise<Scenario | null> {
    const { docs } = await this.find('scenarios', {
      depth: 0,
      limit: 1,
      where: {
        slug: { equals: slug },
      },
    })

    return (docs[0] as Scenario | undefined) ?? null
  }

  async findForBrowse(): Promise<Scenario[]> {
    const { docs } = await this.find('scenarios', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'title', 'slug'],
    })

    return docs as Scenario[]
  }

  /**
   * Reverse lookup used by word detail pages: which published scenarios teach
   * this word as key vocabulary.
   */
  async findPublishedByKeyWordID(wordId: number): Promise<Scenario[]> {
    const { docs } = await this.find('scenarios', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'title', 'slug'],
      where: {
        keyVocabulary: { in: [wordId] },
      },
    })

    return docs as Scenario[]
  }

  /**
   * Reverse lookup used by grammar detail pages: which published scenarios put
   * this pattern into a conversation.
   */
  async findPublishedByGrammarTopicID(topicId: number): Promise<Scenario[]> {
    const { docs } = await this.find('scenarios', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'title', 'slug'],
      where: {
        relatedGrammarTopics: { in: [topicId] },
      },
    })

    return docs as Scenario[]
  }

  async findPublishedPage(
    filters: ScenarioBrowseRepositoryFilters,
  ): Promise<PaginatedDocs<Scenario>> {
    const clauses: Where[] = []

    if (filters.cefrLevel) {
      clauses.push({ cefrLevel: { equals: filters.cefrLevel } })
    }
    if (filters.situationType) {
      clauses.push({ situationType: { equals: filters.situationType } })
    }
    if (filters.topicId !== undefined) {
      clauses.push({ topicTags: { equals: filters.topicId } })
    }

    return (await this.find('scenarios', {
      depth: 0,
      limit: SCENARIO_BROWSE_PAGE_SIZE,
      page: filters.page,
      sort: ['cefrLevel', 'title', 'slug'],
      ...(clauses.length > 0 ? { where: { and: clauses } } : {}),
    })) as PaginatedDocs<Scenario>
  }
}
