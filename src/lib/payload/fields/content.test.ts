import type { Field, PayloadRequest } from 'payload'
import { describe, expect, test } from 'vitest'

import {
  canReadBanglaLearnerContent,
  cefrLevels,
  contentVersions,
  createBanglaLearnerFields,
  createCefrField,
  createEnglishLearnerFields,
  createReviewMetadataField,
  createSlugField,
  createSourceMetadataField,
} from '.'
import type { AccountStatus, UserRole } from '../access'

interface TestUser {
  accountStatus: AccountStatus
  collection: 'users'
  id: number
  role: UserRole
}

function createRequest(user: TestUser | null): PayloadRequest {
  return { user } as PayloadRequest
}

function createUser(
  role: UserRole,
  accountStatus: AccountStatus = 'active',
): TestUser {
  return {
    accountStatus,
    collection: 'users',
    id: 7,
    role,
  }
}

function fieldNames(fields: Field[]): string[] {
  return fields.flatMap((field) => ('name' in field ? [field.name] : []))
}

describe('content field helpers', () => {
  test('creates a required, unique slug generated from the requested source', () => {
    const field = createSlugField({ sourceField: 'name' })

    expect(field.type).toBe('row')
    expect(field.admin?.position).toBe('sidebar')

    const slug = field.fields.find(
      (candidate) => 'name' in candidate && candidate.name === 'slug',
    )
    const generateSlug = field.fields.find(
      (candidate) => 'name' in candidate && candidate.name === 'generateSlug',
    )

    if (!slug || slug.type !== 'text') throw new Error('Missing slug field')
    if (!generateSlug || generateSlug.type !== 'checkbox') {
      throw new Error('Missing generateSlug field')
    }

    expect(slug.required).toBe(true)
    expect(slug.label).toBeUndefined()
    expect(slug.unique).toBe(true)
    expect(slug.index).toBe(true)
    expect(slug.admin?.components?.Field).toEqual(
      expect.objectContaining({
        clientProps: { useAsSlug: 'name' },
      }),
    )
    expect(generateSlug.defaultValue).toBe(true)

    const labeledField = createSlugField({
      label: 'Public URL slug',
      sourceField: 'name',
    })
    const labeledSlug = labeledField.fields.find(
      (candidate) => 'name' in candidate && candidate.name === 'slug',
    )

    expect(labeledSlug?.label).toBe('Public URL slug')
  })

  test('uses the canonical CEFR values and supports optional fields', () => {
    const requiredField = createCefrField()
    const optionalField = createCefrField({ name: 'minimumLevel', required: false })

    expect(cefrLevels).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    expect(
      requiredField.options.map((option) =>
        typeof option === 'string' ? option : option.value,
      ),
    ).toEqual(cefrLevels)
    expect(requiredField.required).toBe(true)
    expect(optionalField.name).toBe('minimumLevel')
    expect(optionalField.required).toBe(false)
  })

  test('wraps learner fields in stable language groups', () => {
    const fields: Field[] = [{ name: 'description', type: 'textarea' }]
    const english = createEnglishLearnerFields(fields)
    const bangla = createBanglaLearnerFields(fields)

    expect(english).toMatchObject({
      name: 'english',
      type: 'group',
      fields,
    })
    expect(bangla).toMatchObject({
      name: 'bangla',
      type: 'group',
      fields,
    })
    expect(bangla.access?.read).toBe(canReadBanglaLearnerContent)
  })

  test('shows Bangla only after approval or to active editorial users', async () => {
    const approvedDoc = { id: 1, review: { banglaReviewed: true } }
    const pendingDoc = { id: 1, review: { banglaReviewed: false } }

    expect(
      await canReadBanglaLearnerContent({
        doc: approvedDoc,
        req: createRequest(null),
      }),
    ).toBe(true)
    expect(
      await canReadBanglaLearnerContent({
        doc: pendingDoc,
        req: createRequest(null),
      }),
    ).toBe(false)
    expect(
      await canReadBanglaLearnerContent({
        doc: pendingDoc,
        req: createRequest(createUser('learner')),
      }),
    ).toBe(false)
    expect(
      await canReadBanglaLearnerContent({
        doc: pendingDoc,
        req: createRequest(createUser('editor')),
      }),
    ).toBe(true)
    expect(
      await canReadBanglaLearnerContent({
        doc: pendingDoc,
        req: createRequest(createUser('admin')),
      }),
    ).toBe(true)
    expect(
      await canReadBanglaLearnerContent({
        doc: pendingDoc,
        req: createRequest(createUser('editor', 'suspended')),
      }),
    ).toBe(false)
  })

  test('creates configurable review metadata with safe defaults', () => {
    const review = createReviewMetadataField(['german', 'bangla'])

    expect(review.name).toBe('review')
    expect(fieldNames(review.fields)).toEqual([
      'germanReviewed',
      'banglaReviewed',
    ])
    expect(review.fields).toEqual([
      expect.objectContaining({ type: 'checkbox', defaultValue: false }),
      expect.objectContaining({ type: 'checkbox', defaultValue: false }),
    ])
  })

  test('creates optional source and license metadata', () => {
    const source = createSourceMetadataField()

    expect(source.name).toBe('source')
    expect(fieldNames(source.fields)).toEqual([
      'attribution',
      'sourceUrl',
      'licenseName',
      'licenseUrl',
      'usageNotes',
    ])
    expect(source.fields.every((field) => !('required' in field) || !field.required)).toBe(
      true,
    )
  })

  test('uses drafts without validating incomplete drafts', () => {
    expect(contentVersions).toEqual({
      drafts: { autosave: false, validate: false },
      maxPerDoc: 50,
    })
  })
})
