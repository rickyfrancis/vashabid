'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  serializeSupportModeCookie,
  type SupportMode,
} from './support-mode'

type SupportModeContextValue = {
  supportMode: SupportMode
  setSupportMode: (mode: SupportMode) => void
}

const SupportModeContext = createContext<SupportModeContextValue | null>(null)

/**
 * Holds the current support mode for the tree below it.
 *
 * `persist` is supplied only when somebody is signed in: the cookie is written
 * either way, so the choice survives a sign-out and keeps working for anonymous
 * visitors, while a learner's account also remembers it on their next device.
 * The write is fire-and-forget because the UI has already switched — a failed
 * save should not roll the interface back under the reader.
 */
export function SupportModeProvider({
  children,
  initialMode,
  persist,
}: {
  children: React.ReactNode
  initialMode: SupportMode
  persist?: (mode: SupportMode) => Promise<void>
}) {
  const [supportMode, setSupportModeState] = useState(initialMode)

  const setSupportMode = useCallback(
    (mode: SupportMode) => {
      setSupportModeState(mode)
      document.cookie = serializeSupportModeCookie(
        mode,
        window.location.protocol === 'https:',
      )

      void persist?.(mode)
    },
    [persist],
  )

  const value = useMemo(
    () => ({ supportMode, setSupportMode }),
    [setSupportMode, supportMode],
  )

  return (
    <SupportModeContext.Provider value={value}>
      {children}
    </SupportModeContext.Provider>
  )
}

export function useSupportMode(): SupportModeContextValue {
  const context = useContext(SupportModeContext)

  if (!context) {
    throw new Error('useSupportMode must be used within SupportModeProvider')
  }

  return context
}
