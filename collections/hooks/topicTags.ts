import type {
  CollectionBeforeOperationHook,
  PayloadRequest,
  RelationshipFieldSingleValidation,
} from 'payload'
import { Forbidden } from 'payload'

import { getActivePayloadUser } from '../../src/lib/payload/access/values'

const cycleMessage = 'A topic tag cannot be its own parent or descendant.'

function relationshipID(value: unknown): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') return value

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : null
  }

  return null
}

function sameID(left: number | string, right: number | string): boolean {
  return String(left) === String(right)
}

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

export const validateTopicTagParent: RelationshipFieldSingleValidation = async (
  value,
  { id, req },
) => {
  const parentID = relationshipID(value)

  if (parentID === null) return true
  if (id !== undefined && sameID(parentID, id)) return cycleMessage

  const visited = new Set<string>()
  let currentID: number | string | null = parentID

  while (currentID !== null) {
    const key = String(currentID)

    if (visited.has(key)) return cycleMessage
    if (id !== undefined && sameID(currentID, id)) return cycleMessage

    visited.add(key)

    const parent = await req.payload.findByID({
      collection: 'topic-tags',
      depth: 0,
      draft: true,
      id: currentID,
      overrideAccess: true,
      req: req as PayloadRequest,
    })

    currentID = relationshipID(parent.parent)
  }

  return true
}
