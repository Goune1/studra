import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'
import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export default async function SeoLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="landing-v2 min-h-screen">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
