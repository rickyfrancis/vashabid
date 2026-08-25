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
import { enforceEditorDrafts } from './hooks/content'
import {
  enforceWordPublication,
  markWordPublicationIntent,
} from './hooks/words'

export const wordTypes = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'phrase',
  'idiom',
] as const
export type WordType = (typeof wordTypes)[number]

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
      name: 'lemma',
      type: 'text',
      index: true,
      label: 'German lemma',
      required: true,
    },
    createSlugField({ sourceField: 'lemma' }),
    {
      name: 'wordType',
      type: 'select',
      index: true,
      label: 'Word type',
      options: wordTypes.map((wordType) => ({
        label: wordType[0].toUpperCase() + wordType.slice(1),
        value: wordType,
      })),
      required: true,
    },
    {
      ...createCefrField(),
      index: true,
    },
    {
      name: 'gender',
      type: 'select',
      admin: {
        condition: isNoun,
      },
      label: 'Noun gender',
      options: ['der', 'die', 'das'],
    },
    {
      name: 'pluralForm',
      type: 'text',
      admin: {
        condition: isNoun,
      },
      label: 'Plural form',
    },
    {
      name: 'ipa',
      type: 'text',
      label: 'IPA pronunciation',
    },
    {
      name: 'register',
      type: 'select',
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
        position: 'sidebar',
      },
      label: 'Usefulness score',
      required: true,
      validate: validateUsefulnessScore,
    },
    {
      name: 'topicTags',
      type: 'relationship',
      hasMany: true,
      label: 'Topic tags',
      maxDepth: 1,
      relationTo: 'topic-tags',
    },
    createEnglishLearnerFields([
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
        minRows: 1,
        required: true,
      },
      {
        name: 'explanation',
        type: 'textarea',
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
        label: 'Romanized Bangla helper',
      },
    ]),
    {
      name: 'examples',
      type: 'array',
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
    createReviewMetadataField(),
    createSourceMetadataField(),
    {
      name: 'lifecycleStatus',
      type: 'select',
      access: {
        create: canManageWordLifecycle,
        update: canManageWordLifecycle,
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'active',
      index: true,
      label: 'Lifecycle status',
      options: wordLifecycleStatuses.map((status) => ({
        label: status[0].toUpperCase() + status.slice(1),
        value: status,
      })),
      required: true,
    },
  ],
  hooks: {
    beforeChange: [enforceWordPublication],
    beforeOperation: [enforceEditorDrafts, markWordPublicationIntent],
  },
  versions: contentVersions,
}
