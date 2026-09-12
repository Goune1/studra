'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, FileText, GitBranch } from '@phosphor-icons/react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, buildResources, generateWithAlso } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackAIGenerationError, trackAIGenerationSuccess, trackSchemaGenerate } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import styles from '../schemas.module.css'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'exam', 'timeline']

interface Props { showPaywall: boolean; price: string | null }

export default function NewSchemaPage({ showPaywall, price }: Props) {
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
    if (showPaywall) { setPaywallOpen(true); return }
    setLoading(true)
    trackSchemaGenerate(data.subject || data.title, 'concept')
    const startedAt = Date.now()
    try {
      const { primary, also: alsoResults } = await generateWithAlso('schema', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('schemas', 'generation_failed')
        toast.error('Impossible de générer le schéma')
        return
      }
      trackAIGenerationSuccess('schemas', Date.now() - startedAt)
      toast.success('Schéma généré')
      setResults(buildResources('schema', primary.id!, alsoResults))
    } catch {
      trackAIGenerationError('schemas', 'exception')
      toast.error('Une erreur est survenue pendant la génération')
    } finally { setLoading(false) }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/schemas/new" newLabel="Créer un autre schéma" quiet className={styles.resultsScreen} />

  return (
    <div className={styles.createPage}>
      <Link href="/schemas" className={styles.backLink}><ArrowLeft size={14} /> Mes schémas</Link>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageContext}>Nouveau schéma</p>
          <h1>Pars de ton cours.</h1>
          <p className={styles.pageSummary}>Choisis une source, puis retrouve les notions et leurs relations dans un espace que tu peux réorganiser.</p>
        </div>
      </header>

      {showPaywall && <PaywallBanner tool="schemas" />}

      <div className={styles.creationGrid}>
        <section className={styles.formPanel} aria-label="Créer un schéma conceptuel">
          <ContentInputForm
            onSubmit={handleGenerate}
            submitLabel={also.size > 0 ? `Générer le schéma et ${also.size} autre${also.size > 1 ? 's' : ''} support${also.size > 1 ? 's' : ''}` : 'Générer le schéma'}
            titlePlaceholder="Ex. Les causes de la Révolution française"
            contentPlaceholder="Colle ici ton cours ou tes notes…"
            loading={loading}
            className={styles.creationForm}
            extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} quiet className={styles.alsoPanel} />}
          />
        </section>
        <aside className={styles.creationAside}>
          <p className={styles.asideLabel}>Ce que tu obtiens</p>
          <div className={styles.asideItem}><GitBranch size={18} aria-hidden="true" /><div><strong>Les liens essentiels</strong><span>Les concepts et relations principales de ton cours.</span></div></div>
          <div className={styles.asideItem}><Check size={18} aria-hidden="true" /><div><strong>Un espace modifiable</strong><span>Déplace, renomme ou complète chaque nœud.</span></div></div>
          <div className={styles.asideItem}><FileText size={18} aria-hidden="true" /><div><strong>Plusieurs sources</strong><span>Texte, PDF, photo ou vidéo sous-titrée.</span></div></div>
          <p className={styles.asideNote}>La langue choisie concerne le contenu généré, pas l’interface de Studra.</p>
        </aside>
      </div>
      {paywallOpen && <PaywallModal tool="schemas" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
