import type {
  HomeWordViewModel,
  LearnerSupportViewModel,
} from '@/features/words/types'

export type { HomeWordViewModel } from '@/features/words/types'

export interface HomeTopicViewModel {
  description: LearnerSupportViewModel
  name: string
  slug: string
}

export interface HomePageViewModel {
  beginnerWords: HomeWordViewModel[]
  featuredWord: HomeWordViewModel | null
  topics: HomeTopicViewModel[]
}
