import type { Access, Where } from 'payload'

import { isAdmin } from './policies'
import { getActivePayloadUser } from './values'

/**
 * A learner profile is user-owned data, so ownership is expressed as a `Where`
 * on the `user` relationship rather than on `id`. That is the difference from
 * `isSelf`, which scopes the `users` collection by its own primary key.
 */
function ownerScope(id: number | string): Where {
  return {
    user: {
      equals: id,
    },
  }
}

/**
 * Editors keep the reach they already have over learner preferences: they may
 * see and adjust learner profiles, but the profile of another admin or editor
 * is not theirs to read. Expressed as a query so Payload filters the list view
 * rather than refusing it outright.
 */
function learnerOwnedScope(): Where {
  return {
    'user.role': {
      equals: 'learner',
    },
  }
}

export const canReadLearnerProfiles: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'editor') return learnerOwnedScope()

  return ownerScope(user.id)
}

/**
 * Any active signed-in user may create *a* profile; which user it belongs to is
 * not their choice. `forceProfileOwner` overwrites `data.user` with the
 * authenticated id, and `preventDuplicateProfile` stops a second one, so this
 * policy only has to answer "is there somebody here at all".
 */
export const canCreateLearnerProfiles: Access = ({ req }) =>
  Boolean(getActivePayloadUser(req.user))

export const canUpdateLearnerProfiles: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'editor') return learnerOwnedScope()

  return ownerScope(user.id)
}

export const canDeleteLearnerProfiles: Access = isAdmin
