'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretRight, CheckCircle, Clock, Timer } from '@phosphor-icons/react'
import { toast } from 'sonner'
import ContentPicker from '@/components/ContentPicker'
import type { ContentItem } from '@/types'
import styles from '../recall.module.css'

const DURATIONS = [
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
]

export default function RecallNewPage() {
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [duration, setDuration] = useState(300)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/recall/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_title: selected.title, source_content: selected.source_content, duration_seconds: duration }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors du démarrage')
        return
      }
      router.push(`/recall/${json.sessionId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}><Timer size={14} weight="regular" /> Rappel libre</p>
          <h1 className={styles.title}>Lance une session.</h1>
          <p className={styles.summary}>Écris tout ce que tu sais sur un sujet en temps limité. L’évaluation identifie ce qui est acquis et ce qu’il faut revoir.</p>
        </div>
      </header>

      <div className={styles.newLayout}>
        <div>
          <section className={styles.panel}>
            <h2 className={styles.panelHeading}>Contenu à rappeler</h2>
            <div className={styles.contentPicker}><ContentPicker selected={selected} onSelect={setSelected} /></div>
          </section>
          <section className={styles.panel}>
            <h2 className={styles.panelHeading}>Durée</h2>
            <div className={styles.durationGrid}>
              {DURATIONS.map((option) => (
                <button key={option.seconds} type="button" className={styles.durationButton} data-selected={duration === option.seconds} onClick={() => setDuration(option.seconds)}>
                  {option.label}
                </button>
              ))}
            </div>
            {selected && (
              <div className={styles.selectionNote}>
                <CheckCircle size={16} weight="fill" color="var(--accent)" />
                <span>{selected.title}</span>
                <time>{DURATIONS.find((option) => option.seconds === duration)?.label}</time>
              </div>
            )}
            <button type="button" className={`${styles.primaryButton} ${styles.startButton}`} onClick={handleStart} disabled={!selected || loading}>
              <CaretRight size={16} weight="bold" /> {loading ? 'Démarrage…' : 'Lancer le chronomètre'}
            </button>
            <p className={styles.generationNote}>Compte comme une génération lors de l’évaluation finale</p>
          </section>
        </div>
        <aside className={styles.aside}>
          <p className={styles.asideLabel}>Le déroulé</p>
          <div className={styles.asideItem}><Clock size={16} weight="regular" /><div><strong>Temps limité</strong><span>Choisis un créneau et écris sans interruption.</span></div></div>
          <div className={styles.asideItem}><CheckCircle size={16} weight="regular" /><div><strong>Évaluation ciblée</strong><span>Repère les notions couvertes, oubliées et imprécises.</span></div></div>
        </aside>
      </div>
    </div>
  )
}
