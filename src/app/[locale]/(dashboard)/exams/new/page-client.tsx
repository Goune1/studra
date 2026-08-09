'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackExamGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'schema', 'timeline']

export default function NewExamPage() {
  const t = useTranslations('dashboard.exams')
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
        toast.error(t('toast.generationError'))
        return
      }
      trackAIGenerationSuccess('exam', Date.now() - startedAt)
      toast.success(t('toast.success'))
      setResults(buildResources('exam', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('exam', 'exception')
      toast.error(t('toast.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/exams/new" newLabel={t('newPage.another')} />

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--accent-soft)', borderTopColor: 'var(--accent)' }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--ink)' }}>{t('newPage.loading')}</h2>
          <p className="text-sm" style={{ color: 'var(--ink-500)' }}>{t('newPage.loadingDescription')}</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

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
