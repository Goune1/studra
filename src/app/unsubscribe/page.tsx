import { getAdminSupabase, verifyUnsubscribeToken } from '@/lib/email-marketing'
import Link from 'next/link'

export const metadata = { title: 'Désinscription — Studra' }

type SearchParams = { searchParams: Promise<{ token?: string }> }

export default async function UnsubscribePage({ searchParams }: SearchParams) {
  const { token } = await searchParams

  if (!token) {
    return <UnsubscribeLayout><ErrorMessage text="Lien de désinscription invalide (token manquant)." /></UnsubscribeLayout>
  }

  const decoded = verifyUnsubscribeToken(token)
  if (!decoded) {
    return <UnsubscribeLayout><ErrorMessage text="Lien de désinscription invalide ou expiré." /></UnsubscribeLayout>
  }

  const db = getAdminSupabase()
  const { error } = await db
    .from('profiles')
    .update({ marketing_consent: false })
    .eq('id', decoded.userId)

  if (error) {
    return <UnsubscribeLayout><ErrorMessage text="Une erreur est survenue. Réessaie plus tard ou contacte-nous." /></UnsubscribeLayout>
  }

  return (
    <UnsubscribeLayout>
      <div className="text-center">
        <div className="mb-4 text-4xl">✓</div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Désinscription confirmée</h1>
        <p className="mb-6 text-sm text-gray-500 leading-relaxed">
          Tu ne recevras plus d'emails marketing de Studra.<br />
          Tu peux toujours gérer tes préférences depuis ton compte.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </UnsubscribeLayout>
  )
}

function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-lg font-bold tracking-tight text-gray-900">Studra</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div className="text-center">
      <div className="mb-4 text-4xl">✗</div>
      <p className="text-sm text-red-600">{text}</p>
    </div>
  )
}
