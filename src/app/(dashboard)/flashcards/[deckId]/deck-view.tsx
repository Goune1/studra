import Link from 'next/link'
import { ArrowLeft, ArrowRight, Play } from '@phosphor-icons/react/dist/ssr'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import styles from '../flashcards.module.css'

export interface DeckViewDeck {
  id: string
  title: string
  subject: string | null
  created_at: string
}

export interface DeckViewCard {
  id: string
  question: string
  answer: string
}

export function DeckView({ deck, cards }: { deck: DeckViewDeck; cards: DeckViewCard[] }) {
  const cardCount = cards.length
  const createdAt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(deck.created_at))

  return (
    <div className={styles.deckPage}>
      <Link href="/flashcards" className={styles.backLink}><ArrowLeft size={14} /> Mes decks</Link>

      <section className={styles.deckHeaderCard} aria-labelledby="deck-title">
        <div className={styles.deckHeaderMain}>
          <div className={styles.deckIdentity}>
            <p>{deck.subject || 'Sans matière'} · créé le {createdAt}</p>
            <h1 id="deck-title">{deck.title}</h1>
            <span>{cardCount} carte{cardCount > 1 ? 's' : ''}</span>
          </div>
          <div className={styles.deckActions}>
            <DeleteEntityButton
              table="decks"
              id={deck.id}
              entityLabel="ce deck"
              variant="button"
              color="#1F4D3F"
              redirectTo="/flashcards"
            />
            <Link href={`/flashcards/${deck.id}/study`} className={styles.primaryButton}>
              <Play size={15} weight="fill" aria-hidden="true" />
              Réviser
            </Link>
          </div>
        </div>
        <div className={styles.deckHeaderNote}>
          <span>Répétition espacée active</span>
          <span>Studra choisit les cartes arrivées à échéance.</span>
        </div>
      </section>

      <section className={styles.previewSection} aria-labelledby="preview-title">
        <div className={styles.previewHeading}>
          <div>
            <p>Contenu du deck</p>
            <h2 id="preview-title">Questions et réponses</h2>
          </div>
          {cardCount > 0 && <span>{cardCount} au total</span>}
        </div>

        {cardCount === 0 ? (
          <div className={styles.emptyDeck}>
            <h3>Ce deck ne contient aucune carte</h3>
            <p>Crée un nouveau deck à partir d’un cours pour commencer une session.</p>
            <Link href="/flashcards/new">Créer un deck <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className={styles.previewList}>
            {cards.map((card, index) => (
              <article key={card.id} className={styles.previewRow}>
                <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div className={styles.questionBlock}>
                  <span>Question</span>
                  <p>{card.question}</p>
                </div>
                <div className={styles.answerBlock}>
                  <span>Réponse</span>
                  <p>{card.answer}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
