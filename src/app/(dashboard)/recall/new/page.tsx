'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ContentPicker from '@/components/ContentPicker'
import type { ContentItem } from '@/types'

const DURATIONS = [
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
]

export default function RecallNewPage() {
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [duration, setDuration] = useState(300)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleStart() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/recall/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_title: selected.title,
          source_content: selected.source_content,
          duration_seconds: duration,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors du démarrage')
        return
      }
      router.push(`/recall/${json.sessionId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>
          Rappel libre
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
          Écris tout ce que tu sais sur un sujet en temps limité. L&apos;IA évalue ta complétude et pointe les oublis.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-2)' }}>
          Choisis le contenu à rappeler
        </h2>
        <ContentPicker selected={selected} onSelect={setSelected} />
      </div>

      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-2)' }}>
          Durée
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className="py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: duration === d.seconds ? '#8B5CF620' : 'var(--surface-2)',
                border: duration === d.seconds ? '1.5px solid #8B5CF6' : '1px solid var(--border)',
                color: duration === d.seconds ? '#8B5CF6' : 'var(--text-2)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: '#8B5CF615', border: '1px solid #8B5CF630' }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#8B5CF6' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            {selected.title}
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-3)' }}>
            {DURATIONS.find((d) => d.seconds === duration)?.label}
          </span>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 cursor-pointer"
        style={{ background: '#8B5CF6', color: '#fff' }}
      >
        {loading ? 'Démarrage…' : 'Lancer le chronomètre'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-3)' }}>
        Compte comme 1 génération lors de l&apos;évaluation finale
      </p>
    </div>
  )
}
