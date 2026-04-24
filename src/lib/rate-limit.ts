import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

function getAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return adminClient
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const client = getAdmin() as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }
  const { data, error } = await client.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  // Fail-open : si la DB est down on n'empêche pas le service,
  // mais on log pour alerte.
  if (error) {
    console.error('[rate-limit] check failed:', error.message)
    return true
  }

  return data === true
}
