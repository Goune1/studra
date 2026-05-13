'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { trackExamGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'timeline']

export default function NewExamPage() {
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    trackExamGenerate(data.subject || data.title, 'moyen')
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('exam', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('exam', 'generation_failed')
        toast.error('Erreur lors de la génération de l\'examen')
        return
      }
      trackAIGenerationSuccess('exam', Date.now() - startedAt)
      toast.success('Contenu généré avec succès !')
      setResults(buildResources('exam', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('exam', 'exception')
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/exams/new" newLabel="Créer un autre examen" />

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Génération en cours...</h2>
          <p className="text-gray-400 text-sm">L&apos;IA rédige vos questions et prépare les corrections</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nouvel examen simulé</h1>
        <p className="text-gray-400 mt-1">L&apos;IA génère 7 QCM + 3 questions ouvertes avec correction automatique</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `📝 Générer l'examen + ${also.size} autre${also.size > 1 ? 's' : ''}` : '📝 Générer l\'examen'}
          titlePlaceholder="Ex: Examen - Chapitre 3 Photosynthèse"
          contentPlaceholder="Collez ici le contenu de votre cours à évaluer..."
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
