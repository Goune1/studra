'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <AlertCircle size={26} style={{ color: '#f87171' }} />
      </div>
      <h1 className="mb-3 text-xl font-bold" style={{ color: 'var(--text-1)' }}>
        Quelque chose s&apos;est mal passé
      </h1>
      <p
        className="mb-8 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--text-2)' }}
      >
        Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou revenir au
        tableau de bord.
      </p>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #7477ff, #6366f1)' }}
        >
          Réessayer
        </button>
        <Link href="/dashboard" className="text-sm" style={{ color: 'var(--text-3)' }}>
          Retour au tableau de bord
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs" style={{ color: 'var(--text-4)' }}>
          Code&nbsp;: {error.digest}
        </p>
      )}
    </div>
  )
}
