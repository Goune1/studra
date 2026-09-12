'use client'

import { useState } from 'react'
import { BookOpen, GitBranch, Lightbulb, ListNumbers, SpinnerGap, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import styles from './study-card.module.css'

type ExplainStyle = 'analogy' | 'example' | 'simple' | 'stepbystep'

interface FlashCardProps {
  question: string
  answer: string
  onFlipChange?: (flipped: boolean) => void
}

const EXPLAIN_STYLES = [
  { key: 'analogy' as const, label: 'Avec une analogie', Icon: GitBranch },
  { key: 'example' as const, label: 'Avec un exemple', Icon: Lightbulb },
  { key: 'simple' as const, label: 'Plus simplement', Icon: BookOpen },
  { key: 'stepbystep' as const, label: 'Étape par étape', Icon: ListNumbers },
]

export function FlashCard({ question, answer, onFlipChange }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)

  function handleFlip() {
    const next = !flipped
    setFlipped(next)
    onFlipChange?.(next)
  }

  async function handleExplain(style: ExplainStyle) {
    setExplaining(true)
    setShowExplain(false)
    try {
      const response = await fetch('/api/generate/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, style }),
      })
      const json = await response.json()
      if (!response.ok) {
        toast.error(json.error ?? 'Impossible de générer une explication')
        return
      }
      setExplanation(json.explanation)
    } catch {
      toast.error('Impossible de générer une explication')
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className={styles.studyCardShell}>
      <button type="button" className={`${styles.flipCard}${flipped ? ` ${styles.flipped}` : ''}`} onClick={handleFlip} aria-label={flipped ? 'Afficher la question' : 'Afficher la réponse'}>
        <span className={styles.flipInner}>
          <span className={styles.cardFace}>
            <span className={styles.faceHeader}><span>Question</span><span>Espace pour révéler</span></span>
            <span className={styles.faceContent}>{question}</span>
            <span className={styles.faceFooter}>Réfléchis avant de retourner la carte</span>
          </span>
          <span className={`${styles.cardFace} ${styles.cardBack}`}>
            <span className={styles.faceHeader}><span>Réponse</span><span>Cliquer pour revoir la question</span></span>
            <span className={styles.faceContent}>{explanation || answer}</span>
            {explanation && <span className={styles.originalAnswer}>Réponse initiale : {answer}</span>}
            <span className={styles.faceFooter}>Évalue maintenant la difficulté réelle</span>
          </span>
        </span>
      </button>

      {flipped && (
        <div className={styles.explainArea}>
          {showExplain ? (
            <div className={styles.explainPanel}>
              <div className={styles.explainPanelHeader}>
                <div><span>Besoin d’un autre angle ?</span><strong>Choisis une manière d’expliquer</strong></div>
                <button type="button" onClick={() => setShowExplain(false)} aria-label="Fermer"><X size={15} /></button>
              </div>
              <div className={styles.explainOptions}>
                {EXPLAIN_STYLES.map(({ key, label, Icon }) => (
                  <button type="button" key={key} onClick={() => handleExplain(key)} disabled={explaining}>
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button type="button" className={styles.explainButton} onClick={() => setShowExplain(true)} disabled={explaining}>
              {explaining ? <SpinnerGap size={16} className={styles.spinner} /> : <Lightbulb size={16} />}
              {explaining ? 'Génération de l’explication…' : 'Expliquer autrement'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
