'use client'

import { useState } from 'react'
import { ContentInputForm } from '@/components/content-input-form'
import { AlsoGenerateSection, GenerationResultsScreen, generateWithAlso, buildResources } from '@/components/also-generate'
import type { AlsoKey, GeneratedResource } from '@/components/also-generate'
import { toast } from 'sonner'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackFlashcardsGenerate, trackAIGenerationSuccess, trackAIGenerationError } from '@/lib/analytics'
import { useTranslations } from 'next-intl'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { PaywallModal } from '@/components/paywall/PaywallModal'

const ALSO_OPTIONS: AlsoKey[] = ['fiche', 'schema', 'exam', 'timeline']

interface Props {
  showPaywall: boolean
  price: string | null
}

export default function NewFlashcardsPage({ showPaywall, price }: Props) {
  const t = useTranslations('flashcards.new')
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
    trackFlashcardsGenerate(data.subject || data.title, 0)
    const startedAt = Date.now()
    try {
      const { primary, also: alsoRes } = await generateWithAlso('flashcards', [...also], data, toast.error)
      if (!primary.ok) {
        trackAIGenerationError('flashcards', 'generation_failed')
        toast.error(t('generationError'))
        return
      }
      trackAIGenerationSuccess('flashcards', Date.now() - startedAt)
      toast.success(t('success'))
      setResults(buildResources('flashcards', primary.id!, alsoRes))
    } catch {
      trackAIGenerationError('flashcards', 'exception')
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (results) return <GenerationResultsScreen resources={results} newPath="/flashcards/new" newLabel={t('createAnother')} />

  return (
    <div className="max-w-3xl mx-auto">
      {showPaywall && <PaywallBanner tool="flashcards" />}
      <div className="mb-8">
        <Eyebrow className="mb-2">{t('title')}</Eyebrow>
        <h1 className="section-h">{t('newDeck')}</h1>
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
      {paywallOpen && <PaywallModal tool="flashcards" price={price} onClose={() => setPaywallOpen(false)} />}
    </div>
  )
}
