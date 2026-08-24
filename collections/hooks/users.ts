import {
  AuthenticationError,
  type CollectionBeforeLoginHook,
  type CollectionBeforeValidateHook,
} from 'payload'

interface UserHookData {
  id: number | string
  role?: 'admin' | 'editor' | 'learner' | null
  accountStatus?: 'active' | 'suspended' | null
}

export const promoteFirstUser: CollectionBeforeValidateHook<
  UserHookData
> = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data

  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
  })

  if (totalDocs === 0) {
    data.role = 'admin'
    data.accountStatus = 'active'
  }

  return data
}

export const rejectSuspendedLogin: CollectionBeforeLoginHook<
  UserHookData
> = ({ req, user }) => {
  if (user.accountStatus !== 'active') {
    throw new AuthenticationError(req.t)
  }

  return user
}
