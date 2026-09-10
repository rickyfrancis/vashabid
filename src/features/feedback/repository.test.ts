import { beforeEach, describe, expect, test, vi } from 'vitest'

const { createDocument } = vi.hoisted(() => ({ createDocument: vi.fn() }))

vi.mock('@/lib/payload', () => ({ createDocument }))

import { FeedbackRepository } from './repository'

function submission() {
  return {
    contentType: 'word' as const,
    feedbackType: 'wrong-cefr' as const,
    message: 'This looks like B1, not A1.',
    related: { relationTo: 'words' as const, value: 7 },
    relatedSlug: 'das-brot',
    submitterLocale: 'en' as const,
  }
}

describe('FeedbackRepository', () => {
  beforeEach(() => {
    createDocument.mockReset()
    createDocument.mockResolvedValue({ id: 1 })
  })

  test('creates the submission through the shared write helper', async () => {
    await new FeedbackRepository().createSubmission(submission())

    expect(createDocument).toHaveBeenCalledWith('feedback', submission(), {
      headers: undefined,
    })
  })

  test('forwards request headers so hooks can identify the client', async () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7' })

    await new FeedbackRepository().createSubmission(submission(), headers)

    expect(createDocument).toHaveBeenCalledWith('feedback', submission(), {
      headers,
    })
  })

  test('never sends moderation fields', async () => {
    await new FeedbackRepository().createSubmission(submission())

    const [, data] = createDocument.mock.calls[0] as [string, object]
    expect(data).not.toHaveProperty('status')
    expect(data).not.toHaveProperty('adminNotes')
    expect(data).not.toHaveProperty('handledBy')
    expect(data).not.toHaveProperty('handledAt')
  })

  test('accepts an injected create function', async () => {
    const create = vi.fn().mockResolvedValue({ id: 2 })

    await new FeedbackRepository(create).createSubmission(submission())

    expect(create).toHaveBeenCalledOnce()
    expect(createDocument).not.toHaveBeenCalled()
  })

  test('propagates a write failure to the caller', async () => {
    createDocument.mockRejectedValueOnce(new Error('database is down'))

    await expect(
      new FeedbackRepository().createSubmission(submission()),
    ).rejects.toThrow('database is down')
  })
})
