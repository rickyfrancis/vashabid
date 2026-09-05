import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  CollectionSlug,
  ValidationFieldError,
} from 'payload'
import { Forbidden, ValidationError } from 'payload'

import { getActivePayloadUser } from '../../src/lib/payload/access/values'

export const enforceEditorDrafts: CollectionBeforeOperationHook = ({
  args,
  operation,
  overrideAccess,
  req,
}) => {
  if (overrideAccess) return args

  const user = getActivePayloadUser(req.user)

  if (
    user?.role === 'editor' &&
    (operation === 'create' ||
      operation === 'update' ||
      operation === 'restoreVersion') &&
    args.draft !== true
  ) {
    throw new Forbidden(req.t)
  }

  return args
}

export function isNonEmptyText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Reads a field from an update, falling back to the stored document.
 *
 * `Object.hasOwn` matters here: a partial update that omits a field must keep
 * the stored value instead of treating it as cleared.
 */
export function valueFromUpdate(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
  field: string,
): unknown {
  return Object.hasOwn(data, field) ? data[field] : originalDoc[field]
}

/**
 * Same fallback rule, one level deeper, for values inside a learner-support
 * group such as `english.meanings` or `english.explanation`.
 */
export function nestedValueFromUpdate(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
  group: string,
  field: string,
): unknown {
  const storedGroup = originalDoc[group] as
    | Record<string, unknown>
    | null
    | undefined

  if (!Object.hasOwn(data, group)) return storedGroup?.[field]

  const incoming = data[group]
  if (incoming === null || typeof incoming !== 'object') return undefined

  return Object.hasOwn(incoming, field)
    ? (incoming as Record<string, unknown>)[field]
    : storedGroup?.[field]
}

/**
 * Records whether the current write is a publish attempt.
 *
 * `versions.drafts.validate` is `false` so drafts may be incomplete. Publish
 * intent is only known in `beforeOperation`, so it is stashed on `req.context`
 * for the matching `beforeValidate` hook to consume.
 */
export function createPublicationIntentHook(
  contextKey: string,
): CollectionBeforeOperationHook {
  return ({ args, operation, req }) => {
    if (
      operation === 'create' ||
      operation === 'update' ||
      operation === 'restoreVersion'
    ) {
      req.context[contextKey] = args.draft !== true
    }

    return args
  }
}

export function createPublicationValidationHook<TInput>({
  collection,
  contextKey,
  merge,
  validate,
}: {
  collection: CollectionSlug
  contextKey: string
  merge: (data?: TInput, originalDoc?: TInput) => TInput
  validate: (input: TInput) => ValidationFieldError[]
}): CollectionBeforeValidateHook {
  return ({ data, originalDoc, req }) => {
    if (req.context[contextKey] !== true) return data

    const errors = validate(merge(data as TInput, originalDoc as TInput))

    if (errors.length > 0) {
      throw new ValidationError({
        collection,
        errors,
        id: originalDoc?.id,
        req,
      })
    }

    return data
  }
}
