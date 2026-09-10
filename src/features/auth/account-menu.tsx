import { LogIn, LogOut, UserRound } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Link } from '@/features/i18n/navigation'
import { logout } from './actions'
import type { Session } from './types'

/**
 * The header's account controls.
 *
 * The session arrives as a prop from the root layout rather than being read
 * here, which keeps `server-only` out of the layout barrel that several client
 * components import. Signing out is a form POST rather than a link:
 * a GET must not end a session, and this way it still works if the button is
 * activated before hydration.
 */
export function AccountMenu({
  linkClassName,
  session,
}: {
  linkClassName: string
  session: Session | null
}) {
  const locale = useLocale()
  const t = useTranslations('Auth')
  const navigation = useTranslations('Navigation')

  if (!session) {
    return (
      <div className="flex flex-wrap gap-2" data-testid="account-signed-out">
        <Link className={linkClassName} href="/login">
          <LogIn aria-hidden="true" size={17} strokeWidth={1.8} />
          {navigation('login')}
        </Link>
        <Link className={linkClassName} href="/signup">
          {navigation('signup')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="account-signed-in">
      <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
        <UserRound aria-hidden="true" size={17} strokeWidth={1.8} />
        {t('signedInAs', { name: session.user.displayName })}
      </span>
      <form action={logout}>
        <input name="locale" type="hidden" value={locale} />
        <button className={linkClassName} data-testid="logout" type="submit">
          <LogOut aria-hidden="true" size={17} strokeWidth={1.8} />
          {t('logout')}
        </button>
      </form>
    </div>
  )
}
