'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

/** Backward compatibility for legacy `/?ref=...` links. New links use the
 * server-side redirect route and work without JavaScript. */
export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    const ref = searchParams.get('ref')
    if (!ref) return
    tracked.current = true

    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref }),
    }).catch(() => undefined)
  }, [searchParams])

  return null
}
