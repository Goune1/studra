'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'

const ALSO_OPTIONS: AlsoKey[] = ['flashcards', 'schema', 'exam', 'timeline']

export default function NewFichePage() {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    try {
      const { primary, also: alsoRes } = await generateWithAlso('fiche', [...also], data, toast.error)
      if (!primary.ok) { toast.error('Erreur lors de la génération de la fiche'); return }
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('fiche', primary.id!, alsoRes))
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/fiches/new" newLabel="Créer une autre fiche" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nouvelle fiche de révision</h1>
        <p className="text-gray-400 mt-1">Collez votre cours et l&apos;IA créera une fiche structurée</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `✨ Générer la fiche + ${also.size} autre${also.size > 1 ? 's' : ''}` : '✨ Générer la fiche'}
          titlePlaceholder="Ex: La Révolution Française"
          contentPlaceholder="Collez ici le contenu de votre cours..."
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
