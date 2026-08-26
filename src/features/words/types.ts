import type { Word } from '@payload-types'

export interface LearnerSupportViewModel {
  bangla: string | null
  english: string
}

export interface HomeWordViewModel {
  cefrLevel: Word['cefrLevel']
  lemma: string
  slug: string
  support: LearnerSupportViewModel
  wordType: Word['wordType']
}
