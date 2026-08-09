'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Lightbulb, GitMerge, Globe, BookOpen, ListOrdered, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const COLOR = '#1F4D3F'

type ExplainStyle = 'analogy' | 'example' | 'simple' | 'stepbystep'

interface FlashCardProps {
  question: string
  answer: string
  /** Notified whenever the card is flipped */
  onFlipChange?: (flipped: boolean) => void
  current: number
  total: number
}

export function FlashCard({ question, answer, onFlipChange, current, total }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const t = useTranslations('flashcards.study')
  const explainStyles = [
    { key: 'analogy' as const, label: t('styles.analogy'), Icon: GitMerge },
    { key: 'example' as const, label: t('styles.example'), Icon: Globe },
    { key: 'simple' as const, label: t('styles.simple'), Icon: BookOpen },
    { key: 'stepbystep' as const, label: t('styles.stepbystep'), Icon: ListOrdered },
  ]

  function handleFlip() {
    const next = !flipped
    setFlipped(next)
    onFlipChange?.(next)
  }

  function resetCard() {
    setFlipped(false)
    setExplanation(null)
    setShowExplain(false)
    onFlipChange?.(false)
  }

  // Called by the parent (study page) to reset between cards
  // We expose this pattern via a key reset instead — parent remounts with new key

  async function handleExplain(style: ExplainStyle) {
    setExplaining(true)
    setShowExplain(false)
    try {
      const res = await fetch('/api/generate/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, style }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? t('error')); return }
      setExplanation(json.explanation)
    } catch {
      toast.error(t('generationError'))
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto">
      {/* Progress */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${(current / total) * 100}%`, background: COLOR }} />
        </div>
        <span className="text-[10px] tabular-nums shrink-0"
          style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono, monospace)' }}>
          {current}/{total}
        </span>
      </div>

      {/* Card */}
      <div className={`card-flip w-full cursor-pointer select-none${flipped ? ' flipped' : ''}`}
        style={{ height: 280 }}
        onClick={handleFlip}>
        <div className="card-flip-inner">
          {/* Front */}
          <div className="card-front rounded-2xl flex flex-col items-center justify-center p-8 gap-4"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <span className="mono text-[9px] font-medium uppercase tracking-widest"
              style={{ color: 'var(--ink-400)' }}>{t('question')}</span>
            <p className="text-xl text-center leading-snug" style={{ color: 'var(--ink)' }}>
              {question}
            </p>
            <span className="text-[10px] mt-2" style={{ color: 'var(--ink-400)' }}>
              {t('spaceToFlip')}
            </span>
          </div>

          {/* Back */}
          <div className="card-back rounded-2xl flex flex-col items-center justify-center p-8 gap-4"
            style={{ background: 'var(--bg-elev)', border: `1px solid ${COLOR}40`, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <span className="mono text-[9px] font-medium uppercase tracking-widest" style={{ color: COLOR }}>
              {t('answer')}
            </span>
            {explanation ? (
              <div className="text-center space-y-2">
                <p className="text-sm line-through opacity-40" style={{ color: 'var(--ink)' }}>{answer}</p>
                <p className="text-base leading-relaxed italic" style={{ color: 'var(--ink)' }}>{explanation}</p>
                <button onClick={(e) => { e.stopPropagation(); setExplanation(null) }}
                  className="flex items-center gap-1 text-[10px] mx-auto transition-opacity hover:opacity-70"
                  style={{ color: COLOR }}>
                  <X size={10} />{t('originalAnswer')}
                </button>
              </div>
            ) : (
              <p className="text-xl text-center leading-snug" style={{ color: 'var(--ink)' }}>{answer}</p>
            )}
          </div>
        </div>
      </div>

      {/* Explain button — only shown when flipped */}
      {flipped && (
        <div className="w-full animate-fade-in">
          {showExplain ? (
            <div className="rounded-xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-center mb-2.5"
                style={{ color: 'var(--text-4)' }}>{t('explanationStyle')}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {explainStyles.map(({ key, label, Icon }) => (
                  <button key={key} onClick={() => handleExplain(key)} disabled={explaining}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-left transition-all hover:-translate-y-0.5 disabled:opacity-40"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    <Icon size={12} style={{ color: COLOR, flexShrink: 0 }} />
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowExplain(false)}
                className="mt-2 w-full text-[10px] text-center transition-colors hover:opacity-60"
                style={{ color: 'var(--text-4)' }}>
                {t('cancel')}
              </button>
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setShowExplain(true) }}
              disabled={explaining}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              {explaining ? (
                <>
                  <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: COLOR }} />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Lightbulb size={12} style={{ color: COLOR }} />
                  {t('explainDifferently')}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {!flipped && (
        <button onClick={handleFlip}
          className="px-6 py-2.5 rounded-xl text-xs transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          {t('flip')}
        </button>
      )}
    </div>
  )
}
