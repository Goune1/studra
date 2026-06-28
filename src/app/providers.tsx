'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackSignupSuccess } from '@/lib/analytics'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      const search = searchParams.toString()
      if (search) url += '?' + search
      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  return null
}

// Le callback OAuth (/auth/callback, route serveur) ne peut pas appeler posthog-js.
// Il signale donc un nouvel inscrit Google via ?signup=oauth sur la page de destination
// (/dashboard ou /upgrade). On consomme ce signal une seule fois ici, on déclenche
// signup_completed + identify(), puis on nettoie l'URL pour éviter tout double comptage
// si la page est rechargée ou partagée.
function OAuthSignupTracker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('signup') !== 'oauth') return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        trackSignupSuccess(user.id, user.email ?? '', 'google')
      }
      const params = new URLSearchParams(searchParams.toString())
      params.delete('signup')
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    })
  }, [searchParams, pathname, router])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/api/events',
      ui_host: 'https://eu.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        try {
          posthog.identify(session.user.id, { email: session.user.email })
        } catch {}
      }
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <Suspense fallback={null}>
        <OAuthSignupTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}
