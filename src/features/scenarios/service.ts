import type { GrammarTopic, Scenario, TopicTag, Word } from '@payload-types'

import { GrammarRepository } from '@/features/grammar/repository'
import { GrammarService } from '@/features/grammar/service'
import { TopicTagRepository } from '@/features/topics/repository'
import { WordRepository } from '@/features/words/repository'
import { WordService } from '@/features/words/service'
import { cleanRows, cleanText } from '@/lib/content'
import {
  cefrLevels,
  isRichTextEmpty,
  richTextToPlainText,
  type CefrLevel,
} from '@/lib/payload/fields'
import type { RichTextValue } from '@/lib/payload/fields'
import { situationTypes, type SituationType } from './constants'
import { ScenarioRepository } from './repository'
import type {
  ScenarioBrowseCanonicalQuery,
  ScenarioBrowseCardViewModel,
  ScenarioBrowseFilters,
  ScenarioBrowseResult,
  ScenarioBrowseSearchParams,
  ScenarioDetailLanguageViewModel,
  ScenarioDetailPageViewModel,
  ScenarioLinkViewModel,
} from './types'
import type { WordBrowseTopicViewModel } from '@/features/words/types'

function relationshipID(value: number | GrammarTopic | Word): number {
  return typeof value === 'number' ? value : value.id
}

function richText(value: unknown): RichTextValue | null {
  if (value === null || value === undefined) return null
  return isRichTextEmpty(value) ? null : (value as RichTextValue)
}

const SUMMARY_LENGTH = 180

/**
 * Browse and search cards show a short gloss rather than the full explanation,
 * so rich text is flattened and clipped on a word boundary.
 */
function summarize(value: RichTextValue): string {
  const text = richTextToPlainText(value)
  if (text.length <= SUMMARY_LENGTH) return text

  const clipped = text.slice(0, SUMMARY_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

function readSingleValue(
  value: string | string[] | undefined,
): { isCanonical: boolean; value?: string } {
  if (value === undefined) return { isCanonical: true }
  if (Array.isArray(value)) return { isCanonical: false }

  const trimmed = value.trim()
  return trimmed && trimmed === value
    ? { isCanonical: true, value }
    : { isCanonical: false }
}

function isCefrLevel(value: string): value is CefrLevel {
  return cefrLevels.some((level) => level === value)
}

function isSituationType(value: string): value is SituationType {
  return situationTypes.some((situation) => situation === value)
}

function toTopicOption(topic: TopicTag): WordBrowseTopicViewModel | null {
  const name = topic.name.trim()
  const slug = topic.slug.trim()
  return name && slug ? { name, slug } : null
}

function resolveTopics(
  scenario: Scenario,
  publishedTopics: TopicTag[],
): WordBrowseTopicViewModel[] {
  const relatedIDs = new Set(
    (scenario.topicTags ?? []).map((tag) =>
      typeof tag === 'number' ? tag : tag.id,
    ),
  )

  return publishedTopics
    .filter((candidate) => relatedIDs.has(candidate.id))
    .map(toTopicOption)
    .filter((candidate) => candidate !== null)
}

/**
 * Maps a relationship list to view models in the editor's chosen order.
 *
 * Scenarios point at two collections, so the ordering, de-duplication, and
 * drop-if-unpublished rules that words and grammar each spell out inline are
 * factored out once here. Documents missing from `available` were filtered out
 * by the published-only lookup and must not appear.
 */
function orderedRelated<TDoc extends { id: number }, TViewModel>(
  references: (number | TDoc)[] | null | undefined,
  available: TDoc[],
  toViewModel: (doc: TDoc) => TViewModel | null,
): TViewModel[] {
  const byID = new Map(available.map((doc) => [doc.id, doc]))
  const seen = new Set<number>()

  return (references ?? [])
    .map((reference) => {
      const id = typeof reference === 'number' ? reference : reference.id
      if (seen.has(id)) return null
      seen.add(id)

      const doc = byID.get(id)
      return doc ? toViewModel(doc) : null
    })
    .filter((viewModel) => viewModel !== null)
}

/**
 * Bangla is only ever exposed once the independent Bangla review flag is set,
 * matching the rule already applied to words and grammar.
 */
function isBanglaApproved(scenario: Scenario): boolean {
  return scenario.review?.banglaReviewed === true
}

function toEnglishSupport(
  scenario: Scenario,
): ScenarioDetailLanguageViewModel | null {
  const explanation = richText(scenario.english?.explanation)
  if (!explanation) return null

  return {
    culturalNotes: cleanRows(scenario.english.culturalNotes, 'note'),
    explanation,
  }
}

function toBanglaSupport(
  scenario: Scenario,
): ScenarioDetailLanguageViewModel | null {
  if (!isBanglaApproved(scenario) || !scenario.bangla) return null

  const explanation = richText(scenario.bangla.explanation)
  const culturalNotes = cleanRows(scenario.bangla.culturalNotes, 'note')

  if (!explanation && culturalNotes.length === 0) return null

  return { culturalNotes, explanation }
}

export function toScenarioBrowseQuery(
  filters: ScenarioBrowseFilters,
): ScenarioBrowseCanonicalQuery {
  return {
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.situation ? { situation: filters.situation } : {}),
    ...(filters.topic ? { topic: filters.topic } : {}),
    ...(filters.page > 1 ? { page: String(filters.page) } : {}),
  }
}

export function normalizeScenarioBrowseSearchParams(
  searchParams: ScenarioBrowseSearchParams,
): { filters: ScenarioBrowseFilters; isCanonical: boolean } {
  const supportedKeys = new Set(['level', 'page', 'situation', 'topic'])
  let isCanonical = Object.keys(searchParams).every((key) =>
    supportedKeys.has(key),
  )
  const filters: ScenarioBrowseFilters = { page: 1 }

  const level = readSingleValue(searchParams.level)
  if (level.value && isCefrLevel(level.value)) {
    filters.level = level.value
  } else if (level.value) {
    isCanonical = false
  }
  isCanonical &&= level.isCanonical

  const situation = readSingleValue(searchParams.situation)
  if (situation.value && isSituationType(situation.value)) {
    filters.situation = situation.value
  } else if (situation.value) {
    isCanonical = false
  }
  isCanonical &&= situation.isCanonical

  const topic = readSingleValue(searchParams.topic)
  if (topic.value) filters.topic = topic.value
  isCanonical &&= topic.isCanonical

  const page = readSingleValue(searchParams.page)
  if (page.value) {
    const parsedPage = Number(page.value)
    if (
      /^\d+$/.test(page.value) &&
      Number.isSafeInteger(parsedPage) &&
      parsedPage > 0
    ) {
      filters.page = parsedPage
      if (parsedPage === 1 || String(parsedPage) !== page.value) {
        isCanonical = false
      }
    } else {
      isCanonical = false
    }
  }
  isCanonical &&= page.isCanonical

  return { filters, isCanonical }
}

export class ScenarioService {
  constructor(
    private readonly scenarioRepository: Pick<
      ScenarioRepository,
      'findPublishedBySlug' | 'findPublishedPage'
    > = new ScenarioRepository(),
    private readonly topicRepository: Pick<
      TopicTagRepository,
      'findForBrowse'
    > = new TopicTagRepository(),
    private readonly wordRepository: Pick<
      WordRepository,
      'findPublishedByIDs'
    > = new WordRepository(),
    private readonly grammarRepository: Pick<
      GrammarRepository,
      'findPublishedByIDs'
    > = new GrammarRepository(),
    private readonly wordService: Pick<
      WordService,
      'toRelatedWord'
    > = new WordService(),
    private readonly grammarService: Pick<
      GrammarService,
      'toGrammarLink'
    > = new GrammarService(),
  ) {}

  toScenarioLink(scenario: Scenario): ScenarioLinkViewModel | null {
    const title = cleanText(scenario.title)
    const slug = cleanText(scenario.slug)

    if (!title || !slug) return null

    return {
      cefrLevel: scenario.cefrLevel,
      situationType: scenario.situationType,
      slug,
      title,
    }
  }

  toBrowseCard(
    scenario: Scenario,
    publishedTopics: TopicTag[],
  ): ScenarioBrowseCardViewModel | null {
    const title = cleanText(scenario.title)
    const slug = cleanText(scenario.slug)
    const learnerGoal = cleanText(scenario.learnerGoal)
    const english = richText(scenario.english?.explanation)

    if (!title || !slug || !learnerGoal || !english) return null

    const bangla = isBanglaApproved(scenario)
      ? richText(scenario.bangla?.explanation)
      : null

    return {
      cefrLevel: scenario.cefrLevel,
      learnerGoal,
      situationType: scenario.situationType,
      slug,
      support: {
        bangla: bangla ? summarize(bangla) : null,
        english: summarize(english),
      },
      title,
      topics: resolveTopics(scenario, publishedTopics),
    }
  }

  toDetailPage(
    scenario: Scenario,
    publishedTopics: TopicTag[],
    keyVocabulary: Word[],
    grammarTopics: GrammarTopic[],
  ): ScenarioDetailPageViewModel | null {
    const english = toEnglishSupport(scenario)
    const title = cleanText(scenario.title)
    const slug = cleanText(scenario.slug)
    const learnerGoal = cleanText(scenario.learnerGoal)

    if (!english || !title || !slug || !learnerGoal) return null

    const approvedBangla = isBanglaApproved(scenario)
    const dialogue = (scenario.dialogue ?? [])
      .map((line) => {
        const germanLine = cleanText(line.germanLine)
        const englishExplanation = cleanText(line.englishExplanation)
        const speaker = cleanText(line.speaker)
        if (!germanLine || !englishExplanation || !speaker) return null

        return {
          germanLine,
          speaker,
          support: {
            bangla: approvedBangla ? cleanText(line.banglaExplanation) : null,
            english: englishExplanation,
          },
        }
      })
      .filter((line) => line !== null)

    return {
      cefrLevel: scenario.cefrLevel,
      dialogue,
      grammarTopics: orderedRelated(
        scenario.relatedGrammarTopics,
        grammarTopics,
        (topic) => this.grammarService.toGrammarLink(topic),
      ),
      keyVocabulary: orderedRelated(scenario.keyVocabulary, keyVocabulary, (word) =>
        this.wordService.toRelatedWord(word),
      ),
      learnerGoal,
      situationType: scenario.situationType,
      slug,
      support: {
        bangla: toBanglaSupport(scenario),
        english,
      },
      title,
      topics: resolveTopics(scenario, publishedTopics),
    }
  }

  async getDetailPage(
    slug: string,
  ): Promise<ScenarioDetailPageViewModel | null> {
    const scenario = await this.scenarioRepository.findPublishedBySlug(slug)
    if (!scenario) return null

    const wordIDs = [
      ...new Set((scenario.keyVocabulary ?? []).map(relationshipID)),
    ]
    const grammarIDs = [
      ...new Set((scenario.relatedGrammarTopics ?? []).map(relationshipID)),
    ]
    const [publishedTopics, keyVocabulary, grammarTopics] = await Promise.all([
      this.topicRepository.findForBrowse(),
      this.wordRepository.findPublishedByIDs(wordIDs),
      this.grammarRepository.findPublishedByIDs(grammarIDs),
    ])

    return this.toDetailPage(
      scenario,
      publishedTopics,
      keyVocabulary,
      grammarTopics,
    )
  }

  async getBrowsePage(
    searchParams: ScenarioBrowseSearchParams,
  ): Promise<ScenarioBrowseResult> {
    const normalized = normalizeScenarioBrowseSearchParams(searchParams)
    const publishedTopics = await this.topicRepository.findForBrowse()
    const topicOptions = publishedTopics
      .map(toTopicOption)
      .filter((topic) => topic !== null)
    const selectedTopic = normalized.filters.topic
      ? publishedTopics.find(
          (topic) => topic.slug === normalized.filters.topic,
        )
      : undefined

    if (normalized.filters.topic && !selectedTopic) {
      delete normalized.filters.topic
      normalized.isCanonical = false
    }

    if (!normalized.isCanonical) {
      return {
        kind: 'redirect',
        query: toScenarioBrowseQuery(normalized.filters),
      }
    }

    const result = await this.scenarioRepository.findPublishedPage({
      cefrLevel: normalized.filters.level,
      page: normalized.filters.page,
      situationType: normalized.filters.situation,
      topicId: selectedTopic?.id,
    })
    const lastPage = result.totalPages > 0 ? result.totalPages : 1

    if (normalized.filters.page > lastPage) {
      return {
        kind: 'redirect',
        query: toScenarioBrowseQuery({
          ...normalized.filters,
          page: lastPage,
        }),
      }
    }

    return {
      kind: 'page',
      page: {
        filters: normalized.filters,
        options: {
          levels: cefrLevels,
          situations: situationTypes,
          topics: topicOptions,
        },
        pagination: {
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          page: normalized.filters.page,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
        },
        scenarios: result.docs
          .map((scenario) => this.toBrowseCard(scenario, publishedTopics))
          .filter((scenario) => scenario !== null),
      },
    }
  }
}
