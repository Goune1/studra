'use client'

import { useActionState } from 'react'
import { GraduationCap, Lock } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { unlockBac } from './actions'

const COLOR = '#1F4D3F'

export function BacGate() {
  const [error, action, pending] = useActionState(unlockBac, null)

  return (
    <div className="max-w-md">
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={14} style={{ color: COLOR }} />
          <Eyebrow>Notes Pronote</Eyebrow>
        </div>
        <h1 className="section-h">Bientôt disponible</h1>
        <p className="text-sm mt-3" style={{ color: 'var(--ink-500)' }}>
          Cette fonctionnalité est en cours de développement. Elle sera disponible prochainement pour tous les utilisateurs.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Accès bêta</p>
        <p className="text-xs mb-5" style={{ color: 'var(--ink-500)' }}>
          Vous avez un accès anticipé ? Entrez le mot de passe pour continuer.
        </p>

        <form action={action} className="space-y-3">
          <div className="relative">
            <Lock
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ink-400)' }}
            />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              required
              autoComplete="off"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--surface-2)',
                border: `1px solid ${error ? '#EF444450' : 'var(--border)'}`,
                color: 'var(--ink)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
              onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#EF444450' : 'var(--border)')}
            />
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
          >
            {pending ? 'Vérification...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  )
}
