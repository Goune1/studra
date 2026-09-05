'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { trackPaywallViewed, trackPaywallCtaClicked } from '@/lib/analytics'
import type { GenerationTool } from './types'

const COLOR = '#1F4D3F'
const PRO_FEATURES = [
  'Générations IA illimitées',
  'Mode Socrate (maïeutique)',
  "Planning d'examen personnalisé",
  'Analyse des lacunes avancée',
  'Toutes les futures fonctionnalités',
]

interface PaywallModalProps {
  tool: GenerationTool
  price: string | null
  onClose: () => void
}

export function PaywallModal({ tool, price, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackPaywallViewed(tool, 'modal')
  }, [tool])

  async function handleCheckout() {
    setLoading(true)
    trackPaywallCtaClicked(tool, 'modal')
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors du checkout")
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      toast.error("Une erreur est survenue")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-7 shadow-2xl"
        style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: COLOR + '15' }}
          >
            <Sparkles size={18} style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>{"Tes 5 générations gratuites sont utilisées"}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-500)' }}>{"Passe Pro pour continuer à générer sans limite."}</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5 mb-5">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                style={{ background: COLOR + '20', color: COLOR }}
              >✓</span>
              {f}
            </li>
          ))}
        </ul>

        {price && (
          <div
            className="mb-5 flex items-baseline gap-2 rounded-xl px-4 py-3"
            style={{ background: COLOR + '0c', border: `1px solid ${COLOR}25` }}
          >
            <span className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{price}</span>
          </div>
        )}

        <p className="mb-5 text-xs" style={{ color: 'var(--ink-400)' }}>
          {"Supprimer tes contenus ne restaure pas tes générations."}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--ink-200)', color: 'var(--ink-700)' }}
          >
            {"Plus tard"}
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: COLOR }}
          >
            {loading ? "Redirection…" : "Passer Pro"}
          </button>
        </div>
      </div>
    </div>
  )
}
