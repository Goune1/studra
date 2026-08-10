import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import type { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('plan').eq('id', user.id).single()
    : { data: null }

  const isPro = profile?.plan === 'pro'
  const userName = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Utilisateur'
  const userEmail = user?.email ?? ''
  const userAvatar = (user?.user_metadata?.avatar_url as string | null) ?? null

  return (
    <DashboardShell isPro={isPro} userName={userName} userEmail={userEmail} userAvatar={userAvatar}>
      {children}
    </DashboardShell>
  )
}
