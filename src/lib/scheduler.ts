import type { StudyPlanLLMOutput, StudyPlanOrderedItem } from '@/lib/openai'
import type {
  StudyPlanTask,
  StudyPlanTaskType,
  StudyPlanContentRef,
} from '@/types'

interface ScheduleInput {
  planId: string
  userId: string
  llmOutput: StudyPlanLLMOutput
  examDate: string // YYYY-MM-DD
  availableMinutesPerDay: number
  startDate?: string // YYYY-MM-DD, défaut = aujourd'hui
}

type TaskInsert = Omit<
  StudyPlanTask,
  'id' | 'created_at' | 'updated_at' | 'started_at'
>

// ── Durées par type ─────────────────────────────────────────────────
const DUR_REVIEW = 15
const DUR_GENERAL_REVIEW = 15
const DUR_EXAM = 30

// ── Gaps SR (jours après la 1re session) selon priorité ────────────
const REVIEW_GAPS: Record<StudyPlanOrderedItem['priority'], number[]> = {
  high: [2, 5, 12],
  medium: [3, 8],
  low: [5],
}

/**
 * Construit le planning sous forme de sessions (stockées dans study_plan_tasks).
 *
 * Priorité LLM respectée : les items "high" sont placés en premier dans la
 * fenêtre disponible, puis "medium", puis "low". Chaque item reçoit une
 * session d'apprentissage initiale + des rappels espacés (répétition espacée).
 * Spill-over : si le budget d'un jour est plein, la session essaie de
 * s'insérer dans le jour suivant (jusqu'à +2 j). Un examen blanc est inséré
 * à J-2 s'il y a la place, et un "general_review" le jour J-0 reprend les
 * items "high".
 */
export function buildSchedule(input: ScheduleInput): TaskInsert[] {
  const {
    planId,
    userId,
    llmOutput,
    examDate,
    availableMinutesPerDay,
    startDate,
  } = input

  const start = parseDate(startDate ?? todayStr())
  const exam = parseDate(examDate)
  const totalDays = daysBetween(start, exam)
  if (totalDays < 1) return []

  const dayBudget: number[] = Array(totalDays).fill(availableMinutesPerDay)
  const tasks: Array<TaskInsert & { _day: number }> = []

  const ordered = [...llmOutput.ordered_content].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  )

  // ── 1. Placer chaque item selon sa priorité ────────────────────────
  const highCount = ordered.filter((o) => o.priority === 'high').length
  const mediumCount = ordered.filter((o) => o.priority === 'medium').length
  const learnWindowEnd = Math.max(1, totalDays - 2) // laisser J-1 et J-0 pour révision/examen

  ordered.forEach((item, idx) => {
    const targetDay = pickInitialDay(item, idx, {
      highCount,
      mediumCount,
      totalItems: ordered.length,
      windowEnd: learnWindowEnd,
    })

    const contentRef: StudyPlanContentRef = {
      id: item.id,
      title: item.title,
      type: item.type,
    }

    // 1a. Session initiale
    const placed = placeSession(
      dayBudget,
      targetDay,
      item.initial_duration_minutes,
      2,
    )
    if (placed >= 0) {
      tasks.push({
        _day: placed,
        plan_id: planId,
        user_id: userId,
        scheduled_date: addDays(start, placed),
        task_type: item.type === 'deck' ? 'flashcards' : 'fiche',
        content_ref: item.id,
        content_refs: [contentRef],
        content_title: item.title,
        duration_minutes: item.initial_duration_minutes,
        session_position: 0,
        rationale: item.rationale || null,
        status: 'pending',
        completed_at: null,
      })
    }

    // 1b. Rappels espacés
    const gaps = REVIEW_GAPS[item.priority]
    const limitedGaps = gaps.slice(0, Math.max(0, item.sessions_needed - 1))
    const initialDay = placed >= 0 ? placed : targetDay
    limitedGaps.forEach((gap) => {
      const reviewDay = initialDay + gap
      if (reviewDay >= totalDays - 1) return // laisser le dernier jour pour general_review
      const placedReview = placeSession(dayBudget, reviewDay, DUR_REVIEW, 2)
      if (placedReview < 0) return
      tasks.push({
        _day: placedReview,
        plan_id: planId,
        user_id: userId,
        scheduled_date: addDays(start, placedReview),
        task_type: 'review',
        content_ref: item.id,
        content_refs: [contentRef],
        content_title: `Révision — ${item.title}`,
        duration_minutes: DUR_REVIEW,
        session_position: 0,
        rationale: null,
        status: 'pending',
        completed_at: null,
      })
    })
  })

  // ── 2. Examen blanc à J-2 (si possible) ───────────────────────────
  if (totalDays >= 4) {
    const examDay = totalDays - 2
    const highItems = ordered.filter((o) => o.priority === 'high').slice(0, 5)
    const refs: StudyPlanContentRef[] =
      highItems.length > 0
        ? highItems.map((i) => ({ id: i.id, title: i.title, type: i.type }))
        : ordered.slice(0, 3).map((i) => ({ id: i.id, title: i.title, type: i.type }))
    const placedExam = placeSession(dayBudget, examDay, DUR_EXAM, 1)
    if (placedExam >= 0 && refs.length > 0) {
      tasks.push({
        _day: placedExam,
        plan_id: planId,
        user_id: userId,
        scheduled_date: addDays(start, placedExam),
        task_type: 'exam',
        content_ref: null,
        content_refs: refs,
        content_title: 'Examen blanc',
        duration_minutes: DUR_EXAM,
        session_position: 0,
        rationale:
          'Simule les conditions du jour J pour consolider la mémoire de récupération.',
        status: 'pending',
        completed_at: null,
      })
    }
  }

  // ── 3. Révision générale le dernier jour disponible (J-0) ────────
  const lastDay = totalDays - 1
  const topHighs = ordered.filter((o) => o.priority === 'high').slice(0, 4)
  topHighs.forEach((item) => {
    const placed = placeSession(dayBudget, lastDay, DUR_GENERAL_REVIEW, 0)
    if (placed < 0) return
    tasks.push({
      _day: placed,
      plan_id: planId,
      user_id: userId,
      scheduled_date: addDays(start, placed),
      task_type: 'general_review',
      content_ref: item.id,
      content_refs: [{ id: item.id, title: item.title, type: item.type }],
      content_title: `Révision générale — ${item.title}`,
      duration_minutes: DUR_GENERAL_REVIEW,
      session_position: 0,
      rationale: null,
      status: 'pending',
      completed_at: null,
    })
  })

  // ── 4. Tri final + numérotation session_position par jour ─────────
  tasks.sort((a, b) => {
    if (a._day !== b._day) return a._day - b._day
    return typeWeight(a.task_type) - typeWeight(b.task_type)
  })

  let currentDay = -1
  let positionInDay = 0
  const finalized: TaskInsert[] = []
  for (const t of tasks) {
    if (t._day !== currentDay) {
      currentDay = t._day
      positionInDay = 0
    }
    const { _day: _discard, ...rest } = t
    void _discard
    finalized.push({ ...rest, session_position: positionInDay++ })
  }
  return finalized
}

// ── Helpers ─────────────────────────────────────────────────────────

function priorityRank(p: StudyPlanOrderedItem['priority']): number {
  return p === 'high' ? 0 : p === 'medium' ? 1 : 2
}

function typeWeight(t: StudyPlanTaskType): number {
  switch (t) {
    case 'flashcards':
    case 'fiche':
      return 0
    case 'review':
      return 1
    case 'exam':
      return 2
    case 'general_review':
      return 3
  }
}

/**
 * Choisit le jour initial d'apprentissage pour un item selon sa priorité
 * et sa position dans la liste triée. Les "high" sont répartis sur le premier
 * tiers de la fenêtre, "medium" sur le deuxième, "low" sur le dernier tiers.
 */
function pickInitialDay(
  item: StudyPlanOrderedItem,
  idx: number,
  ctx: { highCount: number; mediumCount: number; totalItems: number; windowEnd: number },
): number {
  const { windowEnd } = ctx
  const third = Math.max(1, Math.floor(windowEnd / 3))
  if (item.priority === 'high') {
    const slot = ctx.highCount > 0 ? (idx / ctx.highCount) * third : 0
    return Math.min(windowEnd - 1, Math.floor(slot))
  }
  if (item.priority === 'medium') {
    const mIdx = idx - ctx.highCount
    const slot = ctx.mediumCount > 0 ? (mIdx / ctx.mediumCount) * third : 0
    return Math.min(windowEnd - 1, third + Math.floor(slot))
  }
  const lowIdx = idx - ctx.highCount - ctx.mediumCount
  const lowCount = Math.max(1, ctx.totalItems - ctx.highCount - ctx.mediumCount)
  const slot = (lowIdx / lowCount) * third
  return Math.min(windowEnd - 1, 2 * third + Math.floor(slot))
}

/**
 * Essaye de placer une session de `duration` min au jour `day`. Si le budget
 * est plein, tente jusqu'à `maxShift` jours suivants. Renvoie l'index du jour
 * retenu, ou -1 si impossible.
 */
function placeSession(
  dayBudget: number[],
  day: number,
  duration: number,
  maxShift: number,
): number {
  for (let shift = 0; shift <= maxShift; shift++) {
    const d = day + shift
    if (d < 0 || d >= dayBudget.length) continue
    if (dayBudget[d] >= duration) {
      dayBudget[d] -= duration
      return d
    }
  }
  // Dernière chance : forcer le dernier jour atteignable (budget négatif toléré)
  const fallback = Math.min(dayBudget.length - 1, day + maxShift)
  if (fallback >= 0 && fallback < dayBudget.length) {
    dayBudget[fallback] -= duration
    return fallback
  }
  return -1
}

// ── Date utils ──────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date: Date, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}
