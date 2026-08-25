'use client'

import { useDocumentInfo } from '@payloadcms/ui'

import {
  getLocalizedWordPreviewLinks,
  getWordPreviewGuidance,
  type SavedWordPreviewState,
} from './word-admin-utils'

export function LocalizedPreviewLinks() {
  const { data } = useDocumentInfo()
  const word = data as SavedWordPreviewState | undefined
  const links = getLocalizedWordPreviewLinks(word)

  return (
    <section className="word-preview-links" aria-labelledby="word-preview-title">
      <strong id="word-preview-title">Localized public previews</strong>
      <p>
        Preview the currently saved public version. Unsaved edits are not shown.
      </p>
      {links.length > 0 ? (
        <div className="word-preview-links__actions">
          {links.map((link) => (
            <a
              href={link.url}
              key={link.locale}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : (
        <p className="word-workflow-note">{getWordPreviewGuidance(word)}</p>
      )}
    </section>
  )
}
