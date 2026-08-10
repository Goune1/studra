'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const FEATURES = [
  'Générations IA illimitées',
  'Mode Socrate (maïeutique)',
  "Planning d'examen personnalisé",
  'Analyse des lacunes avancée',
  'Toutes les futures fonctionnalités',
]

export function UpgradeBanner({ generationsUsed, generationsQuota }: {
  generationsUsed: number
  generationsQuota: number
}) {
  const t = useTranslations('dashboard.upgrade')
  const [loading, setLoading] = useState(false)
  const left = Math.max(0, generationsQuota - generationsUsed)
  const overQuota = left === 0

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t('checkoutError'))
        return
      }
      window.location.href = data.url
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-12 rounded-2xl border border-[rgba(99,102,241,0.3)] bg-gradient-to-br from-[#13132b] to-[#0e0e1c] overflow-hidden shadow-[0_32px_64px_-32px_rgba(99,102,241,0.35)]">
      <div className="p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">

        {/* Left: pitch */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#7C7AE8]" />
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-[#7C7AE8]">
              Passe à la vitesse supérieure
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">
            Studra Pro — 4,99&nbsp;€/mois
          </h2>

          {overQuota ? (
            <p className="text-[#f87171] text-sm mb-6">
              Tu as utilisé tes {generationsQuota} générations ce mois-ci. Passe Pro pour continuer sans limite.
            </p>
          ) : (
            <p className="text-zinc-400 text-sm mb-6">
              Il te reste <strong className="text-white">{left} génération{left > 1 ? 's' : ''}</strong> ce mois-ci.
              Passe Pro pour des générations illimitées.
            </p>
          )}

          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="w-4 h-4 rounded-full flex items-center justify-center bg-[rgba(99,102,241,0.2)] text-[#818cf8] text-[10px] flex-shrink-0">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-stretch md:items-end gap-3 md:min-w-[200px]">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-[#6366f1] hover:bg-[#5558e8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm whitespace-nowrap"
          >
            {loading ? 'Redirection…' : 'Passer Pro →'}
          </button>
          <span className="text-zinc-600 text-xs text-center">
            Sans engagement · Annule en 1 clic
          </span>
        </div>

      </div>
    </div>
  )
}
