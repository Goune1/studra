'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Timer } from 'lucide-react'
import ContentPicker from '@/components/ContentPicker'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { ContentItem } from '@/types'

const COLOR = '#1F4D3F'

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
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Eyebrow className="mb-2">Rappel libre</Eyebrow>
        <h1 className="section-h">Lance une session</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-500)' }}>
          Écris tout ce que tu sais sur un sujet en temps limité. L&apos;IA évalue ta complétude et pointe les oublis.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          Contenu à rappeler
        </h2>
        <ContentPicker selected={selected} onSelect={setSelected} />
      </div>

      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          Durée
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              onClick={() => setDuration(d.seconds)}
              className="py-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{
                background: duration === d.seconds ? COLOR + '15' : 'var(--surface-2)',
                border: duration === d.seconds ? `1.5px solid ${COLOR}` : '1px solid var(--border)',
                color: duration === d.seconds ? COLOR : 'var(--ink-700)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 animate-fade-up"
          style={{ background: 'var(--accent-soft)', border: `1px solid ${COLOR}30`, animationDelay: '110ms' }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR }} />
          <span className="text-sm font-medium flex-1" style={{ color: 'var(--ink)' }}>
            {selected.title}
          </span>
          <span className="mono text-xs" style={{ color: 'var(--ink-500)' }}>
            {DURATIONS.find((d) => d.seconds === duration)?.label}
          </span>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="btn btn-primary w-full"
        style={{ padding: '14px', fontSize: '14px' }}
      >
        <Timer size={15} />
        {loading ? 'Démarrage…' : 'Lancer le chronomètre'}
      </button>

      <p className="mono text-xs text-center mt-3" style={{ color: 'var(--ink-400)' }}>
        Compte comme 1 génération lors de l&apos;évaluation finale
      </p>
    </div>
  )
}
