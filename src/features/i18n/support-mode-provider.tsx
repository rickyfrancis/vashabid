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

export function SupportModeProvider({
  children,
  initialMode,
}: {
  children: React.ReactNode
  initialMode: SupportMode
}) {
  const [supportMode, setSupportModeState] = useState(initialMode)

  const setSupportMode = useCallback((mode: SupportMode) => {
    setSupportModeState(mode)
    document.cookie = serializeSupportModeCookie(
      mode,
      window.location.protocol === 'https:',
    )
  }, [])

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
