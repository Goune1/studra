'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { FreeRecallSession } from '@/types'

const COLOR = '#1F4D3F'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RecallSessionPage() {
  const t = useTranslations('dashboard.recall')
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<FreeRecallSession | null>(null)
  const [text, setText] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('free_recall_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!data) { router.push('/recall/new'); return }
      if (data.evaluation) { router.push(`/recall/${sessionId}/results`); return }
      setSession(data as FreeRecallSession)
      setTimeLeft(data.duration_seconds)
    }
    load()
  }, [sessionId, router])

  const handleEnd = useCallback(async (finalText: string) => {
    if (submitting || ended) return
    setEnded(true)
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const res = await fetch(`/api/recall/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText: finalText }),
      })
      const json = await res.json()
      if (!res.ok) {
      toast.error(json.error ?? t('evaluationError'))
        setEnded(false)
        setSubmitting(false)
        return
      }
      router.push(`/recall/${sessionId}/results`)
    } catch {
      toast.error(t('connectionError'))
      setEnded(false)
      setSubmitting(false)
    }
  }, [submitting, ended, sessionId, router, t])

  const textRef = useRef(text)
  useEffect(() => { textRef.current = text }, [text])

  useEffect(() => {
    if (!started || timeLeft === null || ended) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!)
          handleEnd(textRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, ended, handleEnd, timeLeft])

  function handleStart() {
    setStarted(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  if (!session || timeLeft === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm" style={{ color: 'var(--ink-400)' }}>{t('loading')}</div>
      </div>
    )
  }

  const progress = started ? timeLeft / session.duration_seconds : 1
  const isWarning = timeLeft <= 60 && started
  const timerColor = isWarning ? '#EF4444' : COLOR

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
      {/* Timer bar */}
      <div className="shrink-0 pt-6 px-4 md:px-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--ink-700)' }}>
              {session.content_title}
            </p>
            <p className="mono text-xs mt-0.5" style={{ color: 'var(--ink-400)' }}>
              {t('label')} — {t('writePrompt')}
            </p>
          </div>
          <div
            className="text-3xl font-mono font-bold tabular-nums"
            style={{ color: timerColor }}
            aria-live="polite"
            aria-label={t('remaining', {time: formatTime(timeLeft)})}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%`, background: timerColor }}
          />
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 py-4 px-4 md:px-0 flex flex-col">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                {t('start')} ?
              </p>
              <p className="text-sm max-w-sm" style={{ color: 'var(--ink-700)' }}>
                {t('readyDescription', {duration: formatTime(session.duration_seconds), title: session.content_title})}
              </p>
            </div>
            <button
              onClick={handleStart}
              className="btn btn-primary"
              style={{ padding: '14px 32px' }}
            >
              {t('start')}
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={ended}
            placeholder={t('writePlaceholder')}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="flex-1 w-full resize-none outline-none text-base leading-relaxed p-4 rounded-xl transition-colors"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            aria-label={t('writeAria')}
          />
        )}
      </div>

      {/* Bottom bar */}
      {started && !ended && (
        <div className="shrink-0 px-4 md:px-0 pb-6 flex items-center justify-between gap-4">
          <p className="mono text-xs" style={{ color: 'var(--ink-500)' }}>
            {text.trim().split(/\s+/).filter(Boolean).length} mots
          </p>
          <button
            onClick={() => handleEnd(text)}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? t('evaluating') : t('finish')}
          </button>
        </div>
      )}

      {ended && submitting && (
        <div className="shrink-0 px-4 md:px-0 pb-6 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
            {t('evaluating')}
          </p>
        </div>
      )}
    </div>
  )
}
