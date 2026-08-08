import type { Metadata } from 'next'
import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: "Inscrivez-vous gratuitement sur Studra et commencez à générer des flashcards, fiches de révision et examens avec l'IA.",
}

export default async function RegisterLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return <>{children}</>
}
