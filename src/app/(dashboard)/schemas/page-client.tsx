'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GitBranch, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import type { Schema } from '@/types'
import styles from './schemas.module.css'

const SUBJECT_KEYS = ['all', 'ses', 'hggsp', 'maths', 'history', 'physics', 'other'] as const
const SUBJECT_LABELS = { all: 'Tous', ses: 'SES', hggsp: 'HGGSP', maths: 'Maths', history: 'Histoire', physics: 'Physique', other: 'Autre' } as const
type SortKey = 'date_desc' | 'date_asc' | 'alpha'

function MiniGraph({ seed }: { seed: number }) {
  const count = Math.max(4, Math.min(7, seed || 4))
  const dots = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2
    const radiusX = index % 2 === 0 ? 28 : 18
    const radiusY = index % 2 === 0 ? 18 : 12
    return { x: 40 + radiusX * Math.cos(angle), y: 27 + radiusY * Math.sin(angle) }
  })

  return (
    <svg width="80" height="54" viewBox="0 0 80 54" aria-hidden="true">
      {dots.map((dot, index) => {
        const next = dots[(index + 1) % count]
        return <line key={`edge-${index}`} x1={dot.x} y1={dot.y} x2={next.x} y2={next.y} stroke="var(--accent)" strokeOpacity="0.32" strokeWidth="0.8" />
      })}
      {count > 4 && <line x1={dots[0].x} y1={dots[0].y} x2={dots[Math.floor(count / 2)].x} y2={dots[Math.floor(count / 2)].y} stroke="var(--accent)" strokeOpacity="0.26" strokeWidth="0.8" />}
      {dots.map((dot, index) => <circle key={`node-${index}`} cx={dot.x} cy={dot.y} r={index === 0 ? 3.5 : 2.3} fill={index === 0 ? 'var(--accent)' : 'var(--bg-elev)'} stroke="var(--accent)" strokeOpacity="0.72" strokeWidth="1" />)}
    </svg>
  )
}

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<(typeof SUBJECT_KEYS)[number]>('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('schemas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        setSchemas((data as Schema[]) ?? [])
      }
      setLoading(false)
    }
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    let result = schemas
    if (search) result = result.filter((schema) => schema.title.toLowerCase().includes(search.toLowerCase()))
    if (subject !== 'all') result = result.filter((schema) => schema.subject === SUBJECT_LABELS[subject])
    return [...result].sort((a, b) => {
      if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'alpha') return a.title.localeCompare(b.title, 'fr')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [schemas, search, subject, sort])

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Schémas</p>
          <h1>Mes schémas</h1>
          <p className={styles.pageSummary}>
            {loading ? 'Chargement de tes schémas.' : schemas.length === 0 ? 'Relie les idées de ton cours dans une carte que tu peux modifier.' : `${schemas.length} schéma${schemas.length > 1 ? 's' : ''} prêt${schemas.length > 1 ? 's' : ''} à explorer.`}
          </p>
        </div>
        <Link href="/schemas/new" className={styles.primaryButton}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          Nouveau schéma
        </Link>
      </header>

      {!loading && schemas.length > 0 && (
        <section className={styles.libraryControls} aria-label="Rechercher et filtrer les schémas">
          <label className={styles.searchField}>
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher un schéma</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par titre" />
          </label>
          <label className={styles.sortField}>
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="date_desc">Plus récent</option>
              <option value="date_asc">Plus ancien</option>
              <option value="alpha">Alphabétique</option>
            </select>
          </label>
          <div className={styles.subjectFilters} aria-label="Filtrer par matière">
            {SUBJECT_KEYS.map((key) => <button key={key} type="button" data-active={subject === key} onClick={() => setSubject(key)}>{SUBJECT_LABELS[key]}</button>)}
          </div>
        </section>
      )}

      {!loading && schemas.length === 0 ? (
        <section className={styles.emptyLibrary}>
          <GitBranch size={25} weight="regular" aria-hidden="true" />
          <div>
            <h2>Commence avec un seul cours</h2>
            <p>Colle tes notes ou importe une source. Studra posera les concepts et leurs relations dans un schéma modifiable.</p>
          </div>
          <Link href="/schemas/new" className={styles.primaryButton}>Créer mon premier schéma <ArrowRight size={15} /></Link>
        </section>
      ) : !loading && filtered.length === 0 ? (
        <section className={styles.noResults}>
          <div><h2>Aucun schéma ne correspond</h2><p>Modifie la recherche ou affiche toutes les matières.</p></div>
          <button type="button" onClick={() => { setSearch(''); setSubject('all') }}>Réinitialiser les filtres</button>
        </section>
      ) : (
        <section className={styles.schemaGrid} aria-label="Schémas enregistrés">
          {filtered.map((schema) => {
            const nodeCount = schema.generated_data?.nodes?.length ?? 0
            const edgeCount = schema.generated_data?.edges?.length ?? 0
            return (
              <article key={schema.id} className={styles.schemaCard}>
                <div className={styles.schemaCardTop}>
                  <span className={styles.schemaSubject}>{schema.subject || 'Sans matière'}</span>
                  <div className={styles.schemaCardActions}>
                    <time dateTime={schema.created_at}>{new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(schema.created_at))}</time>
                    <DeleteEntityButton table="schemas" id={schema.id} entityLabel="ce schéma" variant="icon" color="#1F4D3F" onDeleted={(id) => setSchemas((current) => current.filter((item) => item.id !== id))} />
                  </div>
                </div>
                <Link href={`/schemas/${schema.id}`} className={styles.schemaCardLink}>
                  <h2>{schema.title}</h2>
                  <div className={styles.schemaPreview}><MiniGraph seed={nodeCount} /></div>
                  <div className={styles.schemaCardMeta}>
                    <span>{nodeCount} nœud{nodeCount > 1 ? 's' : ''} · {edgeCount} lien{edgeCount > 1 ? 's' : ''}</span>
                    <span className={styles.openSchema}>Ouvrir <ArrowRight size={14} /></span>
                  </div>
                </Link>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
