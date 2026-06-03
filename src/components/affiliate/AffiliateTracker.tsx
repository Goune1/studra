'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const COOKIE_NAME = 'studra_ref'
const STORAGE_KEY = 'studra_visitor_id'

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return ''
  }
}

function hasCookie(name: string): boolean {
  try {
    return document.cookie.split(';').some(c => c.trim().startsWith(`${name}=`))
  } catch {
    return false
  }
}

export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    const ref = searchParams.get('ref')
    if (!ref) return

    // Si le cookie est déjà positionné avec ce code, ne pas re-tracker
    if (hasCookie(COOKIE_NAME)) {
      tracked.current = true
      return
    }

    tracked.current = true
    const visitorId = getOrCreateVisitorId()

    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, visitorId }),
    }).catch(() => { /* silencieux */ })
  }, [searchParams])

  return null
}
