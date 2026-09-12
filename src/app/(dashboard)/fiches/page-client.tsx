'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { formatDate } from '@/lib/utils'
import { trackFichesOpen } from '@/lib/analytics'
import styles from '../flashcards/flashcards.module.css'
import ficheStyles from './fiches.module.css'

export interface FicheSummary {
  id: string
  title: string
  subject: string | null
  generated_content: string
  created_at: string
}

type SortKey = 'recent' | 'oldest' | 'alpha'

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function excerpt(content: string, maxLength = 120): string {
  const plain = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain
}

export default function FichesPage({ initialFiches, userId }: { initialFiches: FicheSummary[]; userId: string }) {
  const [fiches, setFiches] = useState(initialFiches)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('recent')

  useEffect(() => {
    trackFichesOpen(userId)
  }, [userId])

  const subjects = useMemo(() => {
    return Array.from(new Set(fiches.map((fiche) => fiche.subject).filter(Boolean) as string[])).sort()
  }, [fiches])

  const filtered = useMemo(() => {
    let result = fiches
    if (search) result = result.filter((fiche) => fiche.title.toLowerCase().includes(search.toLowerCase()))
    if (subject) result = result.filter((fiche) => fiche.subject === subject)
    if (sort === 'alpha') result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    if (sort === 'oldest') result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return result
  }, [fiches, search, subject, sort])

  const totalWords = fiches.reduce((sum, fiche) => sum + wordCount(fiche.generated_content), 0)

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Fiches</p>
          <h1>Mes fiches</h1>
          <p className={styles.pageSummary}>
            {fiches.length === 0
              ? 'Transforme un cours en une synthèse claire, structurée et modifiable.'
              : `${fiches.length} fiche${fiches.length > 1 ? 's' : ''} · ${totalWords.toLocaleString('fr-FR')} mots`}
          </p>
        </div>
        <Link href="/fiches/new" className={styles.primaryButton}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          Nouvelle fiche
        </Link>
      </header>

      {fiches.length > 0 && (
        <section className={styles.libraryControls} aria-label="Rechercher et filtrer les fiches">
          <label className={styles.searchField}>
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher une fiche</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par titre" />
          </label>
          <label className={styles.sortField}>
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="alpha">Alphabétique</option>
            </select>
          </label>
          {subjects.length > 0 && (
            <div className={styles.subjectFilters} aria-label="Filtrer par matière">
              <button type="button" data-active={subject === null} onClick={() => setSubject(null)}>Toutes</button>
              {subjects.map((item) => (
                <button key={item} type="button" data-active={subject === item} onClick={() => setSubject(subject === item ? null : item)}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {fiches.length === 0 ? (
        <section className={styles.emptyLibrary}>
          <FileText size={25} weight="regular" aria-hidden="true" />
          <div>
            <h2>Commence avec un seul cours</h2>
            <p>Colle un texte, importe un PDF ou prends tes notes en photo. Tu pourras modifier la fiche après sa génération.</p>
          </div>
          <Link href="/fiches/new" className={styles.primaryButton}>Créer ma première fiche <ArrowRight size={15} /></Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.noResults}>
          <div>
            <h2>Aucune fiche ne correspond</h2>
            <p>Modifie la recherche ou affiche toutes les matières.</p>
          </div>
          <button type="button" onClick={() => { setSearch(''); setSubject(null) }}>Réinitialiser les filtres</button>
        </section>
      ) : (
        <section className={styles.deckGrid} aria-label="Fiches de révision">
          {filtered.map((fiche) => {
            const words = wordCount(fiche.generated_content)
            return (
              <article key={fiche.id} className={styles.deckCard}>
                <div className={styles.deckCardTop}>
                  <span className={styles.deckSubject}>{fiche.subject || 'Sans matière'}</span>
                  <div className={styles.deckCardActions}>
                    <time dateTime={fiche.created_at}>{formatDate(fiche.created_at)}</time>
                    <DeleteEntityButton
                      table="fiches"
                      id={fiche.id}
                      entityLabel="cette fiche"
                      variant="icon"
                      color="#1F4D3F"
                      onDeleted={(id) => setFiches((current) => current.filter((item) => item.id !== id))}
                    />
                  </div>
                </div>
                <Link href={`/fiches/${fiche.id}`} className={styles.deckCardLink}>
                  <h2>{fiche.title}</h2>
                  <p className={ficheStyles.ficheExcerpt}>{excerpt(fiche.generated_content)}</p>
                  <div className={styles.deckCardMeta}>
                    <span>~{words.toLocaleString('fr-FR')} mots</span>
                    <span className={styles.openDeck}>Lire la fiche <ArrowRight size={14} /></span>
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
