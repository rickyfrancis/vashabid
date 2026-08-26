import type { Word } from '@payload-types'

import type { HomeWordViewModel } from './types'

function firstMeaning(
  rows: null | undefined | { meaning: string }[],
): string | null {
  const value = rows?.find((row) => row.meaning.trim().length > 0)?.meaning
  return value?.trim() || null
}

export class WordService {
  toHomeCard(word: Word): HomeWordViewModel | null {
    const english = firstMeaning(word.english.meanings)

    if (!english) return null

    const approvedBangla =
      word.review?.banglaReviewed === true
        ? firstMeaning(word.bangla?.meanings)
        : null

    return {
      cefrLevel: word.cefrLevel,
      lemma: word.lemma,
      slug: word.slug,
      support: {
        bangla: approvedBangla,
        english,
      },
      wordType: word.wordType,
    }
  }
}
