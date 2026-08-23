import 'server-only'

import { cookies } from 'next/headers'
import type { Locale } from './types'
import {
  resolveSupportMode,
  SUPPORT_MODE_COOKIE,
  type SupportMode,
} from './support-mode'

export async function getInitialSupportMode(
  locale: Locale,
): Promise<SupportMode> {
  const cookieStore = await cookies()
  return resolveSupportMode(cookieStore.get(SUPPORT_MODE_COOKIE)?.value, locale)
}
