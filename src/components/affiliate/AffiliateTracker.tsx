'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { isReferralCode } from '@/lib/referral-code'

/** Backward compatibility for legacy `/?ref=...` links. New links use the
 * server-side redirect route and work without JavaScript. */
export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    const ref = searchParams.get('ref')
    // Un code de parrainage utilisateur est géré par le proxy, pas par l'affiliation.
    if (!ref || isReferralCode(ref)) return
    tracked.current = true

    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    }).catch(() => undefined)
  }, [searchParams])

  return null
}
