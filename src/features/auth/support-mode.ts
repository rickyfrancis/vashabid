import type { SupportMode } from '@/features/i18n/support-mode'
import type { SupportLanguage } from './constants'

/**
 * Turns onboarding's primary/optional-secondary pair into the three-valued
 * `supportMode` stored on the user.
 *
 * Onboarding asks the question the way a learner thinks about it — "which
 * language do you want explanations in, and is there a second one?" — while the
 * rest of the app reads a single `supportMode`. Keeping the translation in one
 * pure function means the two representations cannot drift, and it is the only
 * place that decides what `both` means.
 *
 * A secondary equal to the primary would derive `both` from one language and
 * render the same text twice, so the schema rejects that pair before it reaches
 * here; this function still treats it as a single language rather than trusting
 * its caller.
 */
export function deriveSupportMode(
  primary: SupportLanguage,
  secondary?: SupportLanguage | null,
): SupportMode {
  if (!secondary || secondary === primary) return primary

  return 'both'
}
