'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import {
  buildDuplicateWordsQuery,
  type DuplicateWordCandidate,
  findDuplicateWords,
} from './word-admin-utils'

type DuplicateCheckState =
  | { status: 'error' | 'idle' | 'loading' }
  | { matches: DuplicateWordCandidate[]; status: 'ready' }

interface DuplicateWordsResponse {
  docs?: DuplicateWordCandidate[]
}

export function DuplicateWordWarning() {
  const lemma = useFormFields(
    ([fields]) => fields.lemma?.value,
  )
  const wordType = useFormFields(
    ([fields]) => fields.wordType?.value,
  )
  const { id } = useDocumentInfo()
  const [check, setCheck] = useState<DuplicateCheckState>({ status: 'idle' })
  const canCheck =
    typeof lemma === 'string' &&
    lemma.trim().length > 0 &&
    typeof wordType === 'string' &&
    wordType.length > 0

  useEffect(() => {
    if (!canCheck || typeof lemma !== 'string' || typeof wordType !== 'string') {
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setCheck({ status: 'loading' })

      try {
        const response = await fetch(
          buildDuplicateWordsQuery(lemma, wordType, id),
          {
            credentials: 'include',
            signal: controller.signal,
          },
        )

        if (!response.ok) throw new Error('Duplicate check failed')

        const body = (await response.json()) as DuplicateWordsResponse
        const matches = findDuplicateWords(
          Array.isArray(body.docs) ? body.docs : [],
          lemma,
          wordType,
          id,
        )

        setCheck({ matches, status: 'ready' })
      } catch {
        if (controller.signal.aborted) return

        setCheck({ status: 'error' })
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [canCheck, id, lemma, wordType])

  if (!canCheck || check.status === 'idle') return null

  if (check.status === 'loading') {
    return (
      <p className="word-workflow-note" role="status">
        Checking for matching lemma and word type…
      </p>
    )
  }

  if (check.status === 'error') {
    return (
      <p className="word-workflow-note word-workflow-note--error" role="status">
        Duplicate check is unavailable. You can still save this word.
      </p>
    )
  }

  if (check.status !== 'ready' || check.matches.length === 0) return null

  return (
    <aside className="word-workflow-warning" role="status">
      <strong>Possible duplicate word</strong>
      <p>
        The same normalized lemma and word type already exist. Review these
        records before creating another:
      </p>
      <ul>
        {check.matches.map((match) => (
          <li key={match.id}>
            <a href={`/admin/collections/words/${match.id}`}>
              {typeof match.lemma === 'string' ? match.lemma : `Word ${match.id}`}
            </a>{' '}
            <span>
              ({String(match._status ?? 'unknown')},{' '}
              {String(match.lifecycleStatus ?? 'unknown')})
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
