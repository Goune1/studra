import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: "Inscrivez-vous gratuitement sur Studra et commencez à générer des flashcards, fiches de révision et examens avec l'IA.",
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
