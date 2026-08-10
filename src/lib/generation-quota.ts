import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const FREE_GENERATIONS_QUOTA = 5

export const QUOTA_EXCEEDED_ERROR =
  'Limite mensuelle atteinte. Passez en Pro pour des générations illimitées.'

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

export interface ConsumedCredit {
  allowed: boolean
  used: number
  isPro: boolean
}

type RpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{data: unknown; error: {message: string} | null}>
}

function rpc(): RpcClient {
  return getSupabaseAdmin() as unknown as RpcClient
}

/**
 * Atomically reserves one generation credit.
 *
 * Reset, quota check and increment happen in a single locked statement, so
 * concurrent requests (the "generate also" panel fires one per content type)
 * each consume their own credit instead of all overwriting the same value.
 */
export async function consumeGenerationCredit(userId: string): Promise<ConsumedCredit> {
  const {data, error} = await rpc().rpc('consume_generation_credit', {
    p_user_id: userId,
    p_free_quota: FREE_GENERATIONS_QUOTA,
  })

  if (error) {
    // Fail closed: a broken quota check must not hand out free generations.
    console.error('[generation-quota] consume failed:', error.message)
    return {allowed: false, used: 0, isPro: false}
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | {allowed?: boolean; used?: number; is_pro?: boolean}
    | null

  return {
    allowed: row?.allowed === true,
    used: row?.used ?? 0,
    isPro: row?.is_pro === true,
  }
}

/** Gives the credit back when a generation fails after being charged. */
export async function refundGenerationCredit(userId: string): Promise<void> {
  const {error} = await rpc().rpc('refund_generation_credit', {p_user_id: userId})
  if (error) console.error('[generation-quota] refund failed:', error.message)
}
