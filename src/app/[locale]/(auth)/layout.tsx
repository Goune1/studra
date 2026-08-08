import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <>{children}</>
}
