'use client'

import { CheckCircle2, MessageSquareWarning, TriangleAlert } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

import { Button, Input, Select, Textarea } from '@/components/ui'
import { submitFeedback } from './actions'
import { HONEYPOT_FIELD, feedbackTypes } from './constants'
import type { FeedbackContentType } from './constants'
import type {
  FeedbackErrorMessageKey,
  FeedbackFieldErrors,
  FeedbackFormState,
} from './types'

const initialState: FeedbackFormState = { status: 'idle' }

function SubmitButton() {
  const t = useTranslations('Feedback')
  const { pending } = useFormStatus()

  return (
    <Button
      className="w-full sm:w-auto"
      data-testid="feedback-submit"
      disabled={pending}
      type="submit"
    >
      {pending ? t('submitting') : t('submit')}
    </Button>
  )
}

/**
 * Renders under each detail page so a learner can report a problem with the
 * entry they are reading.
 *
 * It is built for progressive enhancement: a native `<details>` opens the panel,
 * the fields are uncontrolled, and the action is a real form POST that React
 * marks up with the hidden fields a scripting-free submit needs. A POST made with
 * no JavaScript at all does reach the action and store the report.
 *
 * That said, no public page in this app currently *renders* without JavaScript —
 * streaming plus a `loading.tsx` fallback means an unscripted browser is left
 * looking at the skeleton, on every route, not just this one. So the enhancement
 * is real but not yet reachable; see the Phase 15 log.
 */
export function FeedbackForm({
  contentType,
  slug,
}: {
  contentType: FeedbackContentType
  slug: string
}) {
  const locale = useLocale()
  const t = useTranslations('Feedback')
  const [state, formAction] = useActionState(submitFeedback, initialState)
  const baseId = useId()

  const ids = {
    email: `${baseId}-email`,
    emailError: `${baseId}-email-error`,
    emailHint: `${baseId}-email-hint`,
    message: `${baseId}-message`,
    messageError: `${baseId}-message-error`,
    type: `${baseId}-type`,
    typeError: `${baseId}-type-error`,
  }

  const fieldErrors: FeedbackFieldErrors =
    state.status === 'invalid' ? state.fieldErrors : {}
  const values = 'values' in state ? state.values : undefined

  return (
    <details
      className="mt-12 rounded-2xl border border-border bg-surface-muted/50"
      data-testid="feedback-disclosure"
    >
      <summary className="cursor-pointer list-none rounded-2xl px-5 py-4 text-sm font-semibold text-foreground outline-none transition hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus/40 sm:px-6">
        <span className="flex items-center gap-2">
          <MessageSquareWarning aria-hidden="true" size={17} />
          {t('disclosureTitle')}
        </span>
      </summary>

      <div className="border-t border-border px-5 py-6 sm:px-6">
        {state.status === 'success' ? (
          <div
            className="flex gap-3 rounded-xl border border-success/30 bg-success/10 p-4"
            data-testid="feedback-success"
            role="status"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-success"
              size={18}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('successTitle')}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {t('successDescription')}
              </p>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-5" data-testid="feedback-form">
            <p className="text-sm leading-6 text-muted">
              {t('disclosureDescription')}
            </p>

            <input name="contentType" type="hidden" value={contentType} />
            <input name="slug" type="hidden" value={slug} />
            <input name="locale" type="hidden" value={locale} />

            {/*
              Honeypot: off-screen rather than `display: none`, because some bots
              skip hidden inputs. Removed from the accessibility tree and the tab
              order so a person never reaches it.
            */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto">
              <label htmlFor={`${baseId}-website`}>{t('honeypotLabel')}</label>
              <input
                autoComplete="off"
                defaultValue=""
                id={`${baseId}-website`}
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                type="text"
              />
            </div>

            {state.status === 'rate-limited' || state.status === 'unknown-target' ? (
              <div
                className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
                data-testid="feedback-error"
                role="alert"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-warning"
                  size={18}
                />
                <p className="text-sm leading-6 text-foreground">
                  {state.status === 'rate-limited'
                    ? t('errorRateLimited')
                    : t('errorUnknownTarget')}
                </p>
              </div>
            ) : null}

            <div>
              <label
                className="mb-2 block text-sm font-semibold text-foreground"
                htmlFor={ids.type}
              >
                {t('typeLabel')}
              </label>
              <Select
                aria-describedby={
                  fieldErrors.feedbackType ? ids.typeError : undefined
                }
                aria-invalid={fieldErrors.feedbackType ? true : undefined}
                defaultValue={values?.feedbackType || 'incorrect-german'}
                id={ids.type}
                name="feedbackType"
                required
              >
                {feedbackTypes.map((value) => (
                  <option key={value} value={value}>
                    {t(`type_${value}`)}
                  </option>
                ))}
              </Select>
              {fieldErrors.feedbackType ? (
                <FieldError id={ids.typeError} messageKey={fieldErrors.feedbackType} />
              ) : null}
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold text-foreground"
                htmlFor={ids.message}
              >
                {t('messageLabel')}
              </label>
              <Textarea
                aria-describedby={fieldErrors.message ? ids.messageError : undefined}
                aria-invalid={fieldErrors.message ? true : undefined}
                defaultValue={values?.message ?? ''}
                id={ids.message}
                name="message"
                placeholder={t('messagePlaceholder')}
                required
              />
              {fieldErrors.message ? (
                <FieldError id={ids.messageError} messageKey={fieldErrors.message} />
              ) : null}
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold text-foreground"
                htmlFor={ids.email}
              >
                {t('emailLabel')}
              </label>
              <Input
                aria-describedby={
                  fieldErrors.email ? ids.emailError : ids.emailHint
                }
                aria-invalid={fieldErrors.email ? true : undefined}
                autoComplete="email"
                defaultValue={values?.email ?? ''}
                id={ids.email}
                name="email"
                type="email"
              />
              {fieldErrors.email ? (
                <FieldError id={ids.emailError} messageKey={fieldErrors.email} />
              ) : (
                <p className="mt-2 text-xs leading-5 text-muted" id={ids.emailHint}>
                  {t('emailHint')}
                </p>
              )}
            </div>

            <SubmitButton />
          </form>
        )}
      </div>
    </details>
  )
}

/**
 * Errors arrive from the server as message *keys*, so the wording is chosen here
 * in the reader's language rather than being fixed to English on the server.
 */
function FieldError({
  id,
  messageKey,
}: {
  id: string
  messageKey: FeedbackErrorMessageKey
}) {
  const t = useTranslations('Feedback')

  return (
    <p className="mt-2 text-sm font-medium text-error" id={id}>
      {t(messageKey)}
    </p>
  )
}
