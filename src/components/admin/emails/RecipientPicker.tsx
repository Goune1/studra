'use client'

import { useEffect, useState } from 'react'
import type { RecipientFilter, RecipientInfo } from '@/lib/email-marketing'

interface RecipientPickerProps {
  value: RecipientFilter
  onChange: (filter: RecipientFilter) => void
}

export function RecipientPicker({ value, onChange }: RecipientPickerProps) {
  const [info, setInfo] = useState<RecipientInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/admin/emails/recipients?filter=${encodeURIComponent(JSON.stringify(value))}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setInfo(data))
      .catch(() => null)
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [value])

  function handleModeChange(mode: RecipientFilter['mode']) {
    if (mode === 'all') onChange({ mode: 'all' })
    else if (mode === 'plan') onChange({ mode: 'plan', plan: 'free' })
    else onChange({ mode: 'custom_ids', ids: [] })
  }

  function handleCustomInputChange(raw: string) {
    setCustomInput(raw)
    const ids = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
    onChange({ mode: 'custom_ids', ids })
  }

  const modes: { key: RecipientFilter['mode']; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'plan', label: 'Par plan' },
    { key: 'custom_ids', label: 'Liste custom' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-[#111] rounded-lg p-1 border border-[#222]">
        {modes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleModeChange(key)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              value.mode === key
                ? 'bg-[#2a2a2a] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Plan selector */}
      {value.mode === 'plan' && (
        <div className="flex gap-2">
          {(['free', 'pro'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onChange({ mode: 'plan', plan: p })}
              className={`flex-1 rounded-lg border py-2 text-xs font-mono font-medium transition-colors ${
                value.plan === p
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-[#222] bg-[#111] text-gray-600 hover:border-[#333] hover:text-gray-400'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Custom IDs textarea */}
      {value.mode === 'custom_ids' && (
        <textarea
          value={customInput}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          placeholder="IDs ou emails, séparés par virgule ou retour à la ligne…"
          rows={3}
          className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 font-mono text-xs text-gray-300 placeholder-gray-700 focus:border-[#444] focus:outline-none resize-none"
        />
      )}

      {/* Count info */}
      <div className="rounded-lg border border-[#222] bg-[#111] px-3 py-2.5">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-pulse" />
            <span className="font-mono text-[10px] text-gray-600">Calcul…</span>
          </div>
        ) : info ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{info.count.toLocaleString('fr-FR')}</span>
              <span className="font-mono text-[10px] text-gray-600">destinataire{info.count !== 1 ? 's' : ''} avec consentement</span>
            </div>
            {info.excluded > 0 && (
              <span className="font-mono text-[10px] text-amber-600">
                {info.excluded} exclu{info.excluded !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : (
          <span className="font-mono text-[10px] text-gray-700">—</span>
        )}
        {info?.sample && info.sample.length > 0 && (
          <p className="mt-1 font-mono text-[10px] text-gray-700 truncate">
            {info.sample.slice(0, 4).map((s) => s.email).join(', ')}
            {info.count > 4 ? ` +${info.count - 4}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}
