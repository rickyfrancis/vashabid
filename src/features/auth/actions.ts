'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { defaultLocale, isLocale } from '@/features/i18n/types'
import { clearAuthCookie, setAuthCookie } from './cookies.server'
import { HONEYPOT_FIELD } from './constants'
import { AuthService, OnboardingService } from './service'
import { getSession } from './session.server'
import type {
  LoginFormState,
  LoginFormValues,
  OnboardingFormState,
  SignupFormState,
  SignupFormValues,
} from './types'

function text(formData: FormData, field: string): string {
  const value = formData.get(field)

  return typeof value === 'string' ? value : ''
}

function localeOf(formData: FormData) {
  const value = text(formData, 'locale')

  return isLocale(value) ? value : defaultLocale
}

function signupValues(formData: FormData): SignupFormValues {
  return {
    displayName: text(formData, 'displayName'),
    email: text(formData, 'email'),
  }
}

/**
 * Creates an account, signs the new learner in, and sends them to onboarding.
 *
 * The redirect is deliberately outside the `try`: `redirect()` works by
 * throwing, so catching around it would swallow the navigation and report a
 * failure for a signup that actually succeeded.
 */
export async function signup(
  _previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const locale = localeOf(formData)
  const values = signupValues(formData)

  // A bot that fills the hidden field is told everything went fine and nothing
  // is written, so it learns nothing from the response.
  if (text(formData, HONEYPOT_FIELD).trim() !== '') {
    redirect(`/${locale}/onboarding`)
  }

  const requestHeaders = await headers()
  const service = new AuthService()
  const result = await service.signup(
    {
      displayName: values.displayName,
      email: values.email,
      password: text(formData, 'password'),
      uiLocale: locale,
    },
    requestHeaders,
  )

  if (result.kind === 'invalid') {
    return { fieldErrors: result.fieldErrors, status: 'invalid', values }
  }

  if (result.kind === 'rate-limited') {
    return { status: 'rate-limited', values }
  }

  const session = await service.login(
    { email: values.email, password: text(formData, 'password') },
    requestHeaders,
  )

  if (session.kind === 'success' && session.token) {
    await setAuthCookie(session.token)
    redirect(`/${locale}/onboarding`)
  }

  // The account exists but the automatic sign-in did not take. Sending them to
  // the login form is better than reporting a signup failure that did not
  // happen.
  redirect(`/${locale}/login`)
}

export async function login(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const locale = localeOf(formData)
  const values: LoginFormValues = { email: text(formData, 'email') }

  const result = await new AuthService().login(
    { email: values.email, password: text(formData, 'password') },
    await headers(),
  )

  if (result.kind === 'invalid') {
    return { fieldErrors: result.fieldErrors, status: 'invalid', values }
  }

  if (result.kind === 'rate-limited') {
    return { status: 'rate-limited', values }
  }

  if (result.kind === 'invalid-credentials' || !result.token) {
    return { status: 'invalid-credentials', values }
  }

  await setAuthCookie(result.token)
  redirect(`/${locale}`)
}

/**
 * Ends the session server-side, then clears the cookie.
 *
 * Order matters: revoking needs the token that is about to be thrown away.
 */
export async function logout(formData: FormData): Promise<void> {
  const locale = localeOf(formData)

  await new AuthService().logout(await headers())
  await clearAuthCookie()

  redirect(`/${locale}`)
}

export async function submitOnboarding(
  _previousState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const session = await getSession()

  if (!session) return { status: 'unauthenticated' }

  const locale = localeOf(formData)
  const requestHeaders = await headers()

  const result = await new OnboardingService().submit(
    {
      dailyStudyTarget: text(formData, 'dailyStudyTarget'),
      germanLevel: text(formData, 'germanLevel'),
      learningGoal: text(formData, 'learningGoal'),
      practiceStyle: text(formData, 'practiceStyle'),
      primarySupportLanguage: text(formData, 'primarySupportLanguage'),
      secondarySupportLanguage: text(formData, 'secondarySupportLanguage'),
      uiLocale: locale,
    },
    {
      headers: requestHeaders,
      user: { ...session.user, collection: 'users' },
      userId: session.user.id,
    },
  )

  if (result.kind === 'invalid') {
    return { fieldErrors: result.fieldErrors, status: 'invalid' }
  }

  if (result.kind === 'unauthenticated') return { status: 'unauthenticated' }

  redirect(`/${locale}`)
}

/**
 * Persists a support-mode change for a signed-in learner.
 *
 * The switcher already writes the anonymous cookie; this makes the choice
 * follow the account to another device. Anonymous visitors never reach it.
 */
export async function persistSupportMode(mode: string): Promise<void> {
  const session = await getSession()

  if (!session) return

  const { UserRepository } = await import('./repository')

  await new UserRepository().updatePreferences(
    session.user.id,
    { supportMode: mode },
    {
      headers: await headers(),
      user: { ...session.user, collection: 'users' },
    },
  )
}
