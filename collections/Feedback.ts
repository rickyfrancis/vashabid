import type { CollectionConfig } from 'payload'

import {
  feedbackContentTypes,
  feedbackStatuses,
  feedbackTypes,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  SLUG_MAX_LENGTH,
} from '../src/features/feedback/constants'
import {
  canAccessAdminPanel,
  isAdmin,
  isAdminField,
  isAdminOrEditor,
  isAdminOrEditorField,
} from '../src/lib/payload/access'
import {
  assertRelatedMatchesType,
  enforceFeedbackRateLimit,
  enforceFeedbackSubmission,
  forceNewFeedbackStatus,
  recordFeedbackModeration,
} from './hooks/feedback'

export {
  feedbackContentTypes,
  feedbackStatuses,
  feedbackTypes,
  type FeedbackContentType,
  type FeedbackStatus,
  type FeedbackType,
} from '../src/features/feedback/constants'

const contentTypeLabels: Record<(typeof feedbackContentTypes)[number], string> = {
  'grammar-topic': 'Grammar topic',
  scenario: 'Scenario',
  word: 'Word',
}

const feedbackTypeLabels: Record<(typeof feedbackTypes)[number], string> = {
  'bad-example': 'Bad example sentence',
  'incorrect-bangla': 'Incorrect Bangla explanation',
  'incorrect-english': 'Incorrect English explanation',
  'incorrect-german': 'Incorrect German',
  'missing-audio': 'Missing audio',
  other: 'Something else',
  'unclear-explanation': 'Unclear explanation',
  'usage-suggestion': 'Context or usage suggestion',
  'wrong-cefr': 'Wrong CEFR level',
}

const statusLabels: Record<(typeof feedbackStatuses)[number], string> = {
  new: 'New',
  rejected: 'Rejected',
  resolved: 'Resolved',
  triaged: 'Triaged',
}

/**
 * Learner-reported content problems and the moderation queue over them.
 *
 * Two things make this collection different from every content collection:
 *
 * 1. `create` is open to anonymous visitors, because reporting a problem must
 *    not require an account. Payload cannot disable its public REST endpoint
 *    per collection, so *every* submission rule lives in the hooks below rather
 *    than in the server action — that is what keeps `POST /api/feedback` and the
 *    public form subject to exactly the same constraints.
 * 2. There are no drafts or versions. A submission is a record of what someone
 *    said, not editorial content with a publication lifecycle, so there is no
 *    `_status` here and the publish-gate hooks do not apply.
 */
export const Feedback: CollectionConfig = {
  slug: 'feedback',
  access: {
    admin: canAccessAdminPanel,
    create: () => true,
    delete: isAdmin,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    defaultColumns: [
      'relatedSlug',
      'contentType',
      'feedbackType',
      'status',
      'createdAt',
    ],
    description:
      'Learner-reported problems with published content. Submissions arrive as New; triage them and record what happened in the moderation notes.',
    group: 'Moderation',
    listSearchableFields: ['relatedSlug', 'message'],
    useAsTitle: 'relatedSlug',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'contentType',
          type: 'select',
          admin: {
            description: 'Which kind of page the report came from.',
            width: '50%',
          },
          index: true,
          label: 'Content type',
          options: feedbackContentTypes.map((value) => ({
            label: contentTypeLabels[value],
            value,
          })),
          required: true,
        },
        {
          name: 'feedbackType',
          type: 'select',
          admin: {
            description: 'What the reporter said was wrong.',
            width: '50%',
          },
          index: true,
          label: 'Problem type',
          options: feedbackTypes.map((value) => ({
            label: feedbackTypeLabels[value],
            value,
          })),
          required: true,
        },
      ],
    },
    {
      name: 'related',
      type: 'relationship',
      admin: {
        description: 'The reported document, for one-click navigation.',
      },
      // Depth 0 keeps the queue list cheap; open the row to follow the link.
      maxDepth: 0,
      relationTo: ['words', 'grammar-topics', 'scenarios'],
      required: true,
    },
    {
      name: 'relatedSlug',
      type: 'text',
      admin: {
        description:
          'Snapshot of the slug at submission time, so the queue stays readable if the content is later renamed or removed.',
      },
      index: true,
      label: 'Content slug',
      maxLength: SLUG_MAX_LENGTH,
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'What the reporter wrote, stored verbatim.',
      },
      label: 'Report',
      maxLength: MESSAGE_MAX_LENGTH,
      minLength: MESSAGE_MIN_LENGTH,
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          // Personal data: visible to admins only, never to editors, and never
          // to the public because the whole collection is unreadable to them.
          access: {
            read: isAdminField,
          },
          admin: {
            description:
              'Optional reply address. Personal data — visible to admins only.',
            width: '50%',
          },
          label: 'Reply email',
        },
        {
          name: 'submitterLocale',
          type: 'select',
          admin: {
            description: 'Interface language the report was written in.',
            width: '50%',
          },
          label: 'Reporter language',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Bangla', value: 'bn' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          access: {
            create: isAdminOrEditorField,
            update: isAdminOrEditorField,
          },
          admin: {
            description: 'Every submission starts as New.',
          },
          defaultValue: 'new',
          index: true,
          label: 'Status',
          options: feedbackStatuses.map((value) => ({
            label: statusLabels[value],
            value,
          })),
          required: true,
        },
        {
          name: 'adminNotes',
          type: 'textarea',
          access: {
            create: isAdminOrEditorField,
            read: isAdminOrEditorField,
            update: isAdminOrEditorField,
          },
          admin: {
            description: 'Internal only. Never shown to the reporter.',
          },
          label: 'Moderation notes',
        },
        {
          name: 'handledBy',
          type: 'relationship',
          access: {
            create: isAdminOrEditorField,
            update: isAdminOrEditorField,
          },
          admin: {
            description: 'Set automatically when the status changes.',
            readOnly: true,
          },
          label: 'Handled by',
          maxDepth: 0,
          relationTo: 'users',
        },
        {
          name: 'handledAt',
          type: 'date',
          access: {
            create: isAdminOrEditorField,
            update: isAdminOrEditorField,
          },
          admin: {
            description: 'Set automatically when the status changes.',
            readOnly: true,
          },
          label: 'Handled at',
        },
      ],
      label: 'Moderation',
    },
  ],
  hooks: {
    beforeChange: [recordFeedbackModeration],
    beforeOperation: [enforceFeedbackRateLimit],
    // Order matters: validate the payload, then force the trusted moderation
    // defaults, then check the relationship agrees with the content type.
    beforeValidate: [
      enforceFeedbackSubmission,
      forceNewFeedbackStatus,
      assertRelatedMatchesType,
    ],
  },
}
