import type { CollectionConfig } from 'payload'

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
  enforceGrammarTopicPublication,
  markGrammarTopicPublicationIntent,
} from './hooks/grammarTopics'

export const GrammarTopics: CollectionConfig = {
  slug: 'grammar-topics',
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
      'Explain German grammar patterns with independent English and Bangla learner support.',
    defaultColumns: ['name', 'cefrLevel', '_status'],
    useAsTitle: 'name',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'German identity',
          admin: {
            description:
              'Name the German pattern and summarise it before adding learner explanations.',
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              admin: {
                description:
                  'Use the conventional German grammar term, for example "Perfekt mit haben und sein".',
              },
              index: true,
              label: 'German topic name',
              required: true,
            },
            createSlugField({
              label: 'Public URL slug',
              sourceField: 'name',
            }),
            {
              ...createCefrField(),
              admin: {
                description:
                  'Choose the earliest CEFR level at which this pattern should be taught.',
                width: '50%',
              },
              index: true,
            },
            {
              name: 'shortRule',
              type: 'textarea',
              admin: {
                description:
                  'State the rule in one German sentence. Learners see this before the full explanation.',
              },
              label: 'Short rule (German)',
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
                    'Explain when and how the pattern is used. Use short headings and lists rather than long paragraphs.',
                },
                editor: createLearnerRichTextEditor(),
                label: 'Explanation',
                required: true,
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
                  'English is required for each example. Bangla is optional and follows the topic-level Bangla review gate.',
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
              'Connect the pattern to learning topics and the vocabulary that demonstrates it.',
          },
          fields: [
            {
              name: 'topicTags',
              type: 'relationship',
              admin: {
                description:
                  'Choose every topic under which learners should be able to discover this pattern.',
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
                  'Choose published vocabulary that demonstrates this pattern. These words link back to this topic.',
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
    beforeOperation: [enforceEditorDrafts, markGrammarTopicPublicationIntent],
    beforeValidate: [enforceGrammarTopicPublication],
  },
  versions: contentVersions,
}
