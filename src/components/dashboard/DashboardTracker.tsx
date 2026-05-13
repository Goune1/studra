'use client'

import { useEffect } from 'react'
import { trackDashboardView } from '@/lib/analytics'

export function DashboardTracker() {
  useEffect(() => {
    trackDashboardView()
  }, [])

  return null
}
