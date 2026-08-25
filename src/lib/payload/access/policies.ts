import type { Access, Where } from 'payload'

import { getActivePayloadUser } from './values'
import type { UserRole } from './values'

function hasRole(
  user: unknown,
  roles: UserRole[],
): boolean {
  const activeUser = getActivePayloadUser(user)
  return activeUser ? roles.includes(activeUser.role) : false
}

export const isAdmin: Access = ({ req }) =>
  hasRole(req.user, ['admin'])

export const isEditor: Access = ({ req }) =>
  hasRole(req.user, ['editor'])

export const isAdminOrEditor: Access = ({ req }) =>
  hasRole(req.user, ['admin', 'editor'])

export const isLearner: Access = ({ req }) =>
  hasRole(req.user, ['learner'])

export const isSelf: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false

  return {
    id: {
      equals: user.id,
    },
  }
}

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (getActivePayloadUser(req.user)) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}

export const publishedOrEditorial: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (user?.role === 'admin' || user?.role === 'editor') return true

  return {
    _status: {
      equals: 'published',
    },
  }
}

export const publishedActiveOrEditorial: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (user?.role === 'admin' || user?.role === 'editor') return true

  const publicConstraint: Where = {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        lifecycleStatus: {
          equals: 'active',
        },
      },
    ],
  }

  return publicConstraint
}
