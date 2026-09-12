'use client'

import { useState } from 'react'
import { FileText, Sparkle } from '@phosphor-icons/react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackFriseGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import styles from '../timelines.module.css'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'exam']

interface Props { showPaywall: boolean; price: string | null }

export default function NewTimelinePage({ showPaywall, price }: Props) {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  function toggleAlso(key: AlsoKey) {
    setAlso((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    if (showPaywall) { setPaywallOpen(true); return }
    setLoading(true)
    trackFriseGenerate(data.subject || data.title, data.title)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoResults } = await generateWithAlso('timeline', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('frises', 'generation_failed')
        toast.error('Erreur lors de la génération de la frise')
        return
      }
      trackAIGenerationSuccess('frises', Date.now() - startedAt)
      toast.success('Contenu généré avec succès')
      setResults(buildResources('timeline', primary.id!, alsoResults))
    } catch {
      trackAIGenerationError('frises', 'exception')
      toast.error('Une erreur est survenue')
    } finally { setLoading(false) }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/timelines/new" newLabel="Créer une autre frise" quiet />

  return (
    <div className={styles.createPage}>
      {showPaywall && <PaywallBanner tool="frises" />}
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Frises chronologiques</p>
          <h1>Nouvelle frise</h1>
          <p className={styles.pageSummary}>Transformez un cours, des notes ou une chronologie en une vue claire des événements.</p>
        </div>
      </header>
      <div className={styles.creationGrid}>
        <section className={styles.formPanel}>
          <ContentInputForm
            className={styles.creationForm}
            onSubmit={handleGenerate}
            submitLabel={also.size > 0 ? `Générer la frise et ${also.size} autre${also.size === 1 ? '' : 's'} ressource${also.size === 1 ? '' : 's'}` : 'Générer la frise'}
            titlePlaceholder="Ex. La Révolution française (1789–1799)"
            contentPlaceholder="Collez ici votre cours d’histoire, une chronologie ou vos notes…"
            loading={loading}
            extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} quiet />}
          />
        </section>
        <aside className={styles.creationAside}>
          <FileText size={22} weight="duotone" color="var(--accent)" aria-hidden="true" />
          <h2>Préparez votre source</h2>
          <p>Plus le contenu est précis, plus les dates, les événements et les catégories seront utiles.</p>
          <ol className={styles.creationSteps}>
            <li><span className={styles.stepNumber}>1</span><span>Indiquez un titre facile à retrouver.</span></li>
            <li><span className={styles.stepNumber}>2</span><span>Ajoutez votre cours, un PDF, une vidéo ou une photo.</span></li>
            <li><span className={styles.stepNumber}>3</span><span>Générez, puis consultez la frise structurée.</span></li>
          </ol>
          <p className={styles.pageSummary}><Sparkle size={13} weight="fill" aria-hidden="true" /> Les ressources associées sont facultatives.</p>
        </aside>
      </div>
      {paywallOpen && <PaywallModal tool="frises" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
