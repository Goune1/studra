import Link from 'next/link'
import { ArrowRight, Check } from '@phosphor-icons/react/dist/ssr'
import type { Profile } from '@/types'
import styles from './pro-gate.module.css'

interface ProGateProps {
  profile: Profile
  children: React.ReactNode
}

export function ProGate({ profile, children }: ProGateProps) {
  if (profile.plan === 'pro') return <>{children}</>

  const features = [
    'Générations illimitées',
    'Mode Socrate par dialogue',
    'Analyse personnalisée des lacunes',
  ]

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <p className={styles.context}>Fonctionnalité Pro</p>
        <h2>Réservé au plan Pro.</h2>
        <p className={styles.description}>Débloque les outils avancés de Studra pour approfondir tes révisions et générer sans limite.</p>
        <ul className={styles.features}>
          {features.map((feature) => <li key={feature}><Check size={15} weight="bold" />{feature}</li>)}
        </ul>
        <Link href="/upgrade" className={styles.button}>Passer en Pro · 4,99 €/mois <ArrowRight size={15} /></Link>
      </section>
    </div>
  )
}
