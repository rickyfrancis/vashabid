export interface DuplicateWordCandidate {
  _status?: unknown
  id: number | string
  lemma?: unknown
  lifecycleStatus?: unknown
  wordType?: unknown
}

export interface WordPreviewLink {
  label: 'বাংলা preview' | 'English preview'
  locale: 'bn' | 'en'
  url: string
}

export interface SavedWordPreviewState {
  _status?: unknown
  lifecycleStatus?: unknown
  slug?: unknown
}

export function normalizeWordLemma(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE')
    : ''
}

export function buildDuplicateWordsQuery(
  lemma: string,
  wordType: string,
  currentID?: number | string,
): string {
  const params = new URLSearchParams({
    depth: '0',
    draft: 'true',
    limit: '25',
  })
  params.set('where[and][0][lemma][contains]', lemma.trim())
  params.set('where[and][1][wordType][equals]', wordType)

  if (currentID !== undefined) {
    params.set('where[and][2][id][not_equals]', String(currentID))
  }

  return `/api/words?${params.toString()}`
}

export function findDuplicateWords(
  candidates: DuplicateWordCandidate[],
  lemma: string,
  wordType: string,
  currentID?: number | string,
): DuplicateWordCandidate[] {
  const normalizedLemma = normalizeWordLemma(lemma)

  return candidates.filter(
    (candidate) =>
      String(candidate.id) !== String(currentID ?? '') &&
      normalizeWordLemma(candidate.lemma) === normalizedLemma &&
      candidate.wordType === wordType,
  )
}

export function getLocalizedWordPreviewLinks(
  word: SavedWordPreviewState | null | undefined,
): WordPreviewLink[] {
  if (
    word?._status !== 'published' ||
    word.lifecycleStatus !== 'active' ||
    typeof word.slug !== 'string' ||
    word.slug.trim().length === 0
  ) {
    return []
  }

  const slug = encodeURIComponent(word.slug)

  return [
    {
      label: 'English preview',
      locale: 'en',
      url: `/en/words/${slug}`,
    },
    {
      label: 'বাংলা preview',
      locale: 'bn',
      url: `/bn/words/${slug}`,
    },
  ]
}

export function getWordPreviewGuidance(
  word: SavedWordPreviewState | null | undefined,
): string {
  if (typeof word?.slug !== 'string' || word.slug.trim().length === 0) {
    return 'Save the word with a public URL slug before opening previews.'
  }

  if (word.lifecycleStatus === 'archived') {
    return 'Set the public lifecycle to Active before opening previews.'
  }

  if (word._status !== 'published') {
    return 'Publish this word before opening its public previews.'
  }

  return ''
}
