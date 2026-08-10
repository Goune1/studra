import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  const t = await getTranslations({locale: locale as Locale, namespace: 'auth.login.metadata'})

  return {title: t('title'), description: t('description')}
}

export default async function LoginLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <>{children}</>
}
