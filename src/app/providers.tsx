'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { trackSignupSuccess } from '@/lib/analytics'
import { registerPostHogClient, withPostHog } from '@/lib/posthog-client'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    let url = window.origin + pathname
    const search = searchParams.toString()
    if (search) url += `?${search}`

    withPostHog((posthog) => {
      posthog.capture('$pageview', { '$current_url': url })
    })
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

    void import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      return supabase.auth.getUser()
    }).then(({ data: { user } }) => {
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
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    let cancelled = false
    let idleId: number | undefined
    let initializationPromise: Promise<void> | undefined

    const initialize = () => {
      if (cancelled) return Promise.resolve()
      if (initializationPromise) return initializationPromise

      initializationPromise = (async () => {
        const [{ default: posthog }, { createClient }] = await Promise.all([
          import('posthog-js'),
          import('@/lib/supabase/client'),
        ])
        if (cancelled) return

        posthog.init(key, {
          api_host: '/api/events',
          ui_host: 'https://eu.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          capture_exceptions: false,
          disable_session_recording: true,
          disable_surveys: true,
          advanced_disable_flags: true,
          person_profiles: 'identified_only',
        })
        registerPostHogClient(posthog)

        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          posthog.identify(session.user.id, { email: session.user.email })
        }
      })()

      return initializationPromise
    }

    const startOnInteraction = () => {
      void initialize()
      window.removeEventListener('pointerdown', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
    }

    const delayId = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => void initialize(), { timeout: 3000 })
      } else {
        void initialize()
      }
    }, 5000)

    window.addEventListener('pointerdown', startOnInteraction, { once: true, passive: true })
    window.addEventListener('keydown', startOnInteraction, { once: true })

    return () => {
      cancelled = true
      window.clearTimeout(delayId)
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      }
      window.removeEventListener('pointerdown', startOnInteraction)
      window.removeEventListener('keydown', startOnInteraction)
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <Suspense fallback={null}>
        <OAuthSignupTracker />
      </Suspense>
      {children}
    </>
  )
}
