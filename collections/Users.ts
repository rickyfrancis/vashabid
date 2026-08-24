import type { CollectionConfig } from 'payload'

import {
  accountStatuses,
  canAccessAdminPanel,
  canCreateUsers,
  canDeleteUsers,
  canManageUserSecurityFields,
  canReadUsers,
  canUnlockUsers,
  canUpdateOwnEmail,
  canUpdateUsers,
  userRoles,
} from '../src/lib/payload/access'
import { locales } from '../src/features/i18n/types'
import { supportModes } from '../src/features/i18n/support-mode'
import { promoteFirstUser, rejectSuspendedLogin } from './hooks/users'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: canAccessAdminPanel,
    create: canCreateUsers,
    delete: canDeleteUsers,
    read: canReadUsers,
    unlock: canUnlockUsers,
    update: canUpdateUsers,
  },
  admin: {
    defaultColumns: ['email', 'displayName', 'role', 'accountStatus'],
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeLogin: [rejectSuspendedLogin],
    beforeValidate: [promoteFirstUser],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      access: {
        update: canUpdateOwnEmail,
      },
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Display name',
    },
    {
      name: 'role',
      type: 'select',
      access: {
        create: canManageUserSecurityFields,
        update: canManageUserSecurityFields,
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'learner',
      options: userRoles.map((role) => ({
        label: role[0].toUpperCase() + role.slice(1),
        value: role,
      })),
      required: true,
      saveToJWT: true,
    },
    {
      name: 'accountStatus',
      type: 'select',
      access: {
        create: canManageUserSecurityFields,
        update: canManageUserSecurityFields,
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'active',
      label: 'Account status',
      options: accountStatuses.map((status) => ({
        label: status[0].toUpperCase() + status.slice(1),
        value: status,
      })),
      required: true,
      saveToJWT: true,
    },
    {
      name: 'uiLocale',
      type: 'select',
      defaultValue: 'en',
      label: 'Interface language',
      options: locales.map((locale) => ({
        label: locale === 'en' ? 'English' : 'Bangla',
        value: locale,
      })),
      required: true,
    },
    {
      name: 'supportMode',
      type: 'select',
      defaultValue: 'en',
      label: 'Learning support',
      options: supportModes.map((mode) => ({
        label:
          mode === 'both'
            ? 'English and Bangla'
            : mode === 'en'
              ? 'English'
              : 'Bangla',
        value: mode,
      })),
      required: true,
    },
  ],
}
