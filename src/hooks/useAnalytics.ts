'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as analytics from '@/lib/analytics'

export function useAnalytics() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id && user?.email) {
        analytics.identifyUser(user.id, user.email)
      }
    })
  }, [])

  return analytics
}
