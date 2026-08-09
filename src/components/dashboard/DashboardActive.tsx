import { Link } from '@/i18n/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import type { DashboardData, RecentItem, ToolType } from '@/lib/dashboard/queries'

// Minimum de reviews sur 30j pour afficher un % de rétention significatif
const MIN_REVIEWS_RETENTION = 10
// Minimum de jours consécutifs pour afficher l'icône flamme
const MIN_STREAK_FLAME = 3

const monoSm: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), monospace',
  fontSize: 11,
  letterSpacing: '.12em',
  color: 'var(--ink-500)',
}

const card: React.CSSProperties = {
  background: 'var(--bg-elev)',
  border: '1px solid var(--ink-200)',
  borderRadius: 10,
}

const TYPE_LABEL: Record<ToolType, string> = {
  flashcards: 'Flashcards',
  fiche: 'Fiche',
  schema: 'Schéma',
  frise: 'Frise',
  examen: 'Examen',
}

function relativeTime(dateStr: string, formatDate: (date: Date) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  return formatDate(new Date(dateStr))
}

function TypeIcon({ type }: { type: ToolType }) {
  const s = { width: 16, height: 16, color: 'var(--ink-500)' } as const
  if (type === 'flashcards') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  )
  if (type === 'fiche') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  )
  if (type === 'schema') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  )
  if (type === 'frise') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  )
  return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

const CREATE_TOOLS = [
  { href: '/flashcards/new', label: 'Flashcards' },
  { href: '/fiches/new', label: 'Fiche' },
  { href: '/schemas/new', label: 'Schéma' },
  { href: '/timelines/new', label: 'Frise' },
  { href: '/exams/new', label: 'Examen' },
]

export function DashboardActive({ data, dateLabel }: { data: DashboardData; dateLabel: string }) {
  const t = useTranslations('dashboard')
  const format = useFormatter()
  const { user, dueCards, dueDecks, reviewEstimateMin, todayTasks, week, upcomingExams, recentItems } = data

  // Determine MAINTENANT content
  const hasDue = dueCards > 0
  const planningTasks = todayTasks.filter(t => t.kind === 'planning')
  const firstExam = upcomingExams[0]

  const primaryHref = hasDue
    ? (dueDecks.length === 1 ? `/flashcards/${dueDecks[0].deckId}/study` : '/flashcards')
    : planningTasks.length > 0 ? planningTasks[0].href : '/flashcards/new'

  let nowTitle: string
  let nowSubtitle: string
  if (hasDue) {
    nowTitle = `Bonjour ${user.name}, ${dueCards} carte${dueCards > 1 ? 's' : ''} t'attendent.`
    const parts = [`≈ ${reviewEstimateMin} min`, `${dueDecks.length} deck${dueDecks.length > 1 ? 's' : ''}`]
    nowSubtitle = parts.join(' · ')
  } else if (planningTasks.length > 0) {
    nowTitle = `Bonjour ${user.name}, ${planningTasks.length} session${planningTasks.length > 1 ? 's' : ''} planifiée${planningTasks.length > 1 ? 's' : ''} aujourd'hui.`
    const totalMin = planningTasks.reduce((s, t) => s + t.durationMin, 0)
    nowSubtitle = `≈ ${totalMin} min`
  } else {
    nowTitle = `Bonjour ${user.name}.`
    nowSubtitle = "Tout est à jour pour aujourd'hui."
  }

  // Bar chart: last 7 days
  const last7 = week.heatmap.slice(-7)
  const maxCount = Math.max(...last7.map(d => d.count), 1)
  const activeDays7 = last7.filter(d => d.count > 0).length
  const showChart = activeDays7 >= 5

  // Due decks: show top 3, collapse rest
  const visibleDecks = dueDecks.slice(0, 3)
  const hiddenDecks = dueDecks.slice(3)
  const hiddenCards = hiddenDecks.reduce((s, d) => s + d.dueCount, 0)

  // Recent items: top 3
  const recent = recentItems.slice(0, 3)

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 30 }}>

      {/* Header: date + badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={monoSm}>{dateLabel}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {firstExam && (
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11, letterSpacing: '.1em', color: '#B3362E', border: '1px solid rgba(179,54,46,.35)', borderRadius: 999, padding: '6px 14px' }}>
              {firstExam.title.toUpperCase()} · J-{firstExam.daysLeft}
            </span>
          )}
          {user.plan === 'pro' && (
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11, letterSpacing: '.1em', color: 'var(--ink-500)' }}>
              PRO
            </span>
          )}
        </div>
      </div>

      {/* MAINTENANT */}
      <div style={{ ...card, borderLeft: '3px solid var(--accent)', padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={monoSm}>{t('now')}</div>
        <h1 style={{ fontSize: 'clamp(20px, 3.2vw, 27px)', fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15, color: 'var(--ink)', margin: 0 }}>
          {nowTitle}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--ink-500)', flexWrap: 'wrap' }}>
          {nowSubtitle}
          {week.streakDays >= MIN_STREAK_FLAME && hasDue && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}>
              ·&nbsp;
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              série de {week.streakDays} jours en jeu
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          <Link
            href={primaryHref}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent)', color: 'var(--accent-fg)', borderRadius: 8, padding: '12px 24px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
          >
            {hasDue ? 'Lancer la session' : planningTasks.length > 0 ? 'Démarrer' : 'Créer du contenu'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          {hasDue && (
            <Link
              href="/flashcards"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--ink-200)', borderRadius: 8, padding: '12px 18px', fontSize: 14.5, fontWeight: 500, color: 'var(--ink-700)', textDecoration: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Juste 10 min
            </Link>
          )}
        </div>
      </div>

      {/* LA BOUCLE DU JOUR */}
      {(dueDecks.length > 0 || planningTasks.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={monoSm}>LA BOUCLE DU JOUR</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleDecks.map((deck) => {
              const estMin = Math.max(1, Math.round(deck.dueCount * 0.5))
              return (
                <Link
                  key={deck.deckId}
                  href={`/flashcards/${deck.deckId}/study`}
                  style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>{deck.title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-500)', flexShrink: 0 }}>
                    {deck.dueCount} carte{deck.dueCount > 1 ? 's' : ''} · {estMin} min
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              )
            })}
            {planningTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ink)' }}>{task.title}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-500)', flexShrink: 0 }}>
                  {task.subtitle} · {task.durationMin} min
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </Link>
            ))}
            {hiddenDecks.length > 0 && (
              <Link href="/flashcards" style={{ fontSize: 13, color: 'var(--ink-500)', padding: '2px 4px', textDecoration: 'none' }}>
                + {hiddenDecks.length} autre{hiddenDecks.length > 1 ? 's' : ''} deck{hiddenDecks.length > 1 ? 's' : ''} ({hiddenCards} cartes)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* PROGRESSION */}
      {week.retentionRate !== null || week.streakDays > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={monoSm}>PROGRESSION</div>
          <div className={`grid gap-3 ${showChart ? 'grid-cols-[1fr_1fr_2fr]' : 'grid-cols-2'}`}>
            {week.retentionRate !== null && (
              <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {week.totalReviews >= MIN_REVIEWS_RETENTION ? (
                  <>
                    <span style={{ fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>{week.retentionRate}%</span>
                    <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, letterSpacing: '.1em', color: 'var(--ink-500)' }}>RÉTENTION 30J</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>{week.totalReviews}</span>
                    <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, letterSpacing: '.1em', color: 'var(--ink-500)' }}>RÉVISION{week.totalReviews > 1 ? 'S' : ''} 30J</span>
                  </>
                )}
              </div>
            )}
            {week.streakDays > 0 && (
              <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 23, fontWeight: 600, color: 'var(--ink)' }}>
                  {week.streakDays >= MIN_STREAK_FLAME && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                    </svg>
                  )}
                  {week.streakDays} jour{week.streakDays > 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, letterSpacing: '.1em', color: 'var(--ink-500)' }}>SÉRIE EN COURS</span>
              </div>
            )}
            {showChart && (
              <div style={{ ...card, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 30 }}>
                  {last7.map((day, i) => {
                    const h = Math.max(3, Math.round((day.count / maxCount) * 30))
                    const isToday = i === 6
                    return (
                      <span
                        key={day.date}
                        style={{ flex: 1, height: h, background: isToday ? 'var(--accent)' : '#D8E0DC', borderRadius: 2 }}
                      />
                    )
                  })}
                </div>
                <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, letterSpacing: '.1em', color: 'var(--ink-500)' }}>
                  REVIEWS · 7 DERNIERS JOURS
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* REPRENDRE */}
      {recent.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={monoSm}>REPRENDRE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((item: RecentItem) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.href}
                style={{ ...card, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--ink-700)' }}>
                  <TypeIcon type={item.type} />
                  {TYPE_LABEL[item.type]} · {item.title}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-500)', flexShrink: 0 }}>
                  {relativeTime(item.createdAt, (date) => format.dateTime(date, { day: 'numeric', month: 'short' }))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CRÉER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid var(--ink-200)', paddingTop: 20, flexWrap: 'wrap' }}>
        <div style={{ ...monoSm, flexShrink: 0 }}>CRÉER</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CREATE_TOOLS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--ink-200)', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--ink-700)', textDecoration: 'none' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              {label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
