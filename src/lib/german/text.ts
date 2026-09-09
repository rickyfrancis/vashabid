/**
 * German-aware text helpers shared by feature services that match learner input
 * against stored German content.
 *
 * Search matches a query against many documents; the translator matches many
 * tokens of one sentence against known lemmas. Both need the same two things:
 * a predictable Unicode/whitespace normalization, and the set of spellings a
 * learner might plausibly type for the same German word.
 */

const MAX_ALTERNATIVES = 24

/**
 * Spellings German speakers and learners treat as interchangeable. Each group
 * lists the forms that should all resolve to the same word, longest first so
 * digraphs are consumed before their leading single character.
 */
const germanEquivalences = [
  ['ae', 'ä', 'a'],
  ['oe', 'ö', 'o'],
  ['ue', 'ü', 'u'],
  ['ss', 'ß'],
] as const

function equivalenceAt(
  value: string,
  index: number,
): { choices: readonly string[]; length: number } | null {
  for (const choices of germanEquivalences) {
    const match = choices.find((choice) => value.startsWith(choice, index))
    if (match) return { choices, length: match.length }
  }

  return null
}

/**
 * Expands every umlaut and sharp-s spelling of a value, so `madchen`,
 * `maedchen`, and `mädchen` all reach the same word. The raw normalized value
 * is always first, and the total is capped so a long input cannot produce a
 * combinatorial explosion.
 */
export function generateGermanAlternatives(value: string): string[] {
  const normalized = value.normalize('NFC').toLocaleLowerCase('de-DE')
  let alternatives = ['']

  for (let index = 0; index < normalized.length; ) {
    const equivalence = equivalenceAt(normalized, index)
    const choices = equivalence?.choices ?? [normalized[index]]
    const next: string[] = []

    for (const prefix of alternatives) {
      for (const choice of choices) {
        next.push(prefix + choice)
        if (next.length >= MAX_ALTERNATIVES) break
      }
      if (next.length >= MAX_ALTERNATIVES) break
    }

    alternatives = next
    index += equivalence?.length ?? 1
  }

  return [...new Set([normalized, ...alternatives])].slice(0, MAX_ALTERNATIVES)
}

/**
 * Normalizes raw learner input without changing its meaning: composed Unicode
 * so `a` + combining diaeresis equals `ä`, collapsed whitespace, and no
 * surrounding padding. Case is preserved because callers display this value.
 */
export function cleanUserText(value: string): string {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim()
}
