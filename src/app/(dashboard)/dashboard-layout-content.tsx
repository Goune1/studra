import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'
import { PLAN_SELECT, resolvePlan } from '@/lib/plan'

export async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select(PLAN_SELECT).eq('id', user.id).single()
    : { data: null }

  const { isPro } = resolvePlan(profile)
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
