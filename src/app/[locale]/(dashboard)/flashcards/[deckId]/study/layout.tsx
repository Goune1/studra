import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export default async function StudyLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="fixed inset-0 z-[100]" style={{ background: 'var(--app-bg)' }}>
      {children}
    </div>
  )
}
