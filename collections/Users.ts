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
import {
  enforceSignupRateLimit,
  enforceSignupSubmission,
  forceLearnerDefaults,
  rejectSuspendedLogin,
} from './hooks/users'

/**
 * Identity: credentials, role, account status, and the two preferences every
 * role has. How a *learner* wants to study lives next door in
 * `learner-profiles`.
 *
 * `create` is open to anonymous visitors, because signing up must not require
 * an account to already exist. Payload cannot disable its public REST endpoint
 * per collection, so every signup rule lives in the hooks below rather than in
 * the server action — that is what keeps `POST /api/users` and the public form
 * subject to exactly the same constraints. Two guards make that safe:
 *
 * - `role` and `accountStatus` carry admin-only *field* access, and field
 *   access deletes a value the caller may not write rather than raising, so an
 *   injected `role: 'admin'` is gone before any collection hook runs.
 * - `forceLearnerDefaults` then sets the trusted values outright.
 *
 * There is deliberately no first-user promotion. Admins are provisioned by
 * `pnpm seed`; nothing reachable from the network can mint one.
 */
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
  auth: {
    // Stated rather than inherited, because the signup and login rules below
    // depend on them. Seven days suits a learning app that people return to a
    // few times a week; the lockout is Payload's own brute-force defence and
    // complements the per-client signup limiter.
    lockTime: 10 * 60 * 1000,
    maxLoginAttempts: 5,
    tokenExpiration: 60 * 60 * 24 * 7,
    verify: false,
  },
  hooks: {
    beforeLogin: [rejectSuspendedLogin],
    beforeOperation: [enforceSignupRateLimit],
    // Order matters: validate the payload, then force the trusted role and
    // status, which runs after field access has already stripped any injected
    // value.
    beforeValidate: [enforceSignupSubmission, forceLearnerDefaults],
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
