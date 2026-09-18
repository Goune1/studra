'use client'

import { useActionState, useEffect } from 'react'
import { CheckCircle, FloppyDisk } from '@phosphor-icons/react'
import { trackTageMageGoalSaved, trackTageMageModuleViewed } from '@/lib/analytics'
import { saveTageMageGoal, type GoalActionState } from './onboarding-actions'
import styles from './tage-mage.module.css'

type Goal = {
  target_score: number | null
  weekly_minutes: number | null
  exam_date: string | null
}

const initialState: GoalActionState = { ok: false }

export function OnboardingForm({ goal }: { goal: Goal | null }) {
  const [state, formAction, pending] = useActionState(saveTageMageGoal, initialState)

  useEffect(() => {
    trackTageMageModuleViewed()
  }, [])

  useEffect(() => {
    if (state.ok) trackTageMageGoalSaved()
  }, [state.ok])

  return (
    <form action={formAction} className={styles.goalForm} noValidate>
      <div className={styles.formHeading}>
        <p className={styles.kicker}>Ton objectif</p>
        <h2>Donne un cadre au diagnostic.</h2>
        <p>Ces informations servent à suivre ton cap. Elles ne produisent pas d’estimation officielle.</p>
      </div>

      <div className={styles.fieldGrid}>
        <label className={styles.field} htmlFor="examDate">
          <span>Date de passage</span>
          <input id="examDate" name="examDate" type="date" required defaultValue={goal?.exam_date ?? ''} />
        </label>
        <label className={styles.field} htmlFor="targetScore">
          <span>Score cible</span>
          <input id="targetScore" name="targetScore" type="number" min="0" max="600" inputMode="numeric" required defaultValue={goal?.target_score ?? ''} placeholder="Ex. 350" />
        </label>
        <label className={styles.field} htmlFor="weeklyMinutes">
          <span>Temps disponible par semaine</span>
          <input id="weeklyMinutes" name="weeklyMinutes" type="number" min="15" max="1200" step="15" inputMode="numeric" required defaultValue={goal?.weekly_minutes ?? ''} placeholder="Ex. 180" />
        </label>
      </div>

      <div className={styles.formFooter} aria-live="polite">
        {state.error ? <p className={styles.formError} role="alert">{state.error}</p> : state.ok ? <p className={styles.formSuccess}><CheckCircle size={16} weight="fill" /> Objectif enregistré.</p> : <span />}
        <button className={styles.secondaryButton} type="submit" disabled={pending}>
          <FloppyDisk size={16} weight="bold" /> {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
