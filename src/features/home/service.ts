import type { TopicTag } from '@payload-types'

import { TopicTagRepository } from '@/features/topics/repository'
import { WordRepository } from '@/features/words/repository'
import { WordService } from '@/features/words/service'
import type {
  HomePageViewModel,
  HomeTopicViewModel,
} from './types'

const BEGINNER_WORD_LIMIT = 6
const TOPIC_LIMIT = 6

function cleanText(value: null | string | undefined): string | null {
  const cleaned = value?.trim()
  return cleaned || null
}

export function toHomeTopic(topic: TopicTag): HomeTopicViewModel | null {
  const english = cleanText(topic.english.description)

  if (!english) return null

  return {
    description: {
      bangla:
        topic.review?.banglaReviewed === true
          ? cleanText(topic.bangla?.description)
          : null,
      english,
    },
    name: topic.name,
    slug: topic.slug,
  }
}

export class HomeService {
  constructor(
    private readonly wordRepository: Pick<
      WordRepository,
      'findBeginnerPublished' | 'findNewestPublished'
    > = new WordRepository(),
    private readonly topicRepository: Pick<TopicTagRepository, 'findForHome'> =
      new TopicTagRepository(),
    private readonly wordService: Pick<WordService, 'toHomeCard'> =
      new WordService(),
  ) {}

  async getHomePage(): Promise<HomePageViewModel> {
    const [featuredDocument, beginnerDocuments, topicDocuments] =
      await Promise.all([
        this.wordRepository.findNewestPublished(),
        this.wordRepository.findBeginnerPublished(BEGINNER_WORD_LIMIT + 1),
        this.topicRepository.findForHome(TOPIC_LIMIT),
      ])

    const featuredWord = featuredDocument
      ? this.wordService.toHomeCard(featuredDocument)
      : null
    const beginnerWords = beginnerDocuments
      .filter((word) => word.slug !== featuredWord?.slug)
      .map((word) => this.wordService.toHomeCard(word))
      .filter((word) => word !== null)
      .slice(0, BEGINNER_WORD_LIMIT)
    const topics = topicDocuments
      .map(toHomeTopic)
      .filter((topic) => topic !== null)

    return { beginnerWords, featuredWord, topics }
  }
}
