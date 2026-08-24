import { slugField } from 'payload'
import type {
  CollectionConfig,
  Field,
  FieldAccess,
  GroupField,
  RowField,
  SelectField,
} from 'payload'

import { getActivePayloadUser } from '../access/values'

export const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof cefrLevels)[number]

export const reviewTargets = [
  'german',
  'english',
  'bangla',
  'audio',
  'quiz',
] as const
export type ReviewTarget = (typeof reviewTargets)[number]

interface SlugFieldOptions {
  checkboxName?: string
  name?: string
  sourceField: string
}

interface CefrFieldOptions {
  name?: string
  required?: boolean
}

function reviewFieldName(target: ReviewTarget): `${ReviewTarget}Reviewed` {
  return `${target}Reviewed`
}

function reviewFieldLabel(target: ReviewTarget): string {
  return `${target[0].toUpperCase()}${target.slice(1)} reviewed`
}

export const canReadBanglaLearnerContent: FieldAccess = ({ doc, req }) => {
  const user = getActivePayloadUser(req.user)

  if (user?.role === 'admin' || user?.role === 'editor') return true

  const review = (doc as { review?: Record<string, unknown> } | undefined)
    ?.review

  return review?.banglaReviewed === true
}

export function createSlugField({
  checkboxName,
  name = 'slug',
  sourceField,
}: SlugFieldOptions): RowField {
  return slugField({
    checkboxName,
    name,
    position: 'sidebar',
    required: true,
    useAsSlug: sourceField,
  })
}

export function createCefrField({
  name = 'cefrLevel',
  required = true,
}: CefrFieldOptions = {}): SelectField {
  return {
    name,
    type: 'select',
    admin: {
      position: 'sidebar',
    },
    label: 'CEFR level',
    options: cefrLevels.map((level) => ({ label: level, value: level })),
    required,
  }
}

export function createEnglishLearnerFields(fields: Field[]): GroupField {
  return {
    name: 'english',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields,
    label: 'English learner support',
  }
}

export function createBanglaLearnerFields(fields: Field[]): GroupField {
  return {
    name: 'bangla',
    type: 'group',
    access: {
      read: canReadBanglaLearnerContent,
    },
    admin: {
      hideGutter: true,
    },
    fields,
    label: 'Bangla learner support',
  }
}

export function createReviewMetadataField(
  targets: readonly ReviewTarget[] = reviewTargets,
): GroupField {
  return {
    name: 'review',
    type: 'group',
    admin: {
      position: 'sidebar',
    },
    fields: targets.map((target) => ({
      name: reviewFieldName(target),
      type: 'checkbox',
      defaultValue: false,
      label: reviewFieldLabel(target),
    })),
    label: 'Review status',
  }
}

export function createSourceMetadataField(): GroupField {
  return {
    name: 'source',
    type: 'group',
    fields: [
      {
        name: 'attribution',
        type: 'text',
        label: 'Source attribution',
      },
      {
        name: 'sourceUrl',
        type: 'text',
        label: 'Source URL',
      },
      {
        name: 'licenseName',
        type: 'text',
        label: 'License name',
      },
      {
        name: 'licenseUrl',
        type: 'text',
        label: 'License URL',
      },
      {
        name: 'usageNotes',
        type: 'textarea',
        label: 'Usage notes',
      },
    ],
    label: 'Source and license',
  }
}

export const contentVersions = {
  drafts: {
    autosave: false,
    validate: false,
  },
  maxPerDoc: 50,
} satisfies Exclude<CollectionConfig['versions'], boolean | undefined>
