import { createClient } from '@/lib/supabase/server'

export const FREE_GENERATIONS_QUOTA = 5

export interface GenerationQuota {
  isPro: boolean
  used: number
  quota: number
  /** Generations left this month. `null` when the plan has no cap (pro). */
  remaining: number | null
}

export async function getGenerationQuota(): Promise<GenerationQuota | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_used_this_month')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro'
  const used = profile?.generations_used_this_month ?? 0

  return {
    isPro,
    used,
    quota: FREE_GENERATIONS_QUOTA,
    remaining: isPro ? null : Math.max(0, FREE_GENERATIONS_QUOTA - used),
  }
}
