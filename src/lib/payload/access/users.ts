import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { isAdmin } from './policies'
import { getActivePayloadUser } from './values'

type AdminAccess = NonNullable<
  NonNullable<CollectionConfig['access']>['admin']
>

function selfScope(id: number | string): Where {
  return {
    id: {
      equals: id,
    },
  }
}

function editorScope(id: number | string): Where {
  return {
    or: [
      selfScope(id),
      {
        role: {
          equals: 'learner',
        },
      },
    ],
  }
}

export const canAccessAdminPanel: AdminAccess = ({ req }) => {
  const user = getActivePayloadUser(req.user)
  return user?.role === 'admin' || user?.role === 'editor'
}

export const canCreateUsers: Access = isAdmin
export const canDeleteUsers: Access = isAdmin
export const canUnlockUsers: Access = isAdmin

export const canReadUsers: Access = ({ req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false
  if (user.role === 'admin') return true
  if (user.role === 'editor') return editorScope(user.id)

  return selfScope(user.id)
}

export const canUpdateUsers: Access = ({ data, req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false
  if (user.role === 'admin') return true

  const scope = selfScope(user.id)

  if (user.role === 'learner' || data?.password !== undefined) {
    return scope
  }

  return editorScope(user.id)
}

export const canManageUserSecurityFields: FieldAccess = ({ req }) => {
  const user = getActivePayloadUser(req.user)
  return user?.role === 'admin'
}

export const canUpdateOwnEmail: FieldAccess = ({ id, req }) => {
  const user = getActivePayloadUser(req.user)

  if (!user) return false
  if (user.role === 'admin') return true

  return id !== undefined && id === user.id
}
