import type { Metadata } from 'next'
export const metadata: Metadata = {title: "Nouveau mot de passe", description: "Choisissez un nouveau mot de passe pour votre compte Studra."}

export default function ResetPasswordLayout({ children }: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
