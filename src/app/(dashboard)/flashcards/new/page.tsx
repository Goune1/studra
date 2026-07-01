'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackFlashcardsGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'schema', 'exam', 'timeline']

export default function NewFlashcardsPage() {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    trackFlashcardsGenerate(data.subject || data.title, 0)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('flashcards', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('flashcards', 'generation_failed')
        toast.error('Erreur lors de la génération des flashcards')
        return
      }
      trackAIGenerationSuccess('flashcards', Date.now() - startedAt)
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('flashcards', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('flashcards', 'exception')
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/flashcards/new" newLabel="Créer un autre deck" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Eyebrow className="mb-2">Flashcards</Eyebrow>
        <h1 className="section-h">Nouveau deck</h1>
        <p className="lede mt-3">Colle ton cours, l&apos;IA génère tes cartes de révision.</p>
      </div>
      <div className="app-card p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `✨ Générer les cartes + ${also.size} autre${also.size > 1 ? 's' : ''}` : '✨ Générer les cartes'}
          titlePlaceholder="Ex: Chapitre 3 - La photosynthèse"
          contentPlaceholder="Collez ici le contenu de votre cours, vos notes, ou tout texte à réviser..."
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
