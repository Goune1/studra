'use client'

import { useEffect } from 'react'
import { trackTageMageResultsViewed } from '@/lib/analytics'

export function ResultsTracker() {
  useEffect(() => { trackTageMageResultsViewed() }, [])
  return null
}
