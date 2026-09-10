import type { CollectionConfig } from 'payload'

import {
  dailyStudyTargets,
  learningGoals,
  practiceStyles,
  supportLanguages,
  type DailyStudyTarget,
  type LearningGoal,
  type PracticeStyle,
  type SupportLanguage,
} from '../src/features/auth/constants'
import {
  canAccessAdminPanel,
  canCreateLearnerProfiles,
  canDeleteLearnerProfiles,
  canReadLearnerProfiles,
  canUpdateLearnerProfiles,
  isAdminField,
} from '../src/lib/payload/access'
import { createCefrField } from '../src/lib/payload/fields'
import {
  forceProfileOwner,
  preventDuplicateProfile,
  stampOnboardingCompletion,
} from './hooks/learner-profiles'

const supportLanguageLabels: Record<SupportLanguage, string> = {
  bn: 'Bangla',
  en: 'English',
}

const learningGoalLabels: Record<LearningGoal, string> = {
  culture: 'Culture and media',
  exam: 'Passing an exam',
  family: 'Family and friends',
  study: 'Studying in Germany',
  travel: 'Travel',
  work: 'Work',
}

const practiceStyleLabels: Record<PracticeStyle, string> = {
  conversation: 'Conversation',
  grammar: 'Grammar drills',
  listening: 'Listening',
  mixed: 'A mix of everything',
  vocabulary: 'Vocabulary',
}

const dailyStudyTargetLabels: Record<DailyStudyTarget, string> = {
  '5': '5 minutes',
  '10': '10 minutes',
  '20': '20 minutes',
  '30': '30 minutes',
  '60': '60 minutes',
}

/**
 * How one learner wants to study, kept separate from who they are.
 *
 * `users` stays the identity record — credentials, role, account status, and the
 * two preferences every role has (`uiLocale`, `supportMode`). Everything here is
 * meaningful only for a learner, so putting it on `users` would hang six unused
 * fields off every admin and editor account. The split also gives this data its
 * own access surface: a learner owns their profile outright, while `role` and
 * `accountStatus` next door remain admin-only.
 *
 * Like `feedback`, there are no drafts or versions. A profile is current state,
 * not editorial content with a publication lifecycle.
 */
export const LearnerProfiles: CollectionConfig = {
  slug: 'learner-profiles',
  access: {
    admin: canAccessAdminPanel,
    create: canCreateLearnerProfiles,
    delete: canDeleteLearnerProfiles,
    read: canReadLearnerProfiles,
    update: canUpdateLearnerProfiles,
  },
  admin: {
    defaultColumns: [
      'user',
      'germanLevel',
      'learningGoal',
      'dailyStudyTarget',
      'onboardingCompletedAt',
    ],
    description:
      'What each learner told us during onboarding. Learners own their own profile; editors may adjust learner preferences.',
    group: 'Learners',
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      // Ownership is the whole access model here, so repointing an existing
      // profile at a different account is an admin-only act. On create the
      // value is forced from the request rather than accepted.
      access: {
        update: isAdminField,
      },
      admin: {
        description:
          'The account this profile belongs to. Set automatically at signup.',
      },
      hasMany: false,
      index: true,
      label: 'Learner',
      maxDepth: 1,
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primarySupportLanguage',
          type: 'select',
          admin: {
            description:
              'The language this learner wants explanations in first.',
            width: '50%',
          },
          label: 'Primary support language',
          options: supportLanguages.map((value) => ({
            label: supportLanguageLabels[value],
            value,
          })),
          required: true,
        },
        {
          name: 'secondarySupportLanguage',
          type: 'select',
          admin: {
            description:
              'Optional. Choosing a second language sets the account support mode to show both side by side.',
            width: '50%',
          },
          label: 'Secondary support language',
          options: supportLanguages.map((value) => ({
            label: supportLanguageLabels[value],
            value,
          })),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'learningGoal',
          type: 'select',
          admin: {
            description: 'Why the learner is studying German.',
            width: '50%',
          },
          label: 'Learning goal',
          options: learningGoals.map((value) => ({
            label: learningGoalLabels[value],
            value,
          })),
          required: true,
        },
        {
          name: 'practiceStyle',
          type: 'select',
          admin: {
            description: 'The kind of practice they want most of.',
            width: '50%',
          },
          label: 'Preferred practice',
          options: practiceStyles.map((value) => ({
            label: practiceStyleLabels[value],
            value,
          })),
          required: true,
        },
      ],
    },
    {
      name: 'dailyStudyTarget',
      type: 'select',
      admin: {
        description:
          'Minutes per day. A select rather than a number so the stored value is always one of the offered choices.',
      },
      label: 'Daily study target',
      options: dailyStudyTargets.map((value) => ({
        label: dailyStudyTargetLabels[value],
        value,
      })),
      required: true,
    },
    createCefrField({ name: 'germanLevel' }),
    {
      name: 'onboardingCompletedAt',
      type: 'date',
      admin: {
        description:
          'Set once, when onboarding is first completed. Later preference edits do not move it.',
        position: 'sidebar',
        readOnly: true,
      },
      label: 'Onboarding completed',
    },
  ],
  hooks: {
    beforeChange: [stampOnboardingCompletion],
    // Order matters: settle who owns the profile, then check that owner does
    // not already have one.
    beforeValidate: [forceProfileOwner, preventDuplicateProfile],
  },
}
