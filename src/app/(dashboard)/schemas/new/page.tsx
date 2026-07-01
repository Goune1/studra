'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackSchemaGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'exam', 'timeline']

export default function NewSchemaPage() {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    trackSchemaGenerate(data.subject || data.title, 'concept')
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('schema', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('schemas', 'generation_failed')
        toast.error('Erreur lors de la génération du schéma')
        return
      }
      trackAIGenerationSuccess('schemas', Date.now() - startedAt)
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('schema', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('schemas', 'exception')
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/schemas/new" newLabel="Créer un autre schéma" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Eyebrow className="mb-2">Schémas</Eyebrow>
        <h1 className="section-h">Nouveau schéma</h1>
        <p className="lede mt-3">L&apos;IA crée un schéma interactif des relations entre les concepts.</p>
      </div>
      <div className="app-card p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `✨ Générer le schéma + ${also.size} autre${also.size > 1 ? 's' : ''}` : '✨ Générer le schéma'}
          titlePlaceholder="Ex: Les causes de la Révolution française"
          contentPlaceholder="Collez ici le contenu de votre cours..."
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
