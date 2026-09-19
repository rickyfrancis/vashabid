/**
 * Onboarding vocabulary and the limits the signup rules enforce.
 *
 * These enums are imported by both `collections/LearnerProfiles.ts` and the
 * validation schema, so the stored options and the accepted options are one
 * list rather than two that can drift.
 */

/**
 * Which learner-support language a learner wants explanations in.
 *
 * Deliberately narrower than `supportMode`: onboarding asks for a primary and an
 * optional secondary language, and `deriveSupportMode` turns that pair into the
 * three-valued `supportMode` stored on the user.
 */
export const supportLanguages = ['en', 'bn'] as const
export type SupportLanguage = (typeof supportLanguages)[number]

/** Why the learner is studying German. Drives later content recommendations. */
export const learningGoals = [
  'travel',
  'work',
  'study',
  'exam',
  'family',
  'culture',
] as const
export type LearningGoal = (typeof learningGoals)[number]

/** The kind of practice a learner wants most of. */
export const practiceStyles = [
  'vocabulary',
  'grammar',
  'conversation',
  'listening',
  'mixed',
] as const
export type PracticeStyle = (typeof practiceStyles)[number]

/**
 * Daily study target in minutes.
 *
 * Stored as a select rather than a free number so the value is validated by the
 * schema, and so the admin UI and the onboarding form offer the same choices.
 */
export const dailyStudyTargets = ['5', '10', '20', '30', '60'] as const
export type DailyStudyTarget = (typeof dailyStudyTargets)[number]

/**
 * Password bounds.
 *
 * Payload enforces no minimum password length of its own, so this is the only
 * thing standing between a public signup and a one-character password. The
 * maximum keeps an oversized body from reaching the hashing work.
 */
export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 200

export const EMAIL_MAX_LENGTH = 254
export const DISPLAY_NAME_MIN_LENGTH = 2
export const DISPLAY_NAME_MAX_LENGTH = 80

/** Signup attempts allowed per client within the window. */
export const SIGNUP_RATE_LIMIT = 10
export const SIGNUP_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

/** Login attempts allowed per client within the window. */
export const LOGIN_RATE_LIMIT = 20
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

/**
 * The honeypot input name, shared with the feedback form's convention. It
 * describes the form rather than a submission, so it stays out of the schemas.
 */
export const HONEYPOT_FIELD = 'website'
