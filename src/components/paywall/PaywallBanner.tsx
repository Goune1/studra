'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { trackPaywallViewed, trackPaywallCtaClicked } from '@/lib/analytics'
import type { GenerationTool } from './types'

export function PaywallBanner({ tool }: { tool: GenerationTool }) {
  useEffect(() => {
    trackPaywallViewed(tool, 'banner')
  }, [tool])

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
      style={{ background: 'var(--accent-soft)', border: '1px solid rgba(31,77,63,0.25)' }}
    >
      <p className="text-sm" style={{ color: 'var(--accent)' }}>
        {"Tes 5 générations gratuites du mois sont épuisées."}
      </p>
      <Link
        href="/upgrade"
        onClick={() => trackPaywallCtaClicked(tool, 'banner')}
        className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors"
        style={{ color: 'var(--accent)' }}
      >
        Voir l’offre Pro <ArrowRight size={14} />
      </Link>
    </div>
  )
}
