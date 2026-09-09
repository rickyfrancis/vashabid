import { useTranslations } from 'next-intl'

import { Link } from '@/features/i18n/navigation'
import type { TranslatedSegment } from './types'

/**
 * Renders the learner's own text back to them with known words turned into
 * links. Plain spans are preserved verbatim, so spacing and punctuation read
 * exactly as typed.
 */
export function TranslatedText({
  segments,
}: {
  segments: TranslatedSegment[]
}) {
  const t = useTranslations('Translator')

  return (
    <p
      className="text-pretty text-xl leading-10 text-foreground"
      data-testid="translate-reading-view"
      lang="de"
    >
      {segments.map((segment, index) =>
        segment.kind === 'text' ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <Link
            className="rounded-md bg-brand-50 px-1 font-semibold text-brand-900 underline decoration-accent-500 decoration-2 underline-offset-4 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus dark:bg-brand-950 dark:text-brand-100 dark:hover:bg-brand-900"
            data-testid={`translate-token-${segment.word.slug}`}
            href={`/words/${segment.word.slug}`}
            key={index}
            title={
              segment.precision === 'inflected'
                ? `${segment.word.headword} — ${t('inflectedLabel')}`
                : segment.word.headword
            }
          >
            {segment.text}
          </Link>
        ),
      )}
    </p>
  )
}
