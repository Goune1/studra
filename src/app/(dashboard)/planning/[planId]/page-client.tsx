'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowsClockwise,
  CalendarDots,
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  DotsThree,
  FastForward,
  PencilSimple,
  Play,
  Trash,
  Warning,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { StudyPlan, StudyPlanTask, StudyPlanTaskType } from '@/types'
import sharedStyles from '../../flashcards/flashcards.module.css'
import styles from '../planning.module.css'

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────
const COLOR = '#1F4D3F'
const DANGER = '#EF4444'
const SUCCESS = '#10B981'

const TASK_TYPE_COLORS: Record<StudyPlanTaskType, string> = {
  flashcards: COLOR,
  fiche: COLOR,
  exam: COLOR,
  review: COLOR,
  general_review: COLOR,
}
const TASK_TYPE_LABELS: Record<StudyPlanTaskType, string> = {
  flashcards: 'Flashcards',
  fiche: 'Fiche',
  exam: 'Examen blanc',
  review: 'Révision',
  general_review: 'Révision générale',
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function PlanningViewPage({
  initialPlan,
  initialSessions,
}: {
  initialPlan: StudyPlan
  initialSessions: StudyPlanTask[]
}) {
  const format = ({number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('fr-FR', options).format(value), dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', options).format(new Date(value)), relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => new Intl.RelativeTimeFormat('fr-FR', {numeric: 'auto'}).format(value, unit)})
  const router = useRouter()
  const planId = initialPlan.id

  const [plan, setPlan] = useState<StudyPlan | null>(initialPlan)
  const [sessions, setSessions] = useState<StudyPlanTask[]>(initialSessions)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [nowMs] = useState(() => Date.now())

  const load = useCallback(async () => {
    const supabase = createClient()
    const [planRes, sessionsRes] = await Promise.all([
      supabase.from('study_plans').select('*').eq('id', planId).single(),
      supabase
        .from('study_plan_tasks')
        .select('*')
        .eq('plan_id', planId)
        .order('scheduled_date')
        .order('session_position')
        .order('created_at'),
    ])
    if (!planRes.data) { router.push('/planning'); return }
    setPlan(planRes.data as StudyPlan)
    setSessions((sessionsRes.data ?? []) as StudyPlanTask[])
  }, [planId, router])

  // ── Actions ────────────────────────────────────────────────────────
  const mutateSession = useCallback(
    async (sessionId: string, action: 'start' | 'complete' | 'postpone' | 'skip' | 'reset') => {
      const res = await fetch(`/api/study-plans/${planId}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? "Une erreur est survenue")
        return null
      }
      await load()
      return json.session as StudyPlanTask
    },
    [planId, load],
  )

  const handleRegenerate = async () => {
    if (!confirm("Régénérer le planning ? Les sessions non terminées seront réécrites.")) return
    setRegenerating(true)
    const res = await fetch(`/api/study-plans/${planId}/regenerate`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? "Erreur de régénération")
      setRegenerating(false)
      return
    }
    toast.success(`Planning régénéré (${json.taskCount} ${json.taskCount === 1 ? "session" : "sessions"})`)
    await load()
    setRegenerating(false)
  }

  const handleDelete = async () => {
    if (!confirm("Supprimer ce planning ? Cette action est irréversible.")) return
    const res = await fetch(`/api/study-plans/${planId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success("Planning supprimé")
      router.push('/planning')
    } else {
      toast.error("Erreur lors de la suppression")
    }
  }

  // ── Derived state ──────────────────────────────────────────────────
  const today = todayIsoDate()

  const {
    todaySessions,
    upcomingSessions,
    overdueSessions,
    futureSessions,
    historySessions,
  } = useMemo(() => {
    const todayS: StudyPlanTask[] = []
    const upcoming: StudyPlanTask[] = []
    const overdue: StudyPlanTask[] = []
    const future: StudyPlanTask[] = []
    const history: StudyPlanTask[] = []
    for (const s of sessions) {
      const isDone = s.status === 'completed' || s.status === 'skipped'
      if (isDone) { history.push(s); continue }
      if (s.scheduled_date < today) { overdue.push(s); continue }
      if (s.scheduled_date === today) { todayS.push(s); continue }
      future.push(s)
    }
    // Upcoming = next 7 days worth of future sessions
    for (const s of future) {
      if (daysBetween(today, s.scheduled_date) <= 7) upcoming.push(s)
    }
    // Historique = completed + skipped + past
    return {
      todaySessions: todayS,
      upcomingSessions: upcoming,
      overdueSessions: overdue,
      futureSessions: future,
      historySessions: history,
    }
  }, [sessions, today])

  const calendarDays = useMemo(() => groupByDay(futureSessions), [futureSessions])

  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const skippedCount = sessions.filter((s) => s.status === 'skipped').length
  const totalCount = sessions.length
  const doneCount = completedCount + skippedCount
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const daysUntilExam = plan
    ? Math.max(0, Math.round((new Date(plan.exam_date + 'T00:00:00').getTime() - nowMs) / 86_400_000))
    : 0

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm" style={{ color: 'var(--ink-500)' }}>{"Chargement…"}</div>
      </div>
    )
  }

  const isCompletedPlan = plan.status === 'completed'

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className={styles.planningPage}>
      <Link href="/planning" className={sharedStyles.backLink}>
        <ArrowLeft size={14} /> Mes plannings
      </Link>

      <section className={sharedStyles.deckHeaderCard}>
        <div className={sharedStyles.deckHeaderMain}>
          <div className={sharedStyles.deckIdentity}>
            <p>
              Examen le {format.dateTime(new Date(`${plan.exam_date}T00:00:00`), { weekday: 'long', day: 'numeric', month: 'long' })} · {plan.available_minutes_per_day} min/jour
            </p>
            <h1>{plan.title}</h1>
            <span>{isCompletedPlan ? 'Planning terminé' : `J-${daysUntilExam} avant l’examen`}</span>
          </div>
          <div className={sharedStyles.deckActions}>
            <PlanMenu
              onEdit={() => setEditing(true)}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
              regenerating={regenerating}
            />
          </div>
        </div>
        <div className={sharedStyles.deckHeaderNote}>
          <span>{completedCount}/{totalCount} sessions terminées</span>
          <span>{plan.strategy_notes || 'Suis les sessions dans l’ordre et adapte le planning en cas de retard.'}</span>
        </div>
      </section>

      {/* Progress */}
      <div
        className="rounded-[11px] p-5 mb-5"
        style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {isCompletedPlan ? "Planning terminé" : "Progression"}
          </span>
          <span className="text-sm font-bold" style={{ color: COLOR }}>
            {`${completedCount}/${totalCount} sessions`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: '#fcfcfb' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: COLOR }}
          />
        </div>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ink-500)' }}>
          <span>
            {`${progress}% complété`}{skippedCount > 0 ? ` · ${`${skippedCount} session${skippedCount === 1 ? "" : "s"} sautée${skippedCount === 1 ? "" : "s"}`}` : ''}
          </span>
          <span style={{ color: daysUntilExam <= 3 ? DANGER : 'var(--ink-500)' }}>
            J-{daysUntilExam}
          </span>
        </div>
        {plan.strategy_notes && (
          <p className="text-xs mt-3 pt-3 border-t italic" style={{ color: 'var(--ink-700)', borderColor: 'var(--ink-200)' }}>
            « {plan.strategy_notes} »
          </p>
        )}
      </div>

      {/* Overdue banner */}
      {overdueSessions.length > 0 && (
        <div
          className="rounded-[11px] p-4 mb-5 flex items-start gap-3"
          style={{ background: DANGER + '10', border: `1px solid ${DANGER}30` }}
        >
          <Warning size={18} style={{ color: DANGER }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {overdueSessions.length} session{overdueSessions.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-700)' }}>
              {"Reporte-les ou régénère le planning pour les recompacter."}
            </p>
            <div className="space-y-1.5 mt-3">
              {overdueSessions.slice(0, 3).map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  compact
                  onAction={mutateSession}
                  overdue
                />
              ))}
              {overdueSessions.length > 3 && (
                <p className="text-xs mt-1" style={{ color: 'var(--ink-500)' }}>
                  + {overdueSessions.length - 3} autres
                </p>
              )}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="mt-3 text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              style={{ background: DANGER + '20', color: DANGER }}
            >
              <ArrowsClockwise size={12} className={regenerating ? 'animate-spin' : ''} />
              {"Recompacter le planning"}
            </button>
          </div>
        </div>
      )}

      {/* Today */}
      {todaySessions.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: COLOR }}>
              {"Aujourd’hui"}
            </h2>
            <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
              {todaySessions.filter((s) => s.status === 'completed').length}/{todaySessions.length}
            </span>
          </div>
          <div className="space-y-3">
            {todaySessions.map((s, i) => (
              <TodaySessionCard
                key={s.id}
                session={s}
                primary={i === 0 && s.status !== 'completed'}
                onAction={mutateSession}
              />
            ))}
          </div>
        </section>
      )}

      {todaySessions.length === 0 && !isCompletedPlan && (
        <div
          className="rounded-[11px] p-6 mb-6 text-center"
          style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
        >
          <CheckCircle size={24} className="mx-auto mb-2" style={{ color: SUCCESS }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {"Rien à faire aujourd’hui"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {"Profites-en pour réviser à ton rythme."}
          </p>
        </div>
      )}

      {/* Upcoming (next 7 days) */}
      {upcomingSessions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-700)' }}>
            {"Prochaines sessions"}
          </h2>
          <div className="space-y-1.5">
            {upcomingSessions.slice(0, 5).map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                showDate
                onAction={mutateSession}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full calendar (future, grouped by day) */}
      {calendarDays.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-700)' }}>
            {"Calendrier complet"}
          </h2>
          <div className="space-y-2">
            {calendarDays.map(({ date, tasks }) => {
              const collapsed = collapsedDays.has(date)
              const dayMinutes = tasks.reduce((sum, t) => sum + t.duration_minutes, 0)
              const dayCompleted = tasks.every((t) => t.status === 'completed' || t.status === 'skipped')
              return (
                <div
                  key={date}
                  className="rounded-[11px] overflow-hidden"
                  style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
                >
                  <button
                    onClick={() => toggleSet(setCollapsedDays, date)}
                    className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                  >
                    <span className="text-sm font-semibold flex-1 capitalize" style={{ color: 'var(--ink)' }}>
                      {format.dateTime(new Date(date + 'T00:00:00'), {weekday: 'long', day: 'numeric', month: 'long'})}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--ink-500)' }}>
                      {tasks.length} · {dayMinutes} min
                    </span>
                    {dayCompleted && <CheckCircle size={14} style={{ color: SUCCESS }} />}
                    {collapsed
                      ? <CaretRight size={14} style={{ color: 'var(--ink-500)' }} />
                      : <CaretDown size={14} style={{ color: 'var(--ink-500)' }} />}
                  </button>
                  {!collapsed && (
                    <div className="border-t divide-y" style={{ borderColor: 'var(--ink-200)' }}>
                      {tasks.map((s) => (
                        <div key={s.id} className="px-4 py-2" style={{ borderColor: 'var(--ink-200)' }}>
                          <SessionRow session={s} onAction={mutateSession} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Historique */}
      {historySessions.length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="w-full flex items-center gap-2 text-xs font-bold uppercase tracking-wide cursor-pointer"
            style={{ color: 'var(--ink-700)' }}
          >
            {historyOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
            {`Historique (${historySessions.length})`}
          </button>
          {historyOpen && (
            <div className="space-y-1.5 mt-3">
              {historySessions.slice(0, 30).map((s) => (
                <SessionRow key={s.id} session={s} showDate onAction={mutateSession} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Edit modal */}
      {editing && (
        <EditPlanModal
          plan={plan}
          onClose={() => setEditing(false)}
          onSaved={async () => { setEditing(false); await load() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Today's highlighted card
// ─────────────────────────────────────────────────────────────────────
function TodaySessionCard({
  session,
  primary,
  onAction,
}: {
  session: StudyPlanTask
  primary?: boolean
  onAction: (
    id: string,
    action: 'start' | 'complete' | 'postpone' | 'skip' | 'reset',
  ) => Promise<StudyPlanTask | null>
}) {
  const done = session.status === 'completed'
  const skipped = session.status === 'skipped'
  const target = sessionTargetHref(session)
  const color = TASK_TYPE_COLORS[session.task_type]

  return (
    <article
      className="rounded-[11px] p-5"
      style={{
        background: primary ? 'var(--accent-soft)' : 'var(--bg-elev)',
        border: primary ? `1.5px solid ${COLOR}60` : '1px solid var(--ink-200)',
        opacity: done || skipped ? 0.65 : 1,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
          style={{ background: color + '20', color }}
        >
          {TASK_TYPE_LABELS[session.task_type]}
        </span>
        <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
          {session.duration_minutes} min
        </span>
      </div>

      <h3
        className="text-lg font-bold leading-tight"
        style={{
          color: 'var(--ink)',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {session.content_title}
      </h3>

      {session.rationale && (
        <p className="text-sm mt-1.5" style={{ color: 'var(--ink-700)' }}>
          {session.rationale}
        </p>
      )}

      {session.content_refs.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {session.content_refs.map((r) => (
            <span
              key={r.id}
              className="text-[11px] px-2 py-0.5 rounded-md"
              style={{ background: '#fcfcfb', color: 'var(--ink-700)' }}
            >
              {r.title}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        {!done && !skipped && target && (
          <Link
            href={target}
            onClick={() => { void onAction(session.id, 'start') }}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Play size={14} fill="currentColor" />
            {"Commencer"}
          </Link>
        )}
        {!done && (
          <button
            onClick={() => onAction(session.id, 'complete')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer"
            style={{ background: '#fcfcfb', color: 'var(--ink)' }}
          >
            <CheckCircle size={14} />
            {"Marquer fait"}
          </button>
        )}
        {done && (
          <button
            onClick={() => onAction(session.id, 'reset')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer"
            style={{ background: '#fcfcfb', color: 'var(--ink-700)' }}
          >
            <ArrowCounterClockwise size={14} />
            {"Annuler"}
          </button>
        )}
        {!done && !skipped && (
          <>
            <button
              onClick={() => onAction(session.id, 'postpone')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer"
              style={{ background: 'transparent', color: 'var(--ink-700)' }}
            >
              <CalendarDots size={14} />
              {"Reporter"}
            </button>
            <button
              onClick={() => onAction(session.id, 'skip')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer"
              style={{ background: 'transparent', color: 'var(--ink-500)' }}
            >
              <FastForward size={14} />
              {"Sauter"}
            </button>
          </>
        )}
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Compact session row
// ─────────────────────────────────────────────────────────────────────
function SessionRow({
  session,
  showDate,
  compact,
  overdue,
  onAction,
}: {
  session: StudyPlanTask
  showDate?: boolean
  compact?: boolean
  overdue?: boolean
  onAction: (
    id: string,
    action: 'start' | 'complete' | 'postpone' | 'skip' | 'reset',
  ) => Promise<StudyPlanTask | null>
}) {
  const format = ({number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('fr-FR', options).format(value), dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', options).format(new Date(value)), relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => new Intl.RelativeTimeFormat('fr-FR', {numeric: 'auto'}).format(value, unit)})
  const done = session.status === 'completed'
  const skipped = session.status === 'skipped'
  const target = sessionTargetHref(session)
  const color = TASK_TYPE_COLORS[session.task_type]
  const [menuOpen, setMenuOpen] = useState(false)

  const statusIcon = done
    ? <CheckCircle size={16} style={{ color: SUCCESS }} />
    : skipped
      ? <FastForward size={16} style={{ color: 'var(--ink-500)' }} />
      : <Circle size={16} style={{ color: overdue ? DANGER : 'var(--ink-200)' }} />

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ opacity: done || skipped ? 0.6 : 1 }}
    >
      <button
        onClick={() => onAction(session.id, done ? 'reset' : 'complete')}
        className="shrink-0 cursor-pointer p-0.5"
        aria-label={done ? "Annuler" : "Marquer fait"}
      >
        {statusIcon}
      </button>

      <div className="flex-1 min-w-0">
        {target && !done && !skipped ? (
          <Link href={target} onClick={() => { void onAction(session.id, 'start') }} className="block">
            <p
              className="text-sm font-medium truncate hover:underline"
              style={{ color: 'var(--ink)' }}
            >
              {session.content_title}
            </p>
          </Link>
        ) : (
          <p
            className="text-sm font-medium truncate"
            style={{
              color: 'var(--ink)',
              textDecoration: done || skipped ? 'line-through' : 'none',
            }}
          >
            {session.content_title}
          </p>
        )}
        <p className="text-[11px] truncate" style={{ color: color + 'cc' }}>
          {TASK_TYPE_LABELS[session.task_type]}
          {showDate && ` · ${format.dateTime(new Date(session.scheduled_date + 'T00:00:00'), {weekday: 'short', day: 'numeric', month: 'short'})}`}
          {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
        </p>
      </div>

      {!compact && !done && !skipped && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-black/10 cursor-pointer"
            aria-label={"Actions"}
          >
            <DotsThree size={14} style={{ color: 'var(--ink-500)' }} />
          </button>
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label={"Fermer le menu"}
                tabIndex={-1}
              />
              <div
                className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[140px] shadow-lg"
                style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
              >
                <MenuItem icon={<CalendarDots size={13} />} onClick={() => { setMenuOpen(false); onAction(session.id, 'postpone') }}>
                  {"Reporter"}
                </MenuItem>
                <MenuItem icon={<FastForward size={13} />} onClick={() => { setMenuOpen(false); onAction(session.id, 'skip') }}>
                  {"Sauter"}
                </MenuItem>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs cursor-pointer hover:bg-black/10"
      style={{ color: 'var(--ink-700)' }}
    >
      {icon}
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Plan menu (top-right)
// ─────────────────────────────────────────────────────────────────────
function PlanMenu({
  onEdit,
  onRegenerate,
  onDelete,
  regenerating,
}: {
  onEdit: () => void
  onRegenerate: () => void
  onDelete: () => void
  regenerating: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-xl cursor-pointer"
        style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
        aria-label={"Actions"}
      >
        <DotsThree size={16} style={{ color: 'var(--ink-700)' }} />
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-label={"Fermer le menu"}
            tabIndex={-1}
          />
          <div
            className="absolute right-0 top-11 z-20 rounded-xl py-1 min-w-[180px] shadow-lg"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
          >
            <MenuItem icon={<PencilSimple size={13} />} onClick={() => { setOpen(false); onEdit() }}>
              {"Modifier les paramètres"}
            </MenuItem>
            <MenuItem
              icon={<ArrowsClockwise size={13} className={regenerating ? 'animate-spin' : ''} />}
              onClick={() => { setOpen(false); onRegenerate() }}
            >
              {"Régénérer"}
            </MenuItem>
            <MenuItem icon={<Trash size={13} />} onClick={() => { setOpen(false); onDelete() }}>
              {"Supprimer"}
            </MenuItem>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Edit plan modal
// ─────────────────────────────────────────────────────────────────────
function EditPlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: StudyPlan
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(plan.title)
  const [examDate, setExamDate] = useState(plan.exam_date)
  const [minutes, setMinutes] = useState(plan.available_minutes_per_day)
  const [saving, setSaving] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/study-plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        exam_date: examDate,
        available_minutes_per_day: minutes,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? "Erreur")
      setSaving(false)
      return
    }
    toast.success("Planning mis à jour")
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-md rounded-[11px] p-6"
        style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>
          {"Modifier le planning"}
        </h2>
        <div className="space-y-4">
          <Field label={"Titre"}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#fcfcfb', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            />
          </Field>
          <Field label={"Date de l’examen"}>
            <input
              type="date"
              value={examDate}
              min={minDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#fcfcfb', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            />
          </Field>
          <Field label={"Temps disponible par jour (min)"}>
            <input
              type="number"
              min={10}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 60)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#fcfcfb', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            />
          </Field>
          <p className="text-xs" style={{ color: 'var(--ink-500)' }}>
            {"Si tu changes la date ou le temps/jour, lance « Régénérer » ensuite pour rebâtir les sessions."}
          </p>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            style={{ background: '#fcfcfb', color: 'var(--ink-700)' }}
          >
            {"Annuler"}
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="btn btn-primary flex-1"
            style={{ padding: '10px', fontSize: '13px' }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const aDate = new Date(ay, am - 1, ad)
  const bDate = new Date(by, bm - 1, bd)
  return Math.round((bDate.getTime() - aDate.getTime()) / 86_400_000)
}

function groupByDay(tasks: StudyPlanTask[]): Array<{ date: string; tasks: StudyPlanTask[] }> {
  const map = new Map<string, StudyPlanTask[]>()
  for (const t of tasks) {
    const existing = map.get(t.scheduled_date) ?? []
    map.set(t.scheduled_date, [...existing, t])
  }
  return Array.from(map.entries())
    .map(([date, ts]) => ({ date, tasks: ts }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function toggleSet<T>(setState: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    return next
  })
}

function sessionTargetHref(task: StudyPlanTask): string | null {
  const primary = task.content_refs?.[0]
  switch (task.task_type) {
    case 'flashcards':
      return primary?.type === 'deck' ? `/flashcards/${primary.id}/study` : null
    case 'fiche':
      return primary?.type === 'fiche' ? `/fiches/${primary.id}` : null
    case 'review':
    case 'general_review':
      if (!primary) return null
      return primary.type === 'deck' ? `/flashcards/${primary.id}/study` : `/fiches/${primary.id}`
    case 'exam':
      return '/exams/new'
  }
}
