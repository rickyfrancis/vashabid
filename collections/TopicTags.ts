import type { CollectionConfig, NumberFieldSingleValidation } from 'payload'

import {
  canAccessAdminPanel,
  isAdmin,
  isAdminOrEditor,
  publishedOrEditorial,
} from '../src/lib/payload/access'
import {
  contentVersions,
  createBanglaLearnerFields,
  createEnglishLearnerFields,
  createReviewMetadataField,
  createSlugField,
  createSourceMetadataField,
} from '../src/lib/payload/fields'
import {
  enforceEditorDrafts,
  validateTopicTagParent,
} from './hooks/topicTags'

export const validateSortOrder: NumberFieldSingleValidation = (value) =>
  value === null || value === undefined ||
  (Number.isInteger(value) && value >= 0)
    ? true
    : 'Sort order must be a non-negative integer.'

export const TopicTags: CollectionConfig = {
  slug: 'topic-tags',
  access: {
    admin: canAccessAdminPanel,
    create: isAdminOrEditor,
    delete: isAdmin,
    read: publishedOrEditorial,
    readVersions: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  admin: {
    defaultColumns: ['name', 'parent', 'sortOrder', '_status'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'German name',
      required: true,
    },
    createSlugField({ sourceField: 'name' }),
    createEnglishLearnerFields([
      {
        name: 'description',
        type: 'textarea',
        required: true,
      },
    ]),
    createBanglaLearnerFields([
      {
        name: 'description',
        type: 'textarea',
      },
    ]),
    {
      name: 'parent',
      type: 'relationship',
      filterOptions: ({ id }) =>
        id === undefined
          ? true
          : {
              id: {
                not_equals: id,
              },
            },
      label: 'Parent tag',
      maxDepth: 1,
      relationTo: 'topic-tags',
      validate: validateTopicTagParent,
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 0,
      label: 'Sort order',
      required: true,
      validate: validateSortOrder,
    },
    createReviewMetadataField(['german', 'english', 'bangla']),
    createSourceMetadataField(),
  ],
  hooks: {
    beforeOperation: [enforceEditorDrafts],
  },
  versions: contentVersions,
}
