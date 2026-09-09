import type { CollectionConfig } from 'payload'

import { situationTypes } from '../src/features/scenarios/constants'
import {
  canAccessAdminPanel,
  isAdmin,
  isAdminOrEditor,
  publishedOrEditorial,
} from '../src/lib/payload/access'
import {
  canReadBanglaLearnerContent,
  contentVersions,
  createBanglaLearnerFields,
  createCefrField,
  createEnglishLearnerFields,
  createLearnerRichTextEditor,
  createReviewMetadataField,
  createSlugField,
  createSourceMetadataField,
} from '../src/lib/payload/fields'
import { enforceEditorDrafts } from './hooks/content'
import {
  enforceScenarioPublication,
  markScenarioPublicationIntent,
} from './hooks/scenarios'

export { situationTypes, type SituationType } from '../src/features/scenarios/constants'

const situationTypeLabels: Record<(typeof situationTypes)[number], string> = {
  everyday: 'Alltag — everyday life',
  travel: 'Reisen — travel and transport',
  work: 'Arbeit — work and jobs',
  study: 'Studium — study and school',
  health: 'Gesundheit — health and care',
  services: 'Ämter und Dienste — offices and services',
  social: 'Soziales — friends and social life',
}

export const Scenarios: CollectionConfig = {
  slug: 'scenarios',
  access: {
    admin: canAccessAdminPanel,
    create: isAdminOrEditor,
    delete: isAdmin,
    read: publishedOrEditorial,
    readVersions: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    description:
      'Build real-world German dialogues with independent English and Bangla learner support.',
    defaultColumns: ['title', 'situationType', 'cefrLevel', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'German identity',
          admin: {
            description:
              'Name the situation and state what the learner should be able to do before adding the dialogue.',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: {
                description:
                  'Name the situation in German, for example "Im Café bestellen".',
              },
              index: true,
              label: 'German scenario title',
              required: true,
            },
            createSlugField({
              label: 'Public URL slug',
              sourceField: 'title',
            }),
            {
              ...createCefrField(),
              admin: {
                description:
                  'Choose the earliest CEFR level at which a learner could hold this conversation.',
                width: '50%',
              },
              index: true,
            },
            {
              name: 'situationType',
              type: 'select',
              admin: {
                description:
                  'Pick the everyday domain this conversation belongs to. Learners filter the scenario index by this value.',
                position: 'sidebar',
              },
              index: true,
              label: 'Situation type',
              options: situationTypes.map((situationType) => ({
                label: situationTypeLabels[situationType],
                value: situationType,
              })),
              required: true,
            },
            {
              name: 'learnerGoal',
              type: 'textarea',
              admin: {
                description:
                  'State the goal in one German sentence, for example "Ich kann ein Getränk höflich bestellen." Learners see this before the dialogue.',
              },
              label: 'Learner goal (German)',
              required: true,
            },
          ],
        },
        {
          label: 'English support',
          admin: {
            description:
              'A non-empty English explanation is required for publishing.',
          },
          fields: [
            createEnglishLearnerFields([
              {
                name: 'explanation',
                type: 'richText',
                admin: {
                  description:
                    'Explain how the conversation works and which phrases carry it. Use short headings and lists rather than long paragraphs.',
                },
                editor: createLearnerRichTextEditor(),
                label: 'Explanation',
                required: true,
              },
              {
                name: 'culturalNotes',
                type: 'array',
                admin: {
                  description:
                    'Note the expectations a learner would not guess, such as greetings, formality, or tipping.',
                },
                fields: [
                  {
                    name: 'note',
                    type: 'textarea',
                    required: true,
                  },
                ],
                label: 'Cultural notes for English speakers',
              },
            ]),
          ],
        },
        {
          label: 'Bangla support',
          admin: {
            description:
              'Bangla support is optional for publishing and stays hidden publicly until Bangla review is approved.',
          },
          fields: [
            createBanglaLearnerFields([
              {
                name: 'explanation',
                type: 'richText',
                editor: createLearnerRichTextEditor(),
                label: 'Explanation',
              },
              {
                name: 'culturalNotes',
                type: 'array',
                fields: [
                  {
                    name: 'note',
                    type: 'textarea',
                    required: true,
                  },
                ],
                label: 'Cultural notes for Bangla speakers',
              },
            ]),
          ],
        },
        {
          label: 'Dialogue',
          admin: {
            description:
              'Keep every German line aligned with its learner-language explanations. At least one complete line is required for publishing.',
          },
          fields: [
            {
              name: 'dialogue',
              type: 'array',
              admin: {
                description:
                  'English is required for each line. Bangla is optional and follows the scenario-level Bangla review gate.',
              },
              fields: [
                {
                  name: 'speaker',
                  type: 'text',
                  admin: {
                    description:
                      'Name the speaker in German, for example "Kundin" or "Kellner".',
                  },
                  label: 'Speaker',
                  required: true,
                },
                {
                  name: 'germanLine',
                  type: 'textarea',
                  label: 'German line',
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
              label: 'Dialogue lines',
            },
          ],
        },
        {
          label: 'Relationships',
          admin: {
            description:
              'Connect the situation to learning topics, the vocabulary it teaches, and the patterns it practises.',
          },
          fields: [
            {
              name: 'topicTags',
              type: 'relationship',
              admin: {
                description:
                  'Choose every topic under which learners should be able to discover this scenario.',
              },
              hasMany: true,
              label: 'Topic tags',
              maxDepth: 1,
              relationTo: 'topic-tags',
            },
            {
              name: 'keyVocabulary',
              type: 'relationship',
              admin: {
                description:
                  'Choose published vocabulary a learner needs for this conversation. These words link back to this scenario.',
              },
              hasMany: true,
              label: 'Key vocabulary',
              maxDepth: 0,
              relationTo: 'words',
            },
            {
              name: 'relatedGrammarTopics',
              type: 'relationship',
              admin: {
                description:
                  'Choose published grammar patterns this dialogue practises. These topics link back to this scenario.',
              },
              hasMany: true,
              label: 'Related grammar topics',
              maxDepth: 0,
              relationTo: 'grammar-topics',
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
          ...createReviewMetadataField(['german', 'english', 'bangla']),
          admin: {
            description:
              'Review flags are independent. Bangla remains hidden publicly until Bangla reviewed is enabled.',
          },
        },
      ],
      label: 'Review and publishing',
    },
  ],
  hooks: {
    beforeOperation: [enforceEditorDrafts, markScenarioPublicationIntent],
    beforeValidate: [enforceScenarioPublication],
  },
  versions: contentVersions,
}
