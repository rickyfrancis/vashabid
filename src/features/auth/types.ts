import type { SupportMode } from '@/features/i18n/support-mode'
import type { Locale } from '@/features/i18n/types'
import type { UserRole } from '@/lib/payload/access'
import type { AuthFieldErrors } from './validation'
import type {
  DailyStudyTarget,
  LearningGoal,
  PracticeStyle,
  SupportLanguage,
} from './constants'

/**
 * The signed-in learner as the UI needs them.
 *
 * A view model rather than the Payload document: it carries no password hash,
 * no session array, and no `_sid`, so nothing sensitive can reach client props
 * by being handed the whole user by accident.
 */
export interface SessionUser {
  displayName: string
  email: string
  id: number | string
  role: UserRole
  supportMode: SupportMode
  uiLocale: Locale
}

export interface SessionProfile {
  dailyStudyTarget: DailyStudyTarget
  germanLevel: string
  learningGoal: LearningGoal
  onboardingCompletedAt: string | null
  practiceStyle: PracticeStyle
  primarySupportLanguage: SupportLanguage
  secondarySupportLanguage: SupportLanguage | null
}

export interface Session {
  /** Null until onboarding has been completed at least once. */
  profile: SessionProfile | null
  user: SessionUser
}

/** The outcome of a signup attempt, in the project's service-union style. */
export type SignupResult =
  | { fieldErrors: AuthFieldErrors; kind: 'invalid' }
  | { kind: 'rate-limited' }
  | { kind: 'success' }

export type LoginResult =
  | { fieldErrors: AuthFieldErrors; kind: 'invalid' }
  | { kind: 'invalid-credentials' }
  | { kind: 'rate-limited' }
  | { kind: 'success' }

export type OnboardingResult =
  | { fieldErrors: AuthFieldErrors; kind: 'invalid' }
  | { kind: 'success' }
  | { kind: 'unauthenticated' }

/** What the signup form carries back between submissions. */
export type SignupFormState =
  | { fieldErrors: AuthFieldErrors; status: 'invalid'; values: SignupFormValues }
  | { status: 'idle' }
  | { status: 'rate-limited'; values: SignupFormValues }

export interface SignupFormValues {
  displayName: string
  email: string
}

export type LoginFormState =
  | { fieldErrors: AuthFieldErrors; status: 'invalid'; values: LoginFormValues }
  | { status: 'idle' }
  | { status: 'invalid-credentials'; values: LoginFormValues }
  | { status: 'rate-limited'; values: LoginFormValues }

export interface LoginFormValues {
  email: string
}

export type OnboardingFormState =
  | { fieldErrors: AuthFieldErrors; status: 'invalid' }
  | { status: 'idle' }
  | { status: 'unauthenticated' }

export type { AuthFieldErrors }
