import Link from 'next/link'
import { ArrowRight, ChartBar, Clock, Target } from '@phosphor-icons/react/dist/ssr'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import styles from './tage-mage.module.css'

type Goal = { target_score: number | null; weekly_minutes: number | null; exam_date: string | null }
type Attempt = { id: string; correct_count: number; total_questions: number; completed_at: string; duration_seconds: number }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default async function TageMagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [goalResult, attemptsResult] = await Promise.all([
    supabase.from('tage_mage_goals').select('target_score, weekly_minutes, exam_date').eq('user_id', user.id).maybeSingle(),
    supabase.from('tage_mage_diagnostic_attempts').select('id, correct_count, total_questions, completed_at, duration_seconds').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(5),
  ])

  const goal = goalResult.data as Goal | null
  const attempts = (attemptsResult.data ?? []) as Attempt[]
  const latestAttempt = attempts[0]
  const hasGoal = Boolean(goal?.exam_date && goal.target_score !== null && goal.weekly_minutes)

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}><span /> TAGE MAGE</p>
          <h1>Vois ce qui mérite<br /><em>vraiment ton temps.</em></h1>
          <p className={styles.summary}>24 questions, six sous-tests et une correction détaillée pour repérer tes points d’appui et tes priorités.</p>
          <p className={styles.legalNote}>Préparation indépendante et non officielle, sans affiliation avec la FNEGE.</p>
        </div>
        <section className={styles.heroNote} aria-label="Format du diagnostic">
          <ChartBar size={23} weight="regular" aria-hidden="true" />
          <div><strong>Diagnostic privé</strong><span>24 questions · 6 sous-tests · résultat indicatif</span></div>
        </section>
      </header>

      <section className={styles.overviewGrid}>
        <div className={styles.startCard}>
          <p className={styles.kicker}>Étape 1</p>
          <h2>Commence par ton objectif.</h2>
          <p>Renseigne ta date, ton score cible et le temps que tu peux consacrer à ta préparation chaque semaine.</p>
          <div className={styles.startMeta}><span><Target size={15} /> Objectif personnel</span><span><Clock size={15} /> À ton rythme</span></div>
        </div>
        <OnboardingForm goal={goal} />
      </section>

      <section className={styles.diagnosticCard}>
        <div>
          <p className={styles.kicker}>Étape 2</p>
          <h2>{latestAttempt ? 'Refais le diagnostic.' : 'Passe le diagnostic.'}</h2>
          <p>Réponds sans pression : une question peut rester sans réponse. Ton résultat ne sera jamais converti en score officiel sur 600.</p>
        </div>
        <Link href="/tage-mage/diagnostic" aria-disabled={!hasGoal} className={styles.primaryButton} tabIndex={hasGoal ? undefined : -1}>
          {latestAttempt ? 'Refaire le diagnostic' : 'Commencer le diagnostic'} <ArrowRight size={17} weight="bold" />
        </Link>
        {!hasGoal && <p className={styles.actionHint}>Enregistre ton objectif pour débloquer le diagnostic.</p>}
      </section>

      <section className={styles.historySection} aria-labelledby="history-title">
        <div className={styles.sectionHeader}><div><p className={styles.kicker}>Historique</p><h2 id="history-title">Tes diagnostics.</h2></div></div>
        {attempts.length === 0 ? <div className={styles.emptyState}><ChartBar size={24} weight="regular" /><p>Ton premier diagnostic apparaîtra ici, avec ses résultats par sous-test.</p></div> : (
          <div className={styles.historyList}>
            {attempts.map((attempt) => <Link key={attempt.id} href={`/tage-mage/results/${attempt.id}`} className={styles.historyRow}>
              <div><strong>{attempt.correct_count}/{attempt.total_questions}</strong><span>réponses correctes</span></div>
              <time dateTime={attempt.completed_at}>{formatDate(attempt.completed_at)}</time>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>)}
          </div>
        )}
      </section>
    </main>
  )
}
