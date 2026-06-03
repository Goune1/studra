'use client'

import { useActionState } from 'react'
import { Users, Lock } from 'lucide-react'
import { unlockAffiliate } from './actions'

const COLOR = '#10B981'

export function AffiliateGate() {
  const [error, action, pending] = useActionState(unlockAffiliate, null)

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users size={14} style={{ color: COLOR }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: COLOR }}>
            Affiliation
          </span>
        </div>
        <h1 className="text-4xl text-white tracking-tight">Bientôt disponible</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
          Le programme d'affiliation est en cours de déploiement. Il sera disponible prochainement pour tous les utilisateurs.
        </p>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold text-white mb-4">Accès bêta</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
          Vous avez un accès anticipé ? Entrez le mot de passe pour continuer.
        </p>

        <form action={action} className="space-y-3">
          <div className="relative">
            <Lock
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-4)' }}
            />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              required
              autoComplete="off"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--surface-deep, #111)',
                border: `1px solid ${error ? '#EF444450' : 'var(--border)'}`,
                color: '#E2E8F0',
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#FCA5A5' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: COLOR }}
          >
            {pending ? 'Vérification...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  )
}
