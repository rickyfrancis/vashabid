export const userRoles = ['admin', 'editor', 'learner'] as const
export type UserRole = (typeof userRoles)[number]

export const accountStatuses = ['active', 'suspended'] as const
export type AccountStatus = (typeof accountStatuses)[number]

export interface ActivePayloadUser {
  id: number | string
  collection: 'users'
  role: UserRole
  accountStatus: 'active'
}

function isUserRole(value: unknown): value is UserRole {
  return userRoles.some((role) => role === value)
}

export function getActivePayloadUser(
  value: unknown,
): ActivePayloadUser | null {
  if (!value || typeof value !== 'object') return null

  const user = value as Record<string, unknown>
  const hasValidID =
    typeof user.id === 'number' || typeof user.id === 'string'

  if (
    !hasValidID ||
    user.collection !== 'users' ||
    user.accountStatus !== 'active' ||
    !isUserRole(user.role)
  ) {
    return null
  }

  return user as unknown as ActivePayloadUser
}
