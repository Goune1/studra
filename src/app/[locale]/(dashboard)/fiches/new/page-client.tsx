'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackFichesGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { useTranslations } from 'next-intl'

const ALSO_OPTIONS: AlsoKey[] = ['flashcards', 'schema', 'exam', 'timeline']

export default function NewFichePage() {
  const t = useTranslations('fiches.new' as never) as (key: string, values?: Record<string, string | number>) => string
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    trackFichesGenerate(data.subject || data.title, data.title)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('fiche', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('fiches', 'generation_failed')
        toast.error(t('generationError'))
        return
      }
      trackAIGenerationSuccess('fiches', Date.now() - startedAt)
      toast.success(t('success'))
      setResults(buildResources('fiche', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('fiches', 'exception')
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/fiches/new" newLabel={t('createAnother')} />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Eyebrow className="mb-2">{t('title')}</Eyebrow>
        <h1 className="section-h">{t('newFiche')}</h1>
        <p className="lede mt-3">{t('description')}</p>
      </div>
      <div className="app-card p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? `✨ ${t('generateWithAlso', {count: also.size})}` : `✨ ${t('generate')}`}
          titlePlaceholder={t('titlePlaceholder')}
          contentPlaceholder={t('contentPlaceholder')}
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
