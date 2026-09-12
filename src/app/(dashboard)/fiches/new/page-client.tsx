'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, FileText, ListDashes } from '@phosphor-icons/react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackFichesGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import styles from '../../flashcards/flashcards.module.css'

const ALSO_OPTIONS: AlsoKey[] = ['flashcards', 'schema', 'exam', 'timeline']

interface Props {
  showPaywall: boolean
  price: string | null
}

export default function NewFichePage({ showPaywall, price }: Props) {
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
    trackFichesGenerate(data.subject || data.title, data.title)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoResults } = await generateWithAlso('fiche', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('fiches', 'generation_failed')
        toast.error('Impossible de générer la fiche')
        return
      }
      trackAIGenerationSuccess('fiches', Date.now() - startedAt)
      toast.success('Fiche générée avec succès')
      setResults(buildResources('fiche', primary.id!, alsoResults))
    } catch {
      trackAIGenerationError('fiches', 'exception')
      toast.error('Une erreur est survenue pendant la génération')
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return (
      <GenerationResultsScreen
        resources={results}
        newPath="/fiches/new"
        newLabel="Créer une autre fiche"
        quiet
        className={styles.resultsScreen}
      />
    )
  }

  return (
    <div className={styles.createPage}>
      <Link href="/fiches" className={styles.backLink}><ArrowLeft size={14} /> Mes fiches</Link>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Nouvelle fiche</p>
          <h1>Pars de ton cours.</h1>
          <p className={styles.pageSummary}>Choisis une source, vérifie le contenu et laisse Studra construire une synthèse claire.</p>
        </div>
      </header>

      {showPaywall && <PaywallBanner tool="fiches" />}

      <div className={styles.creationGrid}>
        <section className={styles.formPanel} aria-label="Créer une fiche de révision">
          <ContentInputForm
            onSubmit={handleGenerate}
            submitLabel={also.size > 0 ? `Générer la fiche et ${also.size} autre${also.size > 1 ? 's' : ''} support${also.size > 1 ? 's' : ''}` : 'Générer la fiche'}
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
            <ListDashes size={18} aria-hidden="true" />
            <div><strong>Un plan structuré</strong><span>Les idées importantes organisées par sections.</span></div>
          </div>
          <div className={styles.asideItem}>
            <Check size={18} aria-hidden="true" />
            <div><strong>Une fiche modifiable</strong><span>Corrige et complète le contenu après génération.</span></div>
          </div>
          <div className={styles.asideItem}>
            <FileText size={18} aria-hidden="true" />
            <div><strong>Plusieurs sources</strong><span>Texte, PDF, photo ou vidéo sous-titrée.</span></div>
          </div>
          <p className={styles.asideNote}>La langue choisie concerne le contenu généré, pas l’interface de Studra.</p>
        </aside>
      </div>

      {paywallOpen && <PaywallModal tool="fiches" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
