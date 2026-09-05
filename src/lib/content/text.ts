/**
 * Defensive text helpers shared by feature services that map Payload documents
 * into public view models.
 *
 * Stored content can contain whitespace-only strings and partially filled array
 * rows. Normalizing here keeps every mapper's emptiness checks consistent.
 */

export function cleanText(value: null | string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

export function cleanRows<K extends string>(
  rows: null | undefined | Array<Record<K, null | string | undefined>>,
  key: K,
): string[] {
  return (
    rows
      ?.map((row) => cleanText(row[key]))
      .filter((value): value is string => value !== null) ?? []
  )
}

export function firstRow<K extends string>(
  rows: null | undefined | Array<Record<K, null | string | undefined>>,
  key: K,
): string | null {
  return cleanRows(rows, key)[0] ?? null
}
