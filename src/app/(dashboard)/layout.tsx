import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('plan').eq('id', user.id).single()
    : { data: null }

  const isPro = profile?.plan === 'pro'

  return <DashboardShell isPro={isPro}>{children}</DashboardShell>
}
