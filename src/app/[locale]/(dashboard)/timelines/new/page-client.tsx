'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackFriseGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'exam']

export default function NewTimelinePage() {
  const t = useTranslations('dashboard.timelines')
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    setLoading(true)
    trackFriseGenerate(data.subject || data.title, data.title)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('timeline', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('frises', 'generation_failed')
        toast.error(t('toast.generationError'))
        return
      }
      trackAIGenerationSuccess('frises', Date.now() - startedAt)
      toast.success(t('toast.success'))
      setResults(buildResources('timeline', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('frises', 'exception')
      toast.error(t('toast.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/timelines/new" newLabel={t('newPage.another')} />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Eyebrow className="mb-2">{t('eyebrow')}</Eyebrow>
        <h1 className="section-h">{t('newPage.title')}</h1>
        <p className="lede mt-3">{t('newPage.description')}</p>
      </div>
      <div className="app-card p-8">
        <ContentInputForm
          onSubmit={handleGenerate}
          submitLabel={also.size > 0 ? t('newPage.submitWithExtras', {count: also.size}) : t('newPage.submit')}
          titlePlaceholder={t('newPage.titlePlaceholder')}
          contentPlaceholder={t('newPage.contentPlaceholder')}
          loading={loading}
          extras={<AlsoGenerateSection options={ALSO_OPTIONS} selected={also} onChange={toggleAlso} />}
        />
      </div>
    </div>
  )
}
