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

export interface ScenarioDialogueInput {
  englishExplanation?: unknown
  germanLine?: unknown
}

export interface ScenarioPublicationInput {
  cefrLevel?: unknown
  dialogue?: unknown
  english?: {
    explanation?: unknown
  } | null
  learnerGoal?: unknown
  situationType?: unknown
  title?: unknown
}

const validatePublicationContext = 'validateScenarioPublication'

function hasEnglishExplanation(value: unknown): boolean {
  if (value === null || value === undefined) return false

  return !isRichTextEmpty(value as RichTextValue)
}

/**
 * A scenario without a usable dialogue line has nothing to practise, so unlike
 * grammar examples the transcript is a publish blocker. A line only counts when
 * the German source and its required English explanation are both present.
 */
function hasUsableDialogueLine(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        isNonEmptyText((entry as ScenarioDialogueInput).germanLine) &&
        isNonEmptyText((entry as ScenarioDialogueInput).englishExplanation),
    )
  )
}

export function mergeScenarioPublicationInput(
  data: ScenarioPublicationInput | undefined,
  originalDoc: ScenarioPublicationInput | undefined,
): ScenarioPublicationInput {
  const update = (data ?? {}) as Record<string, unknown>
  const original = (originalDoc ?? {}) as Record<string, unknown>

  return {
    cefrLevel: valueFromUpdate(update, original, 'cefrLevel'),
    dialogue: valueFromUpdate(update, original, 'dialogue'),
    english: {
      explanation: nestedValueFromUpdate(
        update,
        original,
        'english',
        'explanation',
      ),
    },
    learnerGoal: valueFromUpdate(update, original, 'learnerGoal'),
    situationType: valueFromUpdate(update, original, 'situationType'),
    title: valueFromUpdate(update, original, 'title'),
  }
}

export function validateScenarioForPublication(
  input: ScenarioPublicationInput,
): ValidationFieldError[] {
  const errors: ValidationFieldError[] = []

  if (!isNonEmptyText(input.title)) {
    errors.push({
      message:
        'Enter the German scenario title in German identity before publishing.',
      path: 'title',
    })
  }

  if (!isNonEmptyText(input.cefrLevel)) {
    errors.push({
      message: 'Choose a CEFR level in German identity before publishing.',
      path: 'cefrLevel',
    })
  }

  if (!isNonEmptyText(input.situationType)) {
    errors.push({
      message: 'Choose a situation type in German identity before publishing.',
      path: 'situationType',
    })
  }

  if (!isNonEmptyText(input.learnerGoal)) {
    errors.push({
      message:
        'State the learner goal in one German sentence in German identity before publishing.',
      path: 'learnerGoal',
    })
  }

  if (!hasEnglishExplanation(input.english?.explanation)) {
    errors.push({
      message:
        'Write a non-empty explanation in English support before publishing.',
      path: 'english.explanation',
    })
  }

  if (!hasUsableDialogueLine(input.dialogue)) {
    errors.push({
      message:
        'Add at least one dialogue line with a German line and an English explanation before publishing.',
      path: 'dialogue',
    })
  }

  return errors
}

export const markScenarioPublicationIntent: CollectionBeforeOperationHook =
  createPublicationIntentHook(validatePublicationContext)

export const enforceScenarioPublication: CollectionBeforeValidateHook =
  createPublicationValidationHook<ScenarioPublicationInput>({
    collection: 'scenarios',
    contextKey: validatePublicationContext,
    merge: mergeScenarioPublicationInput,
    validate: validateScenarioForPublication,
  })
