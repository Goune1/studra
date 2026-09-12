'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ClipboardText, ListChecks } from '@phosphor-icons/react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackExamGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import styles from '../../flashcards/flashcards.module.css'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'timeline']

interface Props {
  showPaywall: boolean
  price: string | null
}

export default function NewExamPage({ showPaywall, price }: Props) {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  function toggleAlso(key: AlsoKey) {
    setAlso((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    if (showPaywall) {
      setPaywallOpen(true)
      return
    }

    setLoading(true)
    trackExamGenerate(data.subject || data.title, 'moyen')
    const startedAt = Date.now()
    try {
      const { primary, also: alsoResults } = await generateWithAlso('exam', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('exam', 'generation_failed')
        toast.error('Impossible de générer l’examen')
        return
      }
      trackAIGenerationSuccess('exam', Date.now() - startedAt)
      toast.success('Examen généré avec succès')
      setResults(buildResources('exam', primary.id!, alsoResults))
    } catch {
      trackAIGenerationError('exam', 'exception')
      toast.error('Une erreur est survenue pendant la génération')
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return (
      <GenerationResultsScreen
        resources={results}
        newPath="/exams/new"
        newLabel="Créer un autre examen"
        quiet
        className={styles.resultsScreen}
      />
    )
  }

  return (
    <div className={styles.createPage}>
      <Link href="/exams" className={styles.backLink}><ArrowLeft size={14} /> Mes examens</Link>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Nouvel examen</p>
          <h1>Pars de ton cours.</h1>
          <p className={styles.pageSummary}>Choisis une source et laisse Studra préparer les questions, les réponses et la correction.</p>
        </div>
      </header>

      {showPaywall && <PaywallBanner tool="exam" />}

      <div className={styles.creationGrid}>
        <section className={styles.formPanel} aria-label="Créer un examen blanc">
          <ContentInputForm
            onSubmit={handleGenerate}
            submitLabel={also.size > 0 ? `Générer l’examen et ${also.size} autre${also.size > 1 ? 's' : ''} support${also.size > 1 ? 's' : ''}` : 'Générer l’examen'}
            titlePlaceholder="Ex. Examen - La photosynthèse"
            contentPlaceholder="Colle ici le cours sur lequel tu veux être évalué…"
            loading={loading}
            className={styles.creationForm}
            extras={
              <AlsoGenerateSection
                options={ALSO_OPTIONS}
                selected={also}
                onChange={toggleAlso}
                quiet
                className={styles.alsoPanel}
              />
            }
          />
        </section>

        <aside className={styles.creationAside}>
          <p className={styles.asideLabel}>Ce que tu obtiens</p>
          <div className={styles.asideItem}>
            <ListChecks size={18} aria-hidden="true" />
            <div><strong>Un format complet</strong><span>Sept QCM et trois questions ouvertes.</span></div>
          </div>
          <div className={styles.asideItem}>
            <Check size={18} aria-hidden="true" />
            <div><strong>Une correction détaillée</strong><span>Réponses attendues, score et explications.</span></div>
          </div>
          <div className={styles.asideItem}>
            <ClipboardText size={18} aria-hidden="true" />
            <div><strong>Plusieurs sources</strong><span>Texte, PDF, photo ou vidéo sous-titrée.</span></div>
          </div>
          <p className={styles.asideNote}>Réponds à toutes les questions avant d’envoyer l’examen pour correction.</p>
        </aside>
      </div>

      {paywallOpen && <PaywallModal tool="exam" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
