import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  ValidationFieldError,
} from 'payload'
import { ValidationError } from 'payload'

export interface WordMeaningInput {
  meaning?: unknown
}

export interface WordPublicationInput {
  cefrLevel?: unknown
  english?: {
    meanings?: unknown
  } | null
  lemma?: unknown
  wordType?: unknown
}

const validatePublicationContext = 'validateWordPublication'

function isNonEmptyText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasEnglishMeaning(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        isNonEmptyText((entry as WordMeaningInput).meaning),
    )
  )
}

function valueFromUpdate(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
  field: string,
): unknown {
  return Object.hasOwn(data, field) ? data[field] : originalDoc[field]
}

function meaningsFromUpdate(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
): unknown {
  if (!Object.hasOwn(data, 'english')) {
    return (originalDoc.english as WordPublicationInput['english'])?.meanings
  }

  const english = data.english
  if (english === null || typeof english !== 'object') return undefined

  if (Object.hasOwn(english, 'meanings')) {
    return (english as WordPublicationInput['english'])?.meanings
  }

  return (originalDoc.english as WordPublicationInput['english'])?.meanings
}

export function mergeWordPublicationInput(
  data: WordPublicationInput | undefined,
  originalDoc: WordPublicationInput | undefined,
): WordPublicationInput {
  const update = (data ?? {}) as Record<string, unknown>
  const original = (originalDoc ?? {}) as Record<string, unknown>

  return {
    cefrLevel: valueFromUpdate(update, original, 'cefrLevel'),
    english: {
      meanings: meaningsFromUpdate(update, original),
    },
    lemma: valueFromUpdate(update, original, 'lemma'),
    wordType: valueFromUpdate(update, original, 'wordType'),
  }
}

export function validateWordForPublication(
  input: WordPublicationInput,
): ValidationFieldError[] {
  const errors: ValidationFieldError[] = []

  if (!isNonEmptyText(input.lemma)) {
    errors.push({
      message:
        'Enter the German headword in German identity before publishing.',
      path: 'lemma',
    })
  }

  if (!isNonEmptyText(input.wordType)) {
    errors.push({
      message: 'Choose a word type in German identity before publishing.',
      path: 'wordType',
    })
  }

  if (!isNonEmptyText(input.cefrLevel)) {
    errors.push({
      message: 'Choose a CEFR level in German identity before publishing.',
      path: 'cefrLevel',
    })
  }

  if (!hasEnglishMeaning(input.english?.meanings)) {
    errors.push({
      message:
        'Add at least one non-empty meaning in English support before publishing.',
      path: 'english.meanings',
    })
  }

  return errors
}

export const markWordPublicationIntent: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (
    operation === 'create' ||
    operation === 'update' ||
    operation === 'restoreVersion'
  ) {
    req.context[validatePublicationContext] = args.draft !== true
  }

  return args
}

export const enforceWordPublication: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
}) => {
  if (req.context[validatePublicationContext] !== true) return data

  const errors = validateWordForPublication(
    mergeWordPublicationInput(data, originalDoc),
  )

  if (errors.length > 0) {
    throw new ValidationError({
      collection: 'words',
      errors,
      id: originalDoc?.id,
      req,
    })
  }

  return data
}
