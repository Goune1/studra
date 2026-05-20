import { checkRateLimit } from '@/lib/rate-limit'

const DAILY_AI_LIMIT = 200
const HOURLY_BURST_LIMIT = 30

export async function checkAiRateLimit(
  userId: string,
  scope: string,
): Promise<{ allowed: boolean; reason?: 'daily' | 'burst' }> {
  const dailyOk = await checkRateLimit(userId, 'ai:daily', DAILY_AI_LIMIT, 86400)
  if (!dailyOk) return { allowed: false, reason: 'daily' }

  const burstOk = await checkRateLimit(userId, `ai:${scope}`, HOURLY_BURST_LIMIT, 3600)
  if (!burstOk) return { allowed: false, reason: 'burst' }

  return { allowed: true }
}

export function aiRateLimitResponse(reason?: 'daily' | 'burst') {
  return {
    error: reason === 'daily'
      ? 'Limite quotidienne atteinte (200 appels IA/jour)'
      : 'Trop de requêtes, ralentis un peu',
  }
}
