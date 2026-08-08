import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="mb-4 text-8xl font-black tracking-tight"
        style={{ color: 'var(--color-accent)' }}
      >
        404
      </p>
      <h1 className="mb-3 text-xl font-bold" style={{ color: 'var(--text-1)' }}>
        Page introuvable
      </h1>
      <p
        className="mb-8 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--text-2)' }}
      >
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #7477ff, #6366f1)' }}
        >
          Retour au tableau de bord
        </Link>
        <Link href="/" className="text-sm" style={{ color: 'var(--text-3)' }}>
          Page d&apos;accueil
        </Link>
      </div>
    </div>
  )
}
