'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { StudyPlanContentItem } from '@/lib/openai'

interface SelectableItem extends StudyPlanContentItem {
  selected: boolean
}

const COLOR = '#1F4D3F'

const MASTERY_LABELS = ['', 'Très difficile', 'Difficile', 'Moyen', 'Maîtrisé', 'Très maîtrisé']
const MASTERY_COLORS = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#34D399']

const TIME_OPTIONS = [30, 45, 60, 90, 120]

export default function PlanningNewPage() {
  const [title, setTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [minutesPerDay, setMinutesPerDay] = useState(60)
  const [items, setItems] = useState<SelectableItem[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()

  // Min date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  useEffect(() => {
    async function loadContent() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [fichesRes, decksRes] = await Promise.all([
        supabase.from('fiches').select('id, title, subject').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('decks').select('id, title, subject').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      const all: SelectableItem[] = [
        ...(fichesRes.data ?? []).map((f) => ({
          id: f.id, title: f.title, type: 'fiche' as const, mastery: 3, selected: false,
        })),
        ...(decksRes.data ?? []).map((d) => ({
          id: d.id, title: d.title, type: 'deck' as const, mastery: 3, selected: false,
        })),
      ]
      setItems(all)
      setFetching(false)
    }
    loadContent()
  }, [])

  function toggleItem(id: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  function setMastery(id: string, mastery: number) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, mastery } : item))
  }

  const selected = items.filter((i) => i.selected)

  async function handleGenerate() {
    if (!title || !examDate || selected.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/generate/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          exam_date: examDate,
          available_minutes_per_day: minutesPerDay,
          contents: selected.map(({ id, title: t, type, mastery }) => ({ id, title: t, type, mastery })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur'); return }
      toast.success(`Planning créé (${json.taskCount} sessions)`)
      router.push(`/planning/${json.planId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = title && examDate && selected.length > 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Eyebrow className="mb-2">Planning</Eyebrow>
        <h1 className="section-h">Nouveau planning</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--ink-500)' }}>
          Studra génère un plan de révision jour par jour adapté à ta maîtrise et à ton temps disponible.
        </p>
      </div>

      {/* Plan info */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '60ms' }}
      >
        <div className="mb-4">
          <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Nom de l&apos;examen
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Bac de philosophie"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Date de l&apos;examen
            </label>
            <input
              type="date"
              value={examDate}
              min={minDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Temps dispo/jour
            </label>
            <div className="grid grid-cols-5 gap-1">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setMinutesPerDay(t)}
                  className="py-3 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: minutesPerDay === t ? COLOR + '15' : 'var(--surface-2)',
                    border: minutesPerDay === t ? `1.5px solid ${COLOR}` : '1px solid var(--border)',
                    color: minutesPerDay === t ? COLOR : 'var(--ink-700)',
                  }}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content selection */}
      <div
        className="rounded-2xl p-6 mb-4 animate-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '90ms' }}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          Chapitres à réviser
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--ink-500)' }}>
          Coche les contenus et évalue ta maîtrise actuelle (1 = très difficile, 5 = maîtrisé)
        </p>

        {fetching ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--ink-500)' }}>
            Aucun contenu trouvé. Crée d&apos;abord des fiches ou des decks.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                style={{
                  background: item.selected ? 'var(--accent-soft)' : 'transparent',
                  border: item.selected ? `1px solid ${COLOR}30` : '1px solid transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItem(item.id)}
                  className="rounded cursor-pointer"
                  style={{ accentColor: COLOR }}
                />
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-500)' }}>
                    {item.type === 'deck' ? 'Flashcards' : 'Fiche'}
                  </p>
                </button>

                {item.selected && (
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMastery(item.id, n)}
                        title={MASTERY_LABELS[n]}
                        className="w-6 h-6 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        style={{
                          background: item.mastery >= n ? MASTERY_COLORS[n] + '25' : 'var(--surface-2)',
                          color: item.mastery >= n ? MASTERY_COLORS[n] : 'var(--ink-400)',
                          border: item.mastery === n ? `1.5px solid ${MASTERY_COLORS[n]}` : '1px solid var(--border)',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 animate-fade-up"
          style={{ background: 'var(--accent-soft)', border: `1px solid ${COLOR}30` }}
        >
          <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
            <strong style={{ color: 'var(--ink)' }}>{selected.length} contenu{selected.length > 1 ? 's' : ''}</strong> sélectionné{selected.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="btn btn-primary w-full"
        style={{ padding: '14px', fontSize: '14px' }}
      >
        <Sparkles size={15} />
        {loading ? 'Génération du planning…' : 'Générer mon planning'}
      </button>

      <p className="mono text-xs text-center mt-3" style={{ color: 'var(--ink-400)' }}>
        Compte comme 1 génération sur ton quota mensuel
      </p>
    </div>
  )
}
