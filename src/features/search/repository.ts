import type { GrammarTopic, TopicTag, Word } from '@payload-types'
import type { PaginatedDocs } from 'payload'

import { findPublished } from '@/lib/payload'
import { richTextToPlainText } from '@/lib/payload/fields'
import { SEARCH_PAGE_SIZE, type SearchToken } from './types'

function normalized(values: string[]): string[] {
  return values
    .filter((value) => value.length > 0)
    .map((value) => value.normalize('NFC').toLocaleLowerCase('de-DE'))
}

function searchableText(word: Word): string[] {
  const values = [
    word.lemma,
    word.slug,
    ...word.english.meanings.map((row) => row.meaning),
  ]

  if (word.review?.banglaReviewed === true && word.bangla) {
    values.push(
      ...(word.bangla.meanings?.map((row) => row.meaning) ?? []),
      ...(word.bangla.romanizedHelper ? [word.bangla.romanizedHelper] : []),
    )
  }

  return normalized(values)
}

/**
 * Grammar topics are searchable through their German name, their one-line rule,
 * and the flattened text of their learner explanations. Bangla is only
 * searchable once the independent Bangla review flag is set, so pending
 * translations cannot be discovered indirectly.
 */
function grammarSearchableText(topic: GrammarTopic): string[] {
  const values = [
    topic.name,
    topic.slug,
    topic.shortRule,
    richTextToPlainText(topic.english?.explanation),
  ]

  if (topic.review?.banglaReviewed === true && topic.bangla) {
    values.push(richTextToPlainText(topic.bangla.explanation))
  }

  return normalized(values)
}

function relationshipID(value: number | TopicTag): number {
  return typeof value === 'number' ? value : value.id
}

export function matchesSearchToken(word: Word, token: SearchToken): boolean {
  const textMatches = token.variants.some((variant) =>
    searchableText(word).some((value) => value.includes(variant)),
  )
  const cefrMatches = token.cefrLevel === word.cefrLevel
  const wordTypeMatches = token.wordType === word.wordType
  const expectedTopics = new Set(token.topicIDs)
  const topicMatches = (word.topicTags ?? []).some((topic) =>
    expectedTopics.has(relationshipID(topic)),
  )

  return textMatches || cefrMatches || wordTypeMatches || topicMatches
}

export function matchesGrammarSearchToken(
  topic: GrammarTopic,
  token: SearchToken,
): boolean {
  const textMatches = token.variants.some((variant) =>
    grammarSearchableText(topic).some((value) => value.includes(variant)),
  )
  const cefrMatches = token.cefrLevel === topic.cefrLevel
  const expectedTopics = new Set(token.topicIDs)
  const topicMatches = (topic.topicTags ?? []).some((tag) =>
    expectedTopics.has(relationshipID(tag)),
  )

  return textMatches || cefrMatches || topicMatches
}

function paginate(words: Word[], page: number): PaginatedDocs<Word> {
  const totalDocs = words.length
  const totalPages = Math.ceil(totalDocs / SEARCH_PAGE_SIZE)
  const start = (page - 1) * SEARCH_PAGE_SIZE
  const docs = words.slice(start, start + SEARCH_PAGE_SIZE)

  return {
    docs,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
    limit: SEARCH_PAGE_SIZE,
    nextPage: page < totalPages ? page + 1 : null,
    page,
    pagingCounter: start + 1,
    prevPage: page > 1 && totalPages > 0 ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}

export class SearchRepository {
  constructor(private readonly find = findPublished) {}

  async findWordPage(
    tokens: SearchToken[],
    page: number,
  ): Promise<PaginatedDocs<Word>> {
    const { docs } = await this.find('words', {
      depth: 0,
      pagination: false,
      sort: ['lemma', 'slug'],
      where: {
        lifecycleStatus: { equals: 'active' },
      },
    })
    const matches = (docs as Word[]).filter((word) =>
      tokens.every((token) => matchesSearchToken(word, token)),
    )

    return paginate(matches, page)
  }

  async findGrammarMatches(
    tokens: SearchToken[],
    limit: number,
  ): Promise<GrammarTopic[]> {
    const { docs } = await this.find('grammar-topics', {
      depth: 0,
      pagination: false,
      sort: ['cefrLevel', 'name', 'slug'],
    })

    return (docs as GrammarTopic[])
      .filter((topic) =>
        tokens.every((token) => matchesGrammarSearchToken(topic, token)),
      )
      .slice(0, limit)
  }
}
