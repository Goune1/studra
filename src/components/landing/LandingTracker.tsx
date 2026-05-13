'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackLandingView } from '@/lib/analytics'

export function LandingTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const utmSource = searchParams.get('utm_source') ?? undefined
    trackLandingView(utmSource)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
