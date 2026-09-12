'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Cards, Check, FileText } from '@phosphor-icons/react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackFlashcardsGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import styles from '../flashcards.module.css'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'schema', 'exam', 'timeline']

interface Props {
  showPaywall: boolean
  price: string | null
}

export default function NewFlashcardsPage({ showPaywall, price }: Props) {
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
    trackFlashcardsGenerate(data.subject || data.title, 0)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoResults } = await generateWithAlso('flashcards', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('flashcards', 'generation_failed')
        toast.error('Impossible de générer les cartes')
        return
      }
      trackAIGenerationSuccess('flashcards', Date.now() - startedAt)
      setResults(buildResources('flashcards', primary.id!, alsoResults))
    } catch {
      trackAIGenerationError('flashcards', 'exception')
      toast.error('Une erreur est survenue pendant la génération')
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return (
      <GenerationResultsScreen
        resources={results}
        newPath="/flashcards/new"
        newLabel="Créer un autre deck"
        quiet
        className={styles.resultsScreen}
      />
    )
  }

  return (
    <div className={styles.createPage}>
      <Link href="/flashcards" className={styles.backLink}><ArrowLeft size={14} /> Mes decks</Link>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Nouveau deck</p>
          <h1>Pars de ton cours.</h1>
          <p className={styles.pageSummary}>Choisis une source, vérifie le contenu et laisse Studra préparer les questions.</p>
        </div>
      </header>

      {showPaywall && <PaywallBanner tool="flashcards" />}

      <div className={styles.creationGrid}>
        <section className={styles.formPanel} aria-label="Créer un deck de flashcards">
          <ContentInputForm
            onSubmit={handleGenerate}
            submitLabel={also.size > 0 ? `Générer les cartes et ${also.size} autre${also.size > 1 ? 's' : ''} support${also.size > 1 ? 's' : ''}` : 'Générer les cartes'}
            titlePlaceholder="Ex. La photosynthèse"
            contentPlaceholder="Colle ici ton cours ou tes notes…"
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
            <Cards size={18} aria-hidden="true" />
            <div><strong>Des questions ciblées</strong><span>Une idée à rappeler par carte.</span></div>
          </div>
          <div className={styles.asideItem}>
            <Check size={18} aria-hidden="true" />
            <div><strong>Un deck modifiable</strong><span>Relis les réponses avant de mémoriser.</span></div>
          </div>
          <div className={styles.asideItem}>
            <FileText size={18} aria-hidden="true" />
            <div><strong>Plusieurs sources</strong><span>Texte, PDF, photo ou vidéo sous-titrée.</span></div>
          </div>
          <p className={styles.asideNote}>La langue choisie concerne le contenu généré, pas l’interface de Studra.</p>
        </aside>
      </div>

      {paywallOpen && <PaywallModal tool="flashcards" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
