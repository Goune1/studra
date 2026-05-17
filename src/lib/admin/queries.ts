import { createClient } from '@supabase/supabase-js'
import type { AdminUser, RecentGeneration, StripeStatus } from './mock-data'

// Service-role client — bypasses RLS, NEVER expose to client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type ContentRow = { user_id: string; created_at: string }
type ExamRow    = ContentRow & { language: string }

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const supabase = getAdminClient()

  // Fetch everything in parallel
  const [
    profilesRes,
    authUsersRes,
    decksRes,
    fichesRes,
    schemasRes,
    timelinesRes,
    examsRes,
    feynmanRes,
    recallRes,
    annalesRes,
    planningRes,
    socrateRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, plan, stripe_customer_id, stripe_subscription_id, generations_used_this_month, created_at')
      .order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('decks')                  .select('user_id, created_at'),
    supabase.from('fiches')                 .select('user_id, created_at'),
    supabase.from('schemas')                .select('user_id, created_at'),
    supabase.from('timelines')              .select('user_id, created_at'),
    supabase.from('exams')                  .select('user_id, created_at, language'),
    supabase.from('feynman_sessions')       .select('user_id, created_at'),
    supabase.from('free_recall_sessions')   .select('user_id, created_at').not('evaluation', 'is', null),
    supabase.from('generated_past_exams')   .select('user_id, created_at'),
    supabase.from('study_plans')            .select('user_id, created_at'),
    supabase.from('socrate_sessions')       .select('user_id, created_at'),
  ])

  if (profilesRes.error) throw new Error(`profiles: ${profilesRes.error.message}`)

  const profiles   = profilesRes.data   ?? []
  const authUsers  = authUsersRes.data?.users ?? []
  const decks      = (decksRes.data      ?? []) as ContentRow[]
  const fiches     = (fichesRes.data     ?? []) as ContentRow[]
  const schemas    = (schemasRes.data    ?? []) as ContentRow[]
  const timelines  = (timelinesRes.data  ?? []) as ContentRow[]
  const exams      = (examsRes.data      ?? []) as ExamRow[]
  const feynmans   = (feynmanRes.data    ?? []) as ContentRow[]
  const recalls    = (recallRes.data     ?? []) as ContentRow[]
  const annales    = (annalesRes.data    ?? []) as ContentRow[]
  const plannings  = (planningRes.data   ?? []) as ContentRow[]
  const socrates   = (socrateRes.data    ?? []) as ContentRow[]

  // last_sign_in_at per user id
  const lastLoginMap = new Map<string, string>()
  for (const u of authUsers) {
    if (u.last_sign_in_at) lastLoginMap.set(u.id, u.last_sign_in_at)
  }

  // Merge all content rows for recent-generation lookup
  const allContent: RecentGeneration[] = [
    ...decks     .map(r => ({ type: 'flashcards' as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...fiches    .map(r => ({ type: 'fiche'      as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...schemas   .map(r => ({ type: 'schema'     as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...timelines .map(r => ({ type: 'frise'      as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...exams     .map(r => ({ type: 'examen'     as const, date: r.created_at, userId: r.user_id, lang: (r as ExamRow).language ?? 'fr' })),
    ...feynmans  .map(r => ({ type: 'feynman'    as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...recalls   .map(r => ({ type: 'rappel'     as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...annales   .map(r => ({ type: 'annale'     as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...plannings .map(r => ({ type: 'planning'   as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
    ...socrates  .map(r => ({ type: 'socrate'    as const, date: r.created_at, userId: r.user_id, lang: 'fr' })),
  ] as (RecentGeneration & { userId: string })[]

  return profiles.map(profile => {
    const hasSub      = !!profile.stripe_subscription_id
    const hasCus      = !!profile.stripe_customer_id
    let stripeStatus: StripeStatus = 'none'
    if (profile.plan === 'pro' && hasSub)  stripeStatus = 'active'
    else if (hasCus && !hasSub)            stripeStatus = 'canceled'

    const userId = profile.id

    const recentGenerations = (allContent as (RecentGeneration & { userId: string })[])
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(({ type, date, lang }) => ({ type, date, lang }))

    return {
      id:                userId,
      name:              profile.full_name ?? profile.email.split('@')[0],
      email:             profile.email,
      plan:              profile.plan as 'free' | 'pro',
      stripeStatus,
      stripeCustomerId:  profile.stripe_customer_id  ?? null,
      generationsUsed:   profile.generations_used_this_month,
      generationsQuota:  profile.plan === 'pro' ? null : 5,
      createdAt:         profile.created_at,
      lastLoginAt:       lastLoginMap.get(userId) ?? null,
      recentGenerations,
      contentCounts: {
        decks:   decks    .filter(r => r.user_id === userId).length,
        fiches:  fiches   .filter(r => r.user_id === userId).length,
        schemas: schemas  .filter(r => r.user_id === userId).length,
        frises:  timelines.filter(r => r.user_id === userId).length,
      },
      stripeStartDate:   null,
      stripeNextRenewal: null,
      stripeCancelDate:  null,
    } satisfies AdminUser
  })
}
