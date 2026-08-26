import type {
  CollectionConfig,
  FieldAccess,
  NumberFieldSingleValidation,
} from 'payload'

import {
  canAccessAdminPanel,
  isAdmin,
  isAdminOrEditor,
  publishedActiveOrEditorial,
} from '../src/lib/payload/access'
import { getActivePayloadUser } from '../src/lib/payload/access/values'
import {
  canReadBanglaLearnerContent,
  contentVersions,
  createBanglaLearnerFields,
  createCefrField,
  createEnglishLearnerFields,
  createReviewMetadataField,
  createSlugField,
  createSourceMetadataField,
} from '../src/lib/payload/fields'
import { wordTypes } from '../src/features/words/constants'
import { enforceEditorDrafts } from './hooks/content'
import {
  enforceWordPublication,
  markWordPublicationIntent,
} from './hooks/words'

export { wordTypes, type WordType } from '../src/features/words/constants'

export const wordRegisters = [
  'neutral',
  'formal',
  'informal',
  'slang',
  'academic',
  'official',
  'rude',
  'poetic',
  'archaic',
] as const
export type WordRegister = (typeof wordRegisters)[number]

export const wordLifecycleStatuses = ['active', 'archived'] as const
export type WordLifecycleStatus = (typeof wordLifecycleStatuses)[number]

export const canManageWordLifecycle: FieldAccess = ({ req }) =>
  getActivePayloadUser(req.user)?.role === 'admin'

export const validateUsefulnessScore: NumberFieldSingleValidation = (value) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5
    ? true
    : 'Usefulness score must be an integer from 1 to 5.'

const isNoun = (data: Partial<Record<string, unknown>>): boolean =>
  data.wordType === 'noun'

export const Words: CollectionConfig = {
  slug: 'words',
  access: {
    admin: canAccessAdminPanel,
    create: isAdminOrEditor,
    delete: isAdmin,
    read: publishedActiveOrEditorial,
    readVersions: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    description:
      'Create and review German vocabulary with independent English and Bangla learner support.',
    defaultColumns: [
      'lemma',
      'wordType',
      'cefrLevel',
      'lifecycleStatus',
      '_status',
    ],
    useAsTitle: 'lemma',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'German identity',
          admin: {
            description:
              'Define the canonical German headword and the metadata used to classify it.',
          },
          fields: [
            {
              name: 'lemma',
              type: 'text',
              admin: {
                description:
                  'Use the dictionary headword, including the article for nouns. The locked public URL slug follows this value.',
              },
              index: true,
              label: 'German lemma',
              required: true,
            },
            createSlugField({
              label: 'Public URL slug',
              sourceField: 'lemma',
            }),
            {
              name: 'wordType',
              type: 'select',
              admin: {
                description:
                  'Choose the grammatical category used to reveal relevant fields and public labels.',
              },
              index: true,
              label: 'Word type',
              options: wordTypes.map((wordType) => ({
                label: wordType[0].toUpperCase() + wordType.slice(1),
                value: wordType,
              })),
              required: true,
            },
            {
              name: 'duplicateWordWarning',
              type: 'ui',
              admin: {
                components: {
                  Field:
                    '/src/components/admin/words/duplicate-word-warning#DuplicateWordWarning',
                },
              },
            },
            {
              ...createCefrField(),
              admin: {
                description:
                  'Choose the earliest CEFR level at which this word should be introduced.',
                width: '50%',
              },
              index: true,
            },
            {
              name: 'gender',
              type: 'select',
              admin: {
                condition: isNoun,
                description:
                  'Select the definite article that identifies the noun gender.',
                width: '50%',
              },
              label: 'Noun gender',
              options: ['der', 'die', 'das'],
            },
            {
              name: 'pluralForm',
              type: 'text',
              admin: {
                condition: isNoun,
                description:
                  'Enter the complete plural form, including the article when useful.',
              },
              label: 'Plural form',
            },
            {
              name: 'ipa',
              type: 'text',
              admin: {
                description:
                  'Use a standard German IPA transcription, including slashes when appropriate.',
              },
              label: 'IPA pronunciation',
            },
            {
              name: 'register',
              type: 'select',
              admin: {
                description:
                  'Describe the social or stylistic context in which the word is normally used.',
                width: '50%',
              },
              defaultValue: 'neutral',
              options: wordRegisters.map((wordRegister) => ({
                label: wordRegister[0].toUpperCase() + wordRegister.slice(1),
                value: wordRegister,
              })),
              required: true,
            },
            {
              name: 'usefulnessScore',
              type: 'number',
              admin: {
                description:
                  'Rate practical learning value from 1 (specialized) to 5 (essential).',
                width: '50%',
              },
              label: 'Usefulness score',
              required: true,
              validate: validateUsefulnessScore,
            },
          ],
        },
        {
          label: 'English support',
          admin: {
            description:
              'English meanings are required for publishing; explanations and learner mistakes add teaching context.',
          },
          fields: [
            createEnglishLearnerFields([
              {
                name: 'meanings',
                type: 'array',
                admin: {
                  description:
                    'Add at least one concise, non-empty English meaning before publishing.',
                },
                fields: [
                  {
                    name: 'meaning',
                    type: 'text',
                    required: true,
                  },
                ],
                label: 'Meanings',
                minRows: 1,
                required: true,
              },
              {
                name: 'explanation',
                type: 'textarea',
                admin: {
                  description:
                    'Explain usage in clear language appropriate for the selected CEFR level.',
                },
              },
              {
                name: 'commonMistakes',
                type: 'array',
                fields: [
                  {
                    name: 'mistake',
                    type: 'textarea',
                    required: true,
                  },
                ],
                label: 'Common English-speaker mistakes',
              },
            ]),
          ],
        },
        {
          label: 'Bangla support',
          admin: {
            description:
              'Bangla support is optional for publishing and remains hidden publicly until Bangla review is approved.',
          },
          fields: [
            createBanglaLearnerFields([
              {
                name: 'meanings',
                type: 'array',
                fields: [
                  {
                    name: 'meaning',
                    type: 'text',
                    required: true,
                  },
                ],
                label: 'Meanings',
              },
              {
                name: 'explanation',
                type: 'textarea',
              },
              {
                name: 'pronunciationHints',
                type: 'array',
                fields: [
                  {
                    name: 'hint',
                    type: 'textarea',
                    required: true,
                  },
                ],
                label: 'Pronunciation hints',
              },
              {
                name: 'commonMistakes',
                type: 'array',
                fields: [
                  {
                    name: 'mistake',
                    type: 'textarea',
                    required: true,
                  },
                ],
                label: 'Common Bangla-speaker mistakes',
              },
              {
                name: 'romanizedHelper',
                type: 'text',
                admin: {
                  description:
                    'Optional search or onboarding aid; Bangla script remains the primary learner content.',
                },
                label: 'Romanized Bangla helper',
              },
            ]),
          ],
        },
        {
          label: 'Examples',
          admin: {
            description:
              'Keep every German sentence aligned with its learner-language explanations.',
          },
          fields: [
            {
              name: 'examples',
              type: 'array',
              admin: {
                description:
                  'English is required for each example. Bangla is optional and follows the word-level Bangla review gate.',
              },
              fields: [
                {
                  name: 'germanSentence',
                  type: 'textarea',
                  label: 'German sentence',
                  required: true,
                },
                {
                  name: 'englishExplanation',
                  type: 'textarea',
                  label: 'English explanation',
                  required: true,
                },
                {
                  name: 'banglaExplanation',
                  type: 'textarea',
                  access: {
                    read: canReadBanglaLearnerContent,
                  },
                  label: 'Bangla explanation',
                },
              ],
              label: 'Example sentences',
            },
          ],
        },
        {
          label: 'Relationships',
          admin: {
            description:
              'Connect the word to learning topics and record reusable source and licensing details.',
          },
          fields: [
            {
              name: 'topicTags',
              type: 'relationship',
              admin: {
                description:
                  'Choose every topic under which learners should be able to discover this word.',
              },
              hasMany: true,
              label: 'Topic tags',
              maxDepth: 1,
              relationTo: 'topic-tags',
            },
            {
              name: 'relatedWords',
              type: 'relationship',
              admin: {
                description:
                  'Choose published vocabulary that helps learners build a useful semantic or situational connection.',
              },
              hasMany: true,
              label: 'Related words',
              maxDepth: 0,
              relationTo: 'words',
            },
            {
              ...createSourceMetadataField(),
              admin: {
                description:
                  'Record attribution, URLs, licensing, and any restrictions before reusing sourced material.',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      admin: {
        initCollapsed: false,
        position: 'sidebar',
      },
      fields: [
        {
          name: 'lifecycleStatus',
          type: 'select',
          access: {
            create: canManageWordLifecycle,
            update: canManageWordLifecycle,
          },
          admin: {
            description:
              'Archive instead of deleting: archived words disappear from public pages while versions and references remain intact.',
          },
          defaultValue: 'active',
          index: true,
          label: 'Public lifecycle',
          options: wordLifecycleStatuses.map((status) => ({
            label: status[0].toUpperCase() + status.slice(1),
            value: status,
          })),
          required: true,
        },
        {
          ...createReviewMetadataField(),
          admin: {
            description:
              'Review flags are independent. Bangla remains hidden publicly until Bangla reviewed is enabled.',
          },
        },
        {
          name: 'localizedPreviewLinks',
          type: 'ui',
          admin: {
            components: {
              Field:
                '/src/components/admin/words/localized-preview-links#LocalizedPreviewLinks',
            },
          },
        },
      ],
      label: 'Review and publishing',
    },
  ],
  hooks: {
    beforeOperation: [enforceEditorDrafts, markWordPublicationIntent],
    beforeValidate: [enforceWordPublication],
  },
  versions: contentVersions,
}
