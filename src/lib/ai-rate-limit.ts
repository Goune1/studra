import { checkRateLimit } from '@/lib/rate-limit'

const DAILY_AI_LIMIT = 200
const HOURLY_BURST_LIMIT = 30

export async function checkAiRateLimit(
  userId: string,
  scope: string,
): Promise<{ allowed: boolean; reason?: 'daily' | 'burst' }> {
  // Les deux compteurs partent en parallèle : ils étaient séquentiels et
  // ajoutaient un aller-retour DB au chemin critique de chaque génération.
  // `check_rate_limit` incrémente son compteur à chaque appel, donc le burst
  // est désormais aussi incrémenté quand le quota quotidien est déjà dépassé —
  // sans effet pratique, ces requêtes étant rejetées de toute façon.
  const [dailyOk, burstOk] = await Promise.all([
    checkRateLimit(userId, 'ai:daily', DAILY_AI_LIMIT, 86400),
    checkRateLimit(userId, `ai:${scope}`, HOURLY_BURST_LIMIT, 3600),
  ])

  if (!dailyOk) return { allowed: false, reason: 'daily' }
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
