'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackLandingView } from '@/lib/analytics'

export function LandingTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    trackLandingView({
      source: searchParams.get('utm_source') ?? undefined,
      medium: searchParams.get('utm_medium') ?? undefined,
      campaign: searchParams.get('utm_campaign') ?? undefined,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
