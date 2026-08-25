import type { CollectionBeforeOperationHook } from 'payload'
import { Forbidden } from 'payload'

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
