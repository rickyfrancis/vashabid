import type { Word } from '@payload-types'

import { findPublished } from '@/lib/payload'

export interface WordPreview {
  cefrLevel: Word['cefrLevel']
  lemma: string
  slug: string
  wordType: Word['wordType']
}

export async function getPublishedWordPreview(
  slug: string,
): Promise<WordPreview | null> {
  const { docs } = await findPublished('words', {
    depth: 0,
    limit: 1,
    where: {
      and: [
        { slug: { equals: slug } },
        { lifecycleStatus: { equals: 'active' } },
      ],
    },
  })
  const word = docs[0] as Word | undefined

  if (!word) return null

  return {
    cefrLevel: word.cefrLevel,
    lemma: word.lemma,
    slug: word.slug,
    wordType: word.wordType,
  }
}
