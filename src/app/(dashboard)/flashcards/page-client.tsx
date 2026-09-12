'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Cards, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { formatDate } from '@/lib/utils'
import { trackFlashcardsOpen } from '@/lib/analytics'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import styles from './flashcards.module.css'

export interface DeckSummary {
  id: string
  title: string
  subject: string | null
  card_count: number
  created_at: string
}

export default function FlashcardsPage({ initialDecks, userId }: { initialDecks: DeckSummary[]; userId: string }) {
  const [decks, setDecks] = useState(initialDecks)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [sort, setSort] = useState<'recent' | 'alpha' | 'cards'>('recent')

  useEffect(() => {
    trackFlashcardsOpen(userId)
  }, [userId])

  const subjects = useMemo(() => {
    return Array.from(new Set(decks.map((deck) => deck.subject).filter(Boolean) as string[])).sort()
  }, [decks])

  const filtered = useMemo(() => {
    let result = decks
    if (search) result = result.filter((deck) => deck.title.toLowerCase().includes(search.toLowerCase()))
    if (subject) result = result.filter((deck) => deck.subject === subject)
    if (sort === 'alpha') result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'cards') result = [...result].sort((a, b) => b.card_count - a.card_count)
    return result
  }, [decks, search, subject, sort])

  const totalCards = decks.reduce((sum, deck) => sum + deck.card_count, 0)

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Flashcards</p>
          <h1>Mes decks</h1>
          <p className={styles.pageSummary}>
            {decks.length === 0
              ? 'Transforme un cours en questions courtes, puis révise au bon moment.'
              : `${decks.length} deck${decks.length > 1 ? 's' : ''} · ${totalCards} carte${totalCards > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/flashcards/new" className={styles.primaryButton}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          Nouveau deck
        </Link>
      </header>

      {decks.length > 0 && (
        <section className={styles.libraryControls} aria-label="Rechercher et filtrer les decks">
          <label className={styles.searchField}>
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="sr-only">Rechercher un deck</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par titre" />
          </label>
          <label className={styles.sortField}>
            <span>Trier</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Plus récent</option>
              <option value="alpha">Alphabétique</option>
              <option value="cards">Nombre de cartes</option>
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

      {decks.length === 0 ? (
        <section className={styles.emptyLibrary}>
          <Cards size={25} weight="regular" aria-hidden="true" />
          <div>
            <h2>Commence avec un seul cours</h2>
            <p>Colle un texte, importe un PDF ou prends tes notes en photo. Tu pourras corriger les cartes avant de les réviser.</p>
          </div>
          <Link href="/flashcards/new" className={styles.primaryButton}>Créer mon premier deck <ArrowRight size={15} /></Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className={styles.noResults}>
          <h2>Aucun deck ne correspond</h2>
          <p>Modifie la recherche ou affiche toutes les matières.</p>
          <button type="button" onClick={() => { setSearch(''); setSubject(null) }}>Réinitialiser les filtres</button>
        </section>
      ) : (
        <section className={styles.deckGrid} aria-label="Decks de flashcards">
          {filtered.map((deck) => (
            <article key={deck.id} className={styles.deckCard}>
              <div className={styles.deckCardTop}>
                <span className={styles.deckSubject}>{deck.subject || 'Sans matière'}</span>
                <div className={styles.deckCardActions}>
                  <time dateTime={deck.created_at}>{formatDate(deck.created_at)}</time>
                  <DeleteEntityButton
                    table="decks"
                    id={deck.id}
                    entityLabel="ce deck"
                    variant="icon"
                    color="#1F4D3F"
                    onDeleted={(id) => setDecks((current) => current.filter((item) => item.id !== id))}
                  />
                </div>
              </div>
              <Link href={`/flashcards/${deck.id}`} className={styles.deckCardLink}>
                <h2>{deck.title}</h2>
                <div className={styles.deckCardMeta}>
                  <span>{deck.card_count} carte{deck.card_count > 1 ? 's' : ''}</span>
                  <span className={styles.openDeck}>Ouvrir le deck <ArrowRight size={14} /></span>
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
