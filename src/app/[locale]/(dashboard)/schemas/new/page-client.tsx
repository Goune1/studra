'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackSchemaGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'flashcards', 'exam', 'timeline']

interface Props {
  showPaywall: boolean
  price: string | null
}

export default function NewSchemaPage({ showPaywall, price }: Props) {
  const t = useTranslations('dashboard.schemas')
  const [loading, setLoading] = useState(false)
  const [also, setAlso] = useState<Set<AlsoKey>>(new Set())
  const [results, setResults] = useState<GeneratedResource[] | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)

  function toggleAlso(key: AlsoKey) {
    setAlso((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleGenerate(data: { title: string; subject: string; content: string; language: string }) {
    if (showPaywall) {
      setPaywallOpen(true)
      return
    }
    setLoading(true)
    trackSchemaGenerate(data.subject || data.title, 'concept')
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('schema', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('schemas', 'generation_failed')
        toast.error(t('toast.generationError'))
        return
      }
      trackAIGenerationSuccess('schemas', Date.now() - startedAt)
      toast.success(t('toast.success'))
      setResults(buildResources('schema', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('schemas', 'exception')
      toast.error(t('toast.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/schemas/new" newLabel={t('newPage.another')} />

  return (
    <div className="max-w-3xl mx-auto">
      {showPaywall && <PaywallBanner tool="schemas" />}
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
      {paywallOpen && <PaywallModal tool="schemas" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
