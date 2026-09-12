'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarBlank, Plus } from '@phosphor-icons/react'
import type { StudyPlan } from '@/types'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import styles from '../flashcards/flashcards.module.css'
import planningStyles from './planning.module.css'

export interface PlanSummary extends StudyPlan {
  totalTasks: number
  completedTasks: number
}

export default function PlanningListPage({ initialPlans }: { initialPlans: PlanSummary[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [nowMs] = useState(() => Date.now())

  return (
    <div className={styles.libraryPage}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Planning</p>
          <h1>Mes plannings</h1>
          <p className={styles.pageSummary}>
            {plans.length === 0
              ? 'Organise tes révisions jour après jour jusqu’à ton prochain examen.'
              : `${plans.length} planning${plans.length > 1 ? 's' : ''} · ${plans.reduce((sum, plan) => sum + plan.totalTasks, 0)} sessions`}
          </p>
        </div>
        <Link href="/planning/new" className={styles.primaryButton}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          Nouveau planning
        </Link>
      </header>

      {plans.length === 0 ? (
        <section className={styles.emptyLibrary}>
          <CalendarBlank size={25} aria-hidden="true" />
          <div>
            <h2>Commence par une date d’examen</h2>
            <p>Sélectionne tes fiches et tes decks, indique ton temps disponible et Studra répartit les sessions.</p>
          </div>
          <Link href="/planning/new" className={styles.primaryButton}>Créer mon premier planning <ArrowRight size={15} /></Link>
        </section>
      ) : (
        <section className={styles.deckGrid} aria-label="Plannings de révision">
          {plans.map((plan) => {
            const daysLeft = Math.max(0, Math.round((new Date(`${plan.exam_date}T00:00:00`).getTime() - nowMs) / 86_400_000))
            const progress = plan.totalTasks > 0 ? plan.completedTasks / plan.totalTasks : 0
            const completed = plan.status === 'completed' || daysLeft === 0

            return (
              <article key={plan.id} className={styles.deckCard}>
                <div className={styles.deckCardTop}>
                  <span className={styles.deckSubject}>{completed ? 'Planning terminé' : 'Planning actif'}</span>
                  <div className={styles.deckCardActions}>
                    <span>{completed ? 'Échéance passée' : `J-${daysLeft}`}</span>
                    <DeleteEntityButton
                      table="study_plans"
                      id={plan.id}
                      entityLabel="ce planning"
                      variant="icon"
                      color="#1F4D3F"
                      onDeleted={(id) => setPlans((current) => current.filter((item) => item.id !== id))}
                    />
                  </div>
                </div>
                <Link href={`/planning/${plan.id}`} className={styles.deckCardLink}>
                  <h2>{plan.title}</h2>
                  <p className={planningStyles.planDetails}>Examen le {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${plan.exam_date}T00:00:00`))} · {plan.available_minutes_per_day} min/jour</p>
                  <div className={planningStyles.planProgress}>
                    <div className={planningStyles.planProgressTop}>
                      <span>Progression</span>
                      <span>{plan.completedTasks}/{plan.totalTasks}</span>
                    </div>
                    <div className={planningStyles.progressTrack}>
                      <div className={planningStyles.progressBar} style={{ transform: `scaleX(${progress})` }} />
                    </div>
                  </div>
                  <div className={styles.deckCardMeta}>
                    <span>{plan.totalTasks} session{plan.totalTasks > 1 ? 's' : ''}</span>
                    <span className={styles.openDeck}>Voir le planning <ArrowRight size={14} /></span>
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
