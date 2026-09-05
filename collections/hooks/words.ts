import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  ValidationFieldError,
} from 'payload'

import {
  createPublicationIntentHook,
  createPublicationValidationHook,
  isNonEmptyText,
  nestedValueFromUpdate,
  valueFromUpdate,
} from './content'

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

export function mergeWordPublicationInput(
  data: WordPublicationInput | undefined,
  originalDoc: WordPublicationInput | undefined,
): WordPublicationInput {
  const update = (data ?? {}) as Record<string, unknown>
  const original = (originalDoc ?? {}) as Record<string, unknown>

  return {
    cefrLevel: valueFromUpdate(update, original, 'cefrLevel'),
    english: {
      meanings: nestedValueFromUpdate(update, original, 'english', 'meanings'),
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

export const markWordPublicationIntent: CollectionBeforeOperationHook =
  createPublicationIntentHook(validatePublicationContext)

export const enforceWordPublication: CollectionBeforeValidateHook =
  createPublicationValidationHook<WordPublicationInput>({
    collection: 'words',
    contextKey: validatePublicationContext,
    merge: mergeWordPublicationInput,
    validate: validateWordForPublication,
  })
