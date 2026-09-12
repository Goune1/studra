'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MagnifyingGlass, Path, Plus } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { Timeline, TimelineEvent } from '@/types'
import styles from './timelines.module.css'

const COLOR = '#1F4D3F'
const MATIERE_KEYS = ['all', 'ses', 'hggsp', 'maths', 'history', 'physics', 'other'] as const
const SUBJECT_LABELS = { all: 'Tous', ses: 'SES', hggsp: 'HGGSP', maths: 'Maths', history: 'Histoire', physics: 'Physique', other: 'Autre' } as const
type SortKey = 'date_desc' | 'date_asc' | 'alpha'
const SORT_LABELS: Record<SortKey, string> = { date_desc: 'Plus récentes', date_asc: 'Plus anciennes', alpha: 'Titre A à Z' }
const CAT_COLORS: Record<string, string> = { politique: '#B4503C', economique: '#A8762E', social: COLOR, culturel: '#3E6B7A', militaire: '#6B7280', default: COLOR }

function dateRange(events: TimelineEvent[]): string {
  if (!events.length) return '—'
  const dates = events.map((event) => event.date).filter(Boolean).sort()
  const first = dates[0]?.slice(0, 4)
  const last = dates[dates.length - 1]?.slice(0, 4)
  return first === last ? first : `${first} — ${last}`
}

function MiniTimeline({ events }: { events: TimelineEvent[] }) {
  const dots = events.slice(0, 5)
  return (
    <div className={styles.miniTimeline} aria-hidden="true">
      {dots.map((event, index) => (
        <span
          key={`${event.date}-${index}`}
          className={styles.miniDot}
          style={{
            left: `${(index / Math.max(dots.length - 1, 1)) * 100}%`,
            background: CAT_COLORS[event.category ?? 'default'] ?? COLOR,
          }}
        />
      ))}
    </div>
  )
}

export default function TimelinesPage() {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [matiere, setMatiere] = useState('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('timelines').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setTimelines((data as Timeline[]) ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let list = timelines
    if (search) list = list.filter((timeline) => timeline.title.toLowerCase().includes(search.toLowerCase()))
    if (matiere !== 'all') list = list.filter((timeline) => timeline.subject === SUBJECT_LABELS[matiere as keyof typeof SUBJECT_LABELS])
    return [...list].sort((a, b) => {
      if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return a.title.localeCompare(b.title, 'fr')
    })
  }, [timelines, search, matiere, sort])

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Frises chronologiques</p>
          <h1>Mes frises</h1>
          <p className={styles.pageSummary}>{loading ? 'Chargement de vos frises…' : `${timelines.length} ${timelines.length === 1 ? 'frise enregistrée' : 'frises enregistrées'}`}</p>
        </div>
        <Link href="/timelines/new" className={styles.primaryButton}>
          <Plus size={16} weight="bold" aria-hidden="true" />
          Nouvelle frise
        </Link>
      </header>

      <section className={styles.libraryControls} aria-label="Filtrer les frises">
        <label className={styles.searchField}>
          <MagnifyingGlass size={16} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une frise" />
        </label>
        <label className={styles.sortField}>
          Trier par
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Trier les frises">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => <option key={key} value={key}>{SORT_LABELS[key]}</option>)}
          </select>
        </label>
        <div className={styles.subjectFilters} aria-label="Filtrer par matière">
          {MATIERE_KEYS.map((key) => (
            <button key={key} type="button" data-active={matiere === key} onClick={() => setMatiere(key)}>{SUBJECT_LABELS[key]}</button>
          ))}
        </div>
      </section>

      {!loading && timelines.length === 0 ? (
        <section className={styles.emptyState}>
          <Path size={28} weight="duotone" aria-hidden="true" />
          <div><h2>Votre bibliothèque est vide</h2><p>Créez une frise à partir de votre cours pour organiser les événements et leurs dates.</p></div>
          <Link href="/timelines/new" className={styles.primaryButton}><Plus size={16} aria-hidden="true" />Créer une frise</Link>
        </section>
      ) : !loading && filtered.length === 0 ? (
        <section className={styles.noResults}>
          <div><h2>Aucune frise ne correspond</h2><p>Modifiez la recherche ou les filtres pour retrouver une frise.</p></div>
          <button type="button" onClick={() => { setSearch(''); setMatiere('all') }}>Réinitialiser</button>
        </section>
      ) : (
        <div className={styles.timelineGrid}>
          {filtered.map((timeline) => {
            const events = (timeline.generated_data?.events ?? []) as TimelineEvent[]
            return (
              <article key={timeline.id} className={styles.timelineCard}>
                <div className={styles.cardTop}>
                  <span className={styles.subject}>{timeline.subject || 'Sans matière'}</span>
                  <div className={styles.cardActions}>
                    <time dateTime={timeline.created_at}>{new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timeline.created_at))}</time>
                    <DeleteEntityButton table="timelines" id={timeline.id} entityLabel="cette frise" variant="icon" color={COLOR} onDeleted={(id) => setTimelines((previous) => previous.filter((item) => item.id !== id))} />
                  </div>
                </div>
                <Link href={`/timelines/${timeline.id}`} className={styles.cardLink}>
                  <h2>{timeline.title}</h2>
                  <MiniTimeline events={events} />
                  <div className={styles.cardMeta}>
                    <span>{events.length} {events.length === 1 ? 'événement' : 'événements'}</span>
                    <span>{dateRange(events)}</span>
                  </div>
                  <span className={styles.openTimeline}>Ouvrir <ArrowRight size={13} aria-hidden="true" /></span>
                </Link>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
