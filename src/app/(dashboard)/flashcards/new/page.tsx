'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'

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
    try {
      const { primary, also: alsoRes } = await generateWithAlso('flashcards', [...also], data, toast.error)
      if (!primary.ok) { toast.error('Erreur lors de la génération des flashcards'); return }
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('flashcards', primary.id!, alsoRes))
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/flashcards/new" newLabel="Créer un autre deck" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nouveau deck de flashcards</h1>
        <p className="text-gray-400 mt-1">Collez votre cours et l&apos;IA génèrera des cartes de révision</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
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
