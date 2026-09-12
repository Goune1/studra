import Link from 'next/link'
import { ArrowLeft, CalendarBlank, Path } from '@phosphor-icons/react/dist/ssr'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TimelineViewer } from '@/components/timeline-viewer'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { TimelineData } from '@/types'
import styles from '../timelines.module.css'

const COLOR = '#1F4D3F'
const CATEGORY_LABELS: Record<string, string> = { politique: 'Politique', militaire: 'Militaire', economique: 'Économique', social: 'Social', culturel: 'Culturel', default: 'Autre' }

export default async function TimelinePage({ params }: { params: Promise<{ timelineId: string }> }) {
  const { timelineId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: timeline } = await supabase.from('timelines').select('*').eq('id', timelineId).eq('user_id', user!.id).single()
  if (!timeline) notFound()

  const data = timeline.generated_data as TimelineData
  const events = data?.events ?? []
  const categories = Object.entries(events.reduce<Record<string, number>>((accumulator, event) => {
    const category = event.category ?? 'default'
    accumulator[category] = (accumulator[category] ?? 0) + 1
    return accumulator
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const dates = events.map((event) => event.date).filter(Boolean).sort()
  const dateSpan = dates.length ? (dates[0].slice(0, 4) === dates[dates.length - 1].slice(0, 4) ? dates[0].slice(0, 4) : `${dates[0].slice(0, 4)} — ${dates[dates.length - 1].slice(0, 4)}`) : '—'
  const createdAt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(timeline.created_at))

  return (
    <div className={styles.detailPage}>
      <Link href="/timelines" className={styles.backLink}><ArrowLeft size={14} aria-hidden="true" />Toutes les frises</Link>
      <header className={styles.headerCard}>
        <div className={styles.headerMain}>
          <div className={styles.identity}>
            <p>{timeline.subject || 'Frise chronologique'}</p>
            <h1>{timeline.title}</h1>
            <div className={styles.identityMeta}>
              <span className={styles.statBadge}><Path size={13} aria-hidden="true" />{events.length} {events.length === 1 ? 'événement' : 'événements'}</span>
              <span className={`${styles.statBadge} ${styles.neutralBadge}`}>{dateSpan}</span>
              {categories.map(([category, count]) => <span key={category} className={`${styles.statBadge} ${styles.neutralBadge}`}>{CATEGORY_LABELS[category] ?? CATEGORY_LABELS.default} · {count}</span>)}
            </div>
          </div>
          <div className={styles.headerActions}>
            <DeleteEntityButton table="timelines" id={timeline.id} entityLabel="cette frise" variant="button" redirectTo="/timelines" color={COLOR} />
          </div>
        </div>
        <div className={styles.headerNote}>
          <span><CalendarBlank size={13} aria-hidden="true" /> Créée le {createdAt}</span>
          <span>Dates couvertes : {dateSpan}</span>
        </div>
      </header>
      <section className={styles.viewerSection}>
        <div className={styles.viewerHeading}>
          <div><p>Chronologie</p><h2>Événements organisés par date</h2></div>
          <span>{events.length} élément{events.length === 1 ? '' : 's'}</span>
        </div>
        <div className={styles.viewerContent}><TimelineViewer data={data} /></div>
      </section>
    </div>
  )
}
