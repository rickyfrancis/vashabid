import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const payloadUI = vi.hoisted(() => ({
  useDocumentInfo: vi.fn(),
  useFormFields: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => payloadUI)

import { DuplicateWordWarning } from './duplicate-word-warning'
import { LocalizedPreviewLinks } from './localized-preview-links'

let formFields: Record<string, { value?: unknown }>

async function finishDuplicateCheck() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300)
  })
}

describe('word admin components', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    formFields = {
      lemma: { value: 'Der Termin' },
      wordType: { value: 'noun' },
    }
    payloadUI.useFormFields.mockImplementation((selector) =>
      selector([formFields, vi.fn()]),
    )
    payloadUI.useDocumentInfo.mockReturnValue({ id: 7 })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('waits for complete identity fields before querying', async () => {
    formFields.wordType.value = undefined
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<DuplicateWordWarning />)
    await finishDuplicateCheck()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('debounces the check, excludes the current word, and links draft or archived matches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        docs: [
          {
            _status: 'published',
            id: 7,
            lemma: 'Der Termin',
            lifecycleStatus: 'active',
            wordType: 'noun',
          },
          {
            _status: 'draft',
            id: 8,
            lemma: ' der   termin ',
            lifecycleStatus: 'archived',
            wordType: 'noun',
          },
        ],
      }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<DuplicateWordWarning />)
    expect(fetchMock).not.toHaveBeenCalled()

    await finishDuplicateCheck()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('draft=true')
    expect(
      screen.getByRole('link', { name: /der termin/i }),
    ).toHaveAttribute('href', '/admin/collections/words/8')
    expect(screen.getByText(/draft, archived/)).toBeVisible()
  })

  test('aborts a stale request when identity changes', async () => {
    let requestSignal: AbortSignal | undefined
    const fetchMock = vi.fn((_url, options: RequestInit) => {
      requestSignal = options.signal as AbortSignal
      return new Promise(() => undefined)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = render(<DuplicateWordWarning />)
    await finishDuplicateCheck()
    expect(requestSignal?.aborted).toBe(false)

    formFields = {
      ...formFields,
      lemma: { value: 'machen' },
    }
    rerender(<DuplicateWordWarning />)

    expect(requestSignal?.aborted).toBe(true)
  })

  test('reports fetch failures without blocking the form', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({}), ok: false }),
    )

    render(<DuplicateWordWarning />)
    await finishDuplicateCheck()

    expect(
      screen.getByText('Duplicate check is unavailable. You can still save this word.'),
    ).toBeVisible()
  })

  test('shows localized links for saved public words and guidance otherwise', () => {
    payloadUI.useDocumentInfo.mockReturnValue({
      data: {
        _status: 'published',
        lifecycleStatus: 'active',
        slug: 'der-termin',
      },
    })

    const { rerender } = render(<LocalizedPreviewLinks />)

    expect(screen.getByRole('link', { name: 'English preview' })).toHaveAttribute(
      'href',
      '/en/words/der-termin',
    )
    expect(screen.getByRole('link', { name: 'বাংলা preview' })).toHaveAttribute(
      'href',
      '/bn/words/der-termin',
    )

    payloadUI.useDocumentInfo.mockReturnValue({
      data: {
        _status: 'published',
        lifecycleStatus: 'archived',
        slug: 'der-termin',
      },
    })
    rerender(<LocalizedPreviewLinks />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/Set the public lifecycle to Active/)).toBeVisible()
  })
})
