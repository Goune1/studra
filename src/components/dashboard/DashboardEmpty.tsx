import Link from 'next/link'
import type { DashboardUser, UpcomingExam } from '@/lib/dashboard/queries'

const monoSm: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), monospace',
  fontSize: 11,
  letterSpacing: '.12em',
  color: 'var(--ink-500)',
}

const card: React.CSSProperties = {
  background: 'var(--bg-elev)',
  border: '1px solid var(--ink-200)',
  borderRadius: 10,
}

interface Props {
  user: DashboardUser
  dateLabel: string
  upcomingExams: UpcomingExam[]
}

export function DashboardEmpty({ user, dateLabel, upcomingExams }: Props) {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Date */}
      <div style={monoSm}>{dateLabel}</div>

      {/* Welcome */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.1, color: 'var(--ink)', margin: 0 }}>
          Bienvenue, {user.name}.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-500)', margin: 0 }}>
          Transforme n&apos;importe quel cours en cartes de révision, en 30 secondes.
        </p>
      </div>

      {/* Dropzone */}
      <div style={{ border: '1.5px dashed rgba(31,77,63,.45)', borderRadius: 12, background: 'var(--bg-elev)', padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <ImportOption href="/flashcards/new" label="Coller un texte">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
            </svg>
          </ImportOption>
          <ImportOption href="/flashcards/new" label="Importer un PDF">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          </ImportOption>
          <ImportOption href="/flashcards/new" label="Photo de cours">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </ImportOption>
          <ImportOption href="/flashcards/new" label="Lien YouTube">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </ImportOption>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Link
            href="/flashcards/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
          >
            Créer mon premier deck
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>
            pas de cours sous la main ?{' '}
            <Link href="/flashcards" style={{ textDecoration: 'underline', textUnderlineOffset: 3, color: 'var(--ink-700)' }}>
              essaie un deck d&apos;exemple (Bac Philo)
            </Link>
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-500)', textAlign: 'center', marginTop: -16 }}>
        Avec la répétition espacée, tu retiens plus en révisant moins.
      </p>

      {/* TON CHEMIN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={monoSm}>TON CHEMIN</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div style={{ ...card, borderLeft: '3px solid var(--accent)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10.5, color: 'var(--accent)' }}>01</span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>Importer un cours</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>~1 minute</span>
          </div>
          <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10.5, color: 'var(--ink-400)' }}>02</span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink-400)' }}>Vérifier tes cartes</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>générées par l&apos;IA</span>
          </div>
          <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10.5, color: 'var(--ink-400)' }}>03</span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink-400)' }}>Réviser 5 minutes</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>répétition espacée</span>
          </div>
        </div>
      </div>

      {/* PRÉPARE UNE ÉCHÉANCE */}
      {upcomingExams.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={monoSm}>PRÉPARE UNE ÉCHÉANCE</div>
          <div style={{ border: '1px dashed var(--ink-200)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--ink-700)', flex: 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-500)', flexShrink: 0 }}>
                <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              </svg>
              Ajoute la date de ton bac ou de tes partiels : compte à rebours et planning automatique.
            </span>
            <Link
              href="/planning"
              style={{ border: '1px solid var(--ink-200)', borderRadius: 8, padding: '8px 16px', fontSize: 13.5, fontWeight: 500, color: 'var(--ink-700)', whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              Ajouter une date
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

function ImportOption({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ border: '1px solid var(--ink-200)', borderRadius: 10, padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--bg)', textDecoration: 'none' }}
    >
      <span style={{ color: 'var(--accent)' }}>{children}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', textAlign: 'center' }}>{label}</span>
    </Link>
  )
}
