import { createClient } from '@/lib/supabase/server'
import type { StudyPlan, StudyPlanTask, StudyPlanTaskType } from '@/types'

export type ToolType = 'flashcards' | 'fiche' | 'schema' | 'frise' | 'examen'

export interface DueDeck {
  deckId: string
  title: string
  dueCount: number
}

export interface TodayTask {
  id: string
  kind: 'review' | 'planning'
  title: string
  subtitle: string
  durationMin: number
  href: string
  taskType?: StudyPlanTaskType
}

export interface UpcomingExam {
  planId: string
  title: string
  examDate: string
  daysLeft: number
  progress: number
}

export interface RecentItem {
  id: string
  title: string
  type: ToolType
  createdAt: string
  href: string
}

export interface DashboardUser {
  id: string
  name: string
  plan: 'free' | 'pro'
  generationsUsed: number
  generationsQuota: number
}

export interface WeekStats {
  retentionRate: number | null
  totalReviews: number
  streakDays: number
  heatmap: { date: string; count: number }[]
  examScoreAvg: number | null
}

export interface DashboardData {
  user: DashboardUser
  dueCards: number
  dueDecks: DueDeck[]
  reviewEstimateMin: number
  todayTasks: TodayTask[]
  week: WeekStats
  upcomingExams: UpcomingExam[]
  recentItems: RecentItem[]
}

const TASK_TYPE_LABEL: Record<StudyPlanTaskType, string> = {
  flashcards: 'Flashcards',
  fiche: 'Fiche',
  exam: 'Examen blanc',
  review: 'Révision',
  general_review: 'Révision générale',
}

function sessionTargetHref(task: StudyPlanTask): string {
  const primary = task.content_refs?.[0]
  switch (task.task_type) {
    case 'flashcards':
      return primary?.type === 'deck' ? `/flashcards/${primary.id}/study` : `/planning/${task.plan_id}`
    case 'fiche':
      return primary?.type === 'fiche' ? `/fiches/${primary.id}` : `/planning/${task.plan_id}`
    case 'review':
    case 'general_review':
      if (!primary) return `/planning/${task.plan_id}`
      return primary.type === 'deck' ? `/flashcards/${primary.id}/study` : `/fiches/${primary.id}`
    case 'exam':
      return '/exams/new'
  }
}

function computeStreak(reviewDates: string[]): number {
  if (reviewDates.length === 0) return 0
  const daySet = new Set(reviewDates.map((d) => d.slice(0, 10)))
  let streak = 0
  const cursor = new Date()
  const today = cursor.toISOString().slice(0, 10)
  if (!daySet.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function buildHeatmap(reviewDates: string[], days = 30): { date: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const d of reviewDates) {
    const key = d.slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const out: { date: string; count: number }[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor.getTime() - i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return out
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const now = new Date()
  const nowIso = now.toISOString()
  const today = nowIso.slice(0, 10)
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  const [
    profileRes,
    dueFlashcardsRes,
    decksRes,
    todayPlanningRes,
    activePlansRes,
    reviewsRes,
    examSessionsRes,
    recentDecksRes,
    recentFichesRes,
    recentSchemasRes,
    recentTimelinesRes,
    recentExamsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),

    supabase
      .from('flashcards')
      .select('id, deck_id, fsrs_due')
      .or(`fsrs_due.is.null,fsrs_due.lte.${nowIso}`),

    supabase.from('decks').select('id, title').eq('user_id', user.id),

    supabase
      .from('study_plan_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .not('status', 'in', '(completed,skipped)')
      .order('session_position'),

    supabase
      .from('study_plans')
      .select('id, title, exam_date, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('exam_date', { ascending: true }),

    supabase
      .from('flashcard_reviews')
      .select('created_at, rating')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgoIso)
      .order('created_at', { ascending: false }),

    supabase
      .from('exam_sessions')
      .select('score, total_questions, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10),

    supabase.from('decks').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('fiches').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('schemas').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('timelines').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('exams').select('id, title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
  ])

  const profile = profileRes.data

  // ── Due cards aggregation ────────────────────────────────────────────────
  const dueRows = dueFlashcardsRes.data ?? []
  const deckTitleMap = new Map<string, string>(
    (decksRes.data ?? []).map((d) => [d.id, d.title]),
  )
  const dueByDeck = new Map<string, number>()
  for (const row of dueRows) {
    if (!deckTitleMap.has(row.deck_id)) continue
    dueByDeck.set(row.deck_id, (dueByDeck.get(row.deck_id) ?? 0) + 1)
  }
  const dueDecks: DueDeck[] = Array.from(dueByDeck.entries())
    .map(([deckId, count]) => ({
      deckId,
      title: deckTitleMap.get(deckId)!,
      dueCount: count,
    }))
    .sort((a, b) => b.dueCount - a.dueCount)
  const dueCards = dueDecks.reduce((s, d) => s + d.dueCount, 0)
  const reviewEstimateMin = Math.max(1, Math.round(dueCards * 0.5))

  // ── Today's tasks: FSRS due + planning sessions ──────────────────────────
  const plansMap = new Map<string, Pick<StudyPlan, 'id' | 'title' | 'exam_date'>>()
  for (const p of activePlansRes.data ?? []) {
    plansMap.set(p.id, p as Pick<StudyPlan, 'id' | 'title' | 'exam_date'>)
  }

  const todayTasks: TodayTask[] = []

  if (dueDecks.length > 0) {
    const firstDeck = dueDecks[0]
    const deckLabel = dueDecks.length === 1
      ? firstDeck.title
      : `${dueDecks.length} decks`
    todayTasks.push({
      id: 'due-cards',
      kind: 'review',
      title: `${dueCards} carte${dueCards > 1 ? 's' : ''} à réviser`,
      subtitle: deckLabel,
      durationMin: reviewEstimateMin,
      href: dueDecks.length === 1
        ? `/flashcards/${firstDeck.deckId}/study`
        : '/flashcards',
    })
  }

  const planningTasks = (todayPlanningRes.data ?? []) as StudyPlanTask[]
  for (const t of planningTasks) {
    if (!plansMap.has(t.plan_id)) continue
    const plan = plansMap.get(t.plan_id)!
    todayTasks.push({
      id: t.id,
      kind: 'planning',
      title: t.content_title,
      subtitle: `${TASK_TYPE_LABEL[t.task_type]} · ${plan.title}`,
      durationMin: t.duration_minutes,
      href: sessionTargetHref(t),
      taskType: t.task_type,
    })
  }

  // ── Week progress ────────────────────────────────────────────────────────
  const reviews = reviewsRes.data ?? []
  const examSessions = examSessionsRes.data ?? []
  const totalReviews = reviews.length
  const successReviews = reviews.filter((r) => (r.rating ?? 1) >= 2).length
  const retentionRate = totalReviews > 0
    ? Math.round((successReviews / totalReviews) * 100)
    : null
  const streakDays = computeStreak([
    ...reviews.map((r) => r.created_at),
    ...examSessions.map((e) => e.completed_at),
  ])
  const heatmap = buildHeatmap(reviews.map((r) => r.created_at))

  const examScoreAvg = examSessions.length > 0
    ? Math.round(
        examSessions.reduce((s, e) => s + e.score, 0) / examSessions.length,
      )
    : null

  // ── Upcoming exams ───────────────────────────────────────────────────────
  const upcomingExams: UpcomingExam[] = (activePlansRes.data ?? []).map((p) => {
    const exam = new Date(p.exam_date)
    const daysLeft = Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / 86_400_000))
    const created = new Date(p.created_at)
    const totalDays = Math.max(1, Math.ceil((exam.getTime() - created.getTime()) / 86_400_000))
    const elapsed = Math.max(0, totalDays - daysLeft)
    const progress = Math.min(100, Math.round((elapsed / totalDays) * 100))
    return {
      planId: p.id,
      title: p.title,
      examDate: p.exam_date,
      daysLeft,
      progress,
    }
  })

  // ── Recent items (all types) ─────────────────────────────────────────────
  const recentItems: RecentItem[] = [
    ...(recentDecksRes.data ?? []).map((d): RecentItem => ({
      id: d.id, title: d.title, type: 'flashcards',
      createdAt: d.created_at, href: `/flashcards/${d.id}`,
    })),
    ...(recentFichesRes.data ?? []).map((f): RecentItem => ({
      id: f.id, title: f.title, type: 'fiche',
      createdAt: f.created_at, href: `/fiches/${f.id}`,
    })),
    ...(recentSchemasRes.data ?? []).map((s): RecentItem => ({
      id: s.id, title: s.title, type: 'schema',
      createdAt: s.created_at, href: `/schemas/${s.id}`,
    })),
    ...(recentTimelinesRes.data ?? []).map((t): RecentItem => ({
      id: t.id, title: t.title, type: 'frise',
      createdAt: t.created_at, href: `/timelines/${t.id}`,
    })),
    ...(recentExamsRes.data ?? []).map((e): RecentItem => ({
      id: e.id, title: e.title, type: 'examen',
      createdAt: e.created_at, href: `/exams/${e.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const isPro = profile?.plan === 'pro'

  return {
    user: {
      id: user.id,
      name: profile?.full_name?.split(' ')[0] ?? 'là',
      plan: isPro ? 'pro' : 'free',
      generationsUsed: profile?.generations_used_this_month ?? 0,
      generationsQuota: 5,
    },
    dueCards,
    dueDecks,
    reviewEstimateMin,
    todayTasks,
    week: {
      retentionRate,
      totalReviews,
      streakDays,
      heatmap,
      examScoreAvg,
    },
    upcomingExams,
    recentItems,
  }
}
