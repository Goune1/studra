'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarBlank, Check, Clock, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { StudyPlanContentItem } from '@/lib/openai'
import styles from '../../flashcards/flashcards.module.css'
import planningStyles from '../planning.module.css'

interface SelectableItem extends StudyPlanContentItem {
  selected: boolean
}

export interface InitialPlanningItem {
  id: string
  title: string
  type: 'fiche' | 'deck'
}

const MASTERY_LABELS = ['', 'Très difficile', 'Difficile', 'Moyen', 'Maîtrisé', 'Très maîtrisé']
const TIME_OPTIONS = [30, 45, 60, 90, 120]

export default function PlanningNewPage({ initialItems }: { initialItems: InitialPlanningItem[] }) {
  const [title, setTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [minutesPerDay, setMinutesPerDay] = useState(60)
  const [items, setItems] = useState<SelectableItem[]>(initialItems.map((item) => ({ ...item, mastery: 3, selected: false })))
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  function toggleItem(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  function setMastery(id: string, mastery: number) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, mastery } : item))
  }

  const selected = items.filter((item) => item.selected)
  const canGenerate = title.trim() && examDate && selected.length > 0

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    try {
      const response = await fetch('/api/generate/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          exam_date: examDate,
          available_minutes_per_day: minutesPerDay,
          contents: selected.map(({ id, title: contentTitle, type, mastery }) => ({ id, title: contentTitle, type, mastery })),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.error ?? 'Erreur lors de la génération')
        return
      }
      toast.success(`Planning créé (${result.taskCount} session${result.taskCount === 1 ? '' : 's'})`)
      router.push(`/planning/${result.planId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.createPage}>
      <Link href="/planning" className={styles.backLink}><ArrowLeft size={14} /> Mes plannings</Link>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Nouveau planning</p>
          <h1>Pars de ta date.</h1>
          <p className={styles.pageSummary}>Choisis les contenus à réviser, évalue ta maîtrise et indique ton temps disponible chaque jour.</p>
        </div>
      </header>

      <div className={styles.creationGrid}>
        <div className={planningStyles.planningForm}>
          <section className={planningStyles.formSection}>
            <h2>Paramètres</h2>
            <p className={planningStyles.formSectionIntro}>Définis l’objectif et le rythme de travail.</p>
            <label className={planningStyles.field}>
              <span>Nom de l’examen</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Bac de philosophie" />
            </label>
            <div className={planningStyles.fieldGrid} style={{ marginTop: 13 }}>
              <label className={planningStyles.field}>
                <span>Date de l’examen</span>
                <input type="date" value={examDate} min={minDate} onChange={(event) => setExamDate(event.target.value)} />
              </label>
              <div className={planningStyles.field}>
                <span>Temps disponible par jour</span>
                <div className={planningStyles.timeOptions}>
                  {TIME_OPTIONS.map((minutes) => (
                    <button key={minutes} type="button" data-active={minutesPerDay === minutes} className={planningStyles.timeOption} onClick={() => setMinutesPerDay(minutes)}>
                      {minutes} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={planningStyles.formSection}>
            <h2>Contenus à réviser</h2>
            <p className={planningStyles.formSectionIntro}>Sélectionne tes fiches et decks, puis note ta maîtrise de 1 à 5.</p>
            {items.length === 0 ? (
              <p className={planningStyles.emptyContent}>Aucun contenu trouvé. Crée d’abord une fiche ou un deck de flashcards.</p>
            ) : (
              <div className={planningStyles.contentList}>
                {items.map((item) => (
                  <div key={item.id} className={planningStyles.contentItem}>
                    <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} aria-label={`Sélectionner ${item.title}`} />
                    <button type="button" className={planningStyles.contentToggle} onClick={() => toggleItem(item.id)}>
                      <strong>{item.title}</strong>
                      <span>{item.type === 'deck' ? 'Flashcards' : 'Fiche'}</span>
                    </button>
                    {item.selected && (
                      <div className={planningStyles.masteryOptions} aria-label={`Maîtrise de ${item.title}`}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            title={MASTERY_LABELS[level]}
                            aria-label={MASTERY_LABELS[level]}
                            data-active={item.mastery === level}
                            className={planningStyles.masteryButton}
                            onClick={() => setMastery(item.id, level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {selected.length > 0 && <p className={planningStyles.selectionSummary}>{selected.length} contenu{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</p>}

          <button type="button" onClick={handleGenerate} disabled={!canGenerate || loading} className={planningStyles.submitButton}>
            <Sparkle size={15} /> {loading ? 'Génération du planning…' : 'Générer mon planning'}
          </button>
          <p className={planningStyles.quotaNote}>Compte comme une génération sur ton quota mensuel.</p>
        </div>

        <aside className={styles.creationAside}>
          <p className={styles.asideLabel}>Comment ça fonctionne</p>
          <div className={styles.asideItem}>
            <CalendarBlank size={18} aria-hidden="true" />
            <div><strong>Une répartition quotidienne</strong><span>Les sessions sont placées jusqu’à la date de l’examen.</span></div>
          </div>
          <div className={styles.asideItem}>
            <Clock size={18} aria-hidden="true" />
            <div><strong>Un rythme réaliste</strong><span>Chaque journée respecte ton temps disponible.</span></div>
          </div>
          <div className={styles.asideItem}>
            <Check size={18} aria-hidden="true" />
            <div><strong>Un planning adaptable</strong><span>Reporte, saute ou régénère les sessions si nécessaire.</span></div>
          </div>
          <p className={styles.asideNote}>Les contenus les moins maîtrisés sont prioritaires dans la répartition.</p>
        </aside>
      </div>
    </div>
  )
}
