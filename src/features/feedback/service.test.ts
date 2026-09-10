import { describe, expect, test, vi } from 'vitest'

import { FeedbackService } from './service'

function submission(overrides: Record<string, unknown> = {}) {
  return {
    contentType: 'word',
    feedbackType: 'wrong-cefr',
    locale: 'en',
    message: 'This word is listed as A1 but feels more like B1.',
    slug: 'das-brot',
    ...overrides,
  }
}

function lookup(document: unknown = { id: 7, slug: 'das-brot' }) {
  return { findPublishedBySlug: vi.fn().mockResolvedValue(document) }
}

function feedbackRepository() {
  return { createSubmission: vi.fn().mockResolvedValue(undefined) }
}

function service(
  overrides: {
    feedback?: ReturnType<typeof feedbackRepository>
    grammar?: ReturnType<typeof lookup>
    scenario?: ReturnType<typeof lookup>
    word?: ReturnType<typeof lookup>
  } = {},
) {
  const feedback = overrides.feedback ?? feedbackRepository()
  const word = overrides.word ?? lookup()
  const grammar = overrides.grammar ?? lookup({ id: 21, slug: 'modalverben' })
  const scenario = overrides.scenario ?? lookup({ id: 33, slug: 'im-cafe-bestellen' })

  return {
    feedback,
    grammar,
    scenario,
    subject: new FeedbackService(
      feedback,
      word as never,
      grammar as never,
      scenario as never,
    ),
    word,
  }
}

describe('FeedbackService', () => {
  test('stores a valid word report and reports success', async () => {
    const { feedback, subject, word } = service()

    await expect(subject.submit(submission())).resolves.toEqual({
      kind: 'success',
    })
    expect(word.findPublishedBySlug).toHaveBeenCalledWith('das-brot')
    expect(feedback.createSubmission).toHaveBeenCalledWith(
      {
        contentType: 'word',
        feedbackType: 'wrong-cefr',
        message: 'This word is listed as A1 but feels more like B1.',
        related: { relationTo: 'words', value: 7 },
        relatedSlug: 'das-brot',
        submitterLocale: 'en',
      },
      undefined,
    )
  })

  test.each([
    ['word', 'words', 'word' as const, 7],
    ['grammar-topic', 'grammar-topics', 'grammar' as const, 21],
    ['scenario', 'scenarios', 'scenario' as const, 33],
  ])(
    'resolves a %s through its own repository',
    async (contentType, relationTo, key, id) => {
      const context = service()

      await expect(
        context.subject.submit(submission({ contentType, slug: 'a-slug' })),
      ).resolves.toEqual({ kind: 'success' })

      expect(context[key].findPublishedBySlug).toHaveBeenCalledWith('a-slug')
      const [data] = context.feedback.createSubmission.mock.calls[0] as [
        { related: unknown },
      ]
      expect(data.related).toEqual({ relationTo, value: id })
    },
  )

  test('does not consult the other repositories', async () => {
    const { grammar, scenario, subject } = service()

    await subject.submit(submission({ contentType: 'word' }))

    expect(grammar.findPublishedBySlug).not.toHaveBeenCalled()
    expect(scenario.findPublishedBySlug).not.toHaveBeenCalled()
  })

  test('forwards headers so the rate-limit hook sees the client', async () => {
    const { feedback, subject } = service()
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7' })

    await subject.submit(submission(), headers)

    expect(feedback.createSubmission).toHaveBeenCalledWith(
      expect.anything(),
      headers,
    )
  })

  test('reports unknown-target when the slug matches nothing published', async () => {
    const { feedback, subject } = service({ word: lookup(null) })

    await expect(subject.submit(submission())).resolves.toEqual({
      kind: 'unknown-target',
    })
    expect(feedback.createSubmission).not.toHaveBeenCalled()
  })

  test.each([
    ['a document without an id', {}],
    ['a string id', { id: 'seven' }],
    ['a bare id value', 7],
  ])('treats %s as unknown rather than storing it', async (_label, document) => {
    const { feedback, subject } = service({ word: lookup(document) })

    await expect(subject.submit(submission())).resolves.toEqual({
      kind: 'unknown-target',
    })
    expect(feedback.createSubmission).not.toHaveBeenCalled()
  })

  test('reports field errors without touching the repositories', async () => {
    const { feedback, subject, word } = service()

    await expect(
      subject.submit(submission({ email: 'nope', message: 'short' })),
    ).resolves.toEqual({
      fieldErrors: {
        email: 'errorEmailInvalid',
        message: 'errorMessageTooShort',
      },
      kind: 'invalid',
    })
    expect(word.findPublishedBySlug).not.toHaveBeenCalled()
    expect(feedback.createSubmission).not.toHaveBeenCalled()
  })

  test('stores a supplied email but omits a blank one', async () => {
    const withEmail = service()
    await withEmail.subject.submit(submission({ email: 'a@example.com' }))
    const [stored] = withEmail.feedback.createSubmission.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(stored.email).toBe('a@example.com')

    const withoutEmail = service()
    await withoutEmail.subject.submit(submission({ email: '   ' }))
    const [blank] = withoutEmail.feedback.createSubmission.mock.calls[0] as [
      Record<string, unknown>,
    ]
    expect(blank).not.toHaveProperty('email')
  })

  test('never forwards moderation fields even when they are supplied', async () => {
    const { feedback, subject } = service()

    await subject.submit(
      submission({
        adminNotes: 'looks fine',
        handledAt: '2026-01-01T00:00:00.000Z',
        handledBy: 1,
        status: 'resolved',
      }),
    )

    const [data] = feedback.createSubmission.mock.calls[0] as [object]
    expect(data).not.toHaveProperty('status')
    expect(data).not.toHaveProperty('adminNotes')
    expect(data).not.toHaveProperty('handledBy')
    expect(data).not.toHaveProperty('handledAt')
  })

  test('maps a 429 from the rate-limit hook onto rate-limited', async () => {
    const feedback = feedbackRepository()
    feedback.createSubmission.mockRejectedValueOnce(
      Object.assign(new Error('Too many feedback submissions.'), { status: 429 }),
    )

    await expect(
      service({ feedback }).subject.submit(submission()),
    ).resolves.toEqual({ kind: 'rate-limited' })
  })

  test('maps a 400 from the collection hook onto invalid', async () => {
    const feedback = feedbackRepository()
    feedback.createSubmission.mockRejectedValueOnce(
      Object.assign(new Error('ValidationError'), { status: 400 }),
    )

    await expect(
      service({ feedback }).subject.submit(submission()),
    ).resolves.toEqual({ fieldErrors: {}, kind: 'invalid' })
  })

  test('rethrows an unexpected failure instead of reporting success', async () => {
    const feedback = feedbackRepository()
    feedback.createSubmission.mockRejectedValueOnce(new Error('database is down'))

    await expect(
      service({ feedback }).subject.submit(submission()),
    ).rejects.toThrow('database is down')
  })

  test('rejects input that is not an object at all', async () => {
    const { subject } = service()

    const result = await subject.submit('not a submission')

    expect(result.kind).toBe('invalid')
  })
})
