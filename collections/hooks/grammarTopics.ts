import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  ValidationFieldError,
} from 'payload'

import {
  isRichTextEmpty,
  type RichTextValue,
} from '../../src/lib/payload/fields'
import {
  createPublicationIntentHook,
  createPublicationValidationHook,
  isNonEmptyText,
  nestedValueFromUpdate,
  valueFromUpdate,
} from './content'

export interface GrammarTopicPublicationInput {
  cefrLevel?: unknown
  english?: {
    explanation?: unknown
  } | null
  name?: unknown
  shortRule?: unknown
}

const validatePublicationContext = 'validateGrammarTopicPublication'

function hasEnglishExplanation(value: unknown): boolean {
  if (value === null || value === undefined) return false

  return !isRichTextEmpty(value as RichTextValue)
}

export function mergeGrammarTopicPublicationInput(
  data: GrammarTopicPublicationInput | undefined,
  originalDoc: GrammarTopicPublicationInput | undefined,
): GrammarTopicPublicationInput {
  const update = (data ?? {}) as Record<string, unknown>
  const original = (originalDoc ?? {}) as Record<string, unknown>

  return {
    cefrLevel: valueFromUpdate(update, original, 'cefrLevel'),
    english: {
      explanation: nestedValueFromUpdate(
        update,
        original,
        'english',
        'explanation',
      ),
    },
    name: valueFromUpdate(update, original, 'name'),
    shortRule: valueFromUpdate(update, original, 'shortRule'),
  }
}

export function validateGrammarTopicForPublication(
  input: GrammarTopicPublicationInput,
): ValidationFieldError[] {
  const errors: ValidationFieldError[] = []

  if (!isNonEmptyText(input.name)) {
    errors.push({
      message:
        'Enter the German grammar topic name in German identity before publishing.',
      path: 'name',
    })
  }

  if (!isNonEmptyText(input.cefrLevel)) {
    errors.push({
      message: 'Choose a CEFR level in German identity before publishing.',
      path: 'cefrLevel',
    })
  }

  if (!isNonEmptyText(input.shortRule)) {
    errors.push({
      message:
        'Summarise the rule in one German sentence in German identity before publishing.',
      path: 'shortRule',
    })
  }

  if (!hasEnglishExplanation(input.english?.explanation)) {
    errors.push({
      message:
        'Write a non-empty explanation in English support before publishing.',
      path: 'english.explanation',
    })
  }

  return errors
}

export const markGrammarTopicPublicationIntent: CollectionBeforeOperationHook =
  createPublicationIntentHook(validatePublicationContext)

export const enforceGrammarTopicPublication: CollectionBeforeValidateHook =
  createPublicationValidationHook<GrammarTopicPublicationInput>({
    collection: 'grammar-topics',
    contextKey: validatePublicationContext,
    merge: mergeGrammarTopicPublicationInput,
    validate: validateGrammarTopicForPublication,
  })
