import type {
  DailyStudyTarget,
  LearningGoal,
  PracticeStyle,
  SupportLanguage,
} from '../../../../features/auth/constants'
import type { UserRole } from '../../access/values'

export interface LearnerProfileSeed {
  dailyStudyTarget: DailyStudyTarget
  germanLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  learningGoal: LearningGoal
  practiceStyle: PracticeStyle
  primarySupportLanguage: SupportLanguage
  secondarySupportLanguage?: SupportLanguage
}

export interface UserSeed {
  displayName: string
  /** Env var holding the password, when this account should be configurable. */
  passwordEnvVar?: string
  /** Used only outside production; see `seedUsers`. */
  developmentPassword: string
  emailEnvVar?: string
  fallbackEmail: string
  profile?: LearnerProfileSeed
  role: UserRole
  supportMode: 'bn' | 'both' | 'en'
  uiLocale: 'bn' | 'en'
}

/**
 * The accounts every environment needs.
 *
 * This file is what replaced the old first-user promotion. Admin access is now
 * something an operator provisions on purpose rather than something the first
 * HTTP request to reach an empty database can claim.
 *
 * The learner exists so the browser suite has real credentials to sign in with,
 * and carries a completed profile so the "preferences follow the account" path
 * is exercised without a test having to walk onboarding first.
 */
export const userSeeds: UserSeed[] = [
  {
    developmentPassword: 'change-me-in-development',
    displayName: 'Vashabid Admin',
    emailEnvVar: 'SEED_ADMIN_EMAIL',
    fallbackEmail: 'admin@vashabid.local',
    passwordEnvVar: 'SEED_ADMIN_PASSWORD',
    role: 'admin',
    supportMode: 'en',
    uiLocale: 'en',
  },
  {
    developmentPassword: 'seeded-learner-password',
    displayName: 'Rifat',
    fallbackEmail: 'learner@vashabid.local',
    profile: {
      dailyStudyTarget: '20',
      germanLevel: 'A2',
      learningGoal: 'travel',
      practiceStyle: 'mixed',
      primarySupportLanguage: 'bn',
    },
    role: 'learner',
    supportMode: 'bn',
    uiLocale: 'bn',
  },
]
