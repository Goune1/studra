'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'exam']

export default function NewTimelinePage() {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    try {
      const { primary, also: alsoRes } = await generateWithAlso('timeline', [...also], data, toast.error)
      if (!primary.ok) { toast.error('Erreur lors de la génération de la frise'); return }
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('timeline', primary.id!, alsoRes))
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/timelines/new" newLabel="Créer une autre frise" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nouvelle frise chronologique</h1>
        <p className="text-gray-400 mt-1">L&apos;IA va extraire et organiser les événements de votre cours</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `✨ Générer la frise + ${also.size} autre${also.size > 1 ? 's' : ''}` : '✨ Générer la frise'}
          titlePlaceholder="Ex: La Révolution française (1789-1799)"
          contentPlaceholder="Collez ici votre cours d'histoire, une chronologie, des notes..."
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
