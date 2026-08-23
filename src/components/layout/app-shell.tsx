import { useTranslations } from 'next-intl'
import { Footer } from './footer'
import { Header } from './header'

export function AppShell({ children }: { children: React.ReactNode }) {
  const shell = useTranslations('Shell')

  return (
    <div className="workbook-canvas flex min-h-dvh flex-col">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-brand-800 px-4 py-3 font-semibold text-white shadow-lg transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
        href="#main-content"
      >
        {shell('skipToContent')}
      </a>
      <Header />
      <main className="relative z-10 flex flex-1 flex-col" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
