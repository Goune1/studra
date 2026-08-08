import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à votre compte Studra pour accéder à vos supports de révision générés par IA.',
}

export default async function LoginLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <>{children}</>
}
