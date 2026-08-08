import type {Locale} from 'next-intl'
import { getAdminSupabase, verifyUnsubscribeToken } from '@/lib/email-marketing'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'

export const metadata = { title: 'Désinscription — Studra' }

type SearchParams = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ params, searchParams }: SearchParams) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, fontSize: 36 }}>✓</div>
        <h1 style={{ marginBottom: 8, fontSize: 20, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.015em' }}>Désinscription confirmée</h1>
        <p style={{ marginBottom: 24, fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.6 }}>
          Tu ne recevras plus d&apos;emails marketing de Studra.<br />
          Tu peux toujours gérer tes préférences depuis ton compte.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
          Retour au tableau de bord
        </Link>
      </div>
    </UnsubscribeLayout>
  )
}

function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-v2" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRadius: 20, border: '1px solid var(--ink-200)', background: 'var(--bg-elev)', padding: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Studra</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 16, fontSize: 36 }}>✗</div>
      <p style={{ fontSize: 14, color: '#dc2626' }}>{text}</p>
    </div>
  )
}
