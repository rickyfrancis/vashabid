import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Bengali } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { SupportModeProvider } from '@/features/i18n/support-mode-provider'
import { getInitialSupportMode } from '@/features/i18n/support-mode.server'
import { routing } from '@/features/i18n/routing'
import type { Locale } from '@/features/i18n/types'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSansBengali = Noto_Sans_Bengali({
  variable: '--font-bangla',
  subsets: ['bengali', 'latin'],
  weight: 'variable',
})

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) return {}

  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) notFound()

  const typedLocale = locale as Locale
  const [messages, initialSupportMode] = await Promise.all([
    getMessages({ locale: typedLocale }),
    getInitialSupportMode(typedLocale),
  ])

  return (
    <html
      lang={typedLocale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={typedLocale} messages={messages}>
          <SupportModeProvider
            initialMode={initialSupportMode}
            key={typedLocale}
          >
            {children}
          </SupportModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
