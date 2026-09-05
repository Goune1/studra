import type { Metadata } from 'next'
export const metadata: Metadata = {title: "Mot de passe oublié", description: "Réinitialisez le mot de passe de votre compte Studra en recevant un lien sécurisé par email."}

export default function ForgotPasswordLayout({ children }: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
