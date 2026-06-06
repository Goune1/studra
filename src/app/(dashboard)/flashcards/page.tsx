'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Layers, Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { trackFlashcardsOpen } from '@/lib/analytics'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#F59E0B'

interface Deck {
  id: string
  title: string
  subject: string | null
  card_count: number
  created_at: string
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<string | null>(null)
  const [sort, setSort] = useState<'recent' | 'alpha' | 'cards'>('recent')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      trackFlashcardsOpen(user?.id ?? 'anonymous')
      const { data } = await supabase
        .from('decks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
      if (data) setDecks(data as Deck[])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subjects = useMemo(() => {
    const s = new Set(decks.map((d) => d.subject).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [decks])

  const filtered = useMemo(() => {
    let d = decks
    if (search) d = d.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()))
    if (subject) d = d.filter((x) => x.subject === subject)
    if (sort === 'alpha') d = [...d].sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'cards') d = [...d].sort((a, b) => b.card_count - a.card_count)
    return d
  }, [decks, search, subject, sort])

  return (
    <div className="max-w-350">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} style={{ color: COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: COLOR }}>Flashcards</span>
          </div>
          <h1 className="text-4xl text-white tracking-tight" style={{  }}>
            Mes decks
          </h1>
        </div>
        <Link href="/flashcards/new"
          className="sm:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 shrink-0"
          style={{ background: COLOR }}>
          <Plus size={14} />Nouveau deck
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un deck…"
            className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#E2E8F0' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '50')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
          <option value="recent">Plus récent</option>
          <option value="alpha">Alphabétique</option>
          <option value="cards">Nb de cartes</option>
        </select>
      </div>

      {/* Subject chips */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setSubject(null)}
            className="text-[10px] px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{
              background: subject === null ? COLOR + '20' : 'var(--surface)',
              color: subject === null ? COLOR : 'var(--text-4)',
              border: `1px solid ${subject === null ? COLOR + '40' : 'var(--border)'}`,
            }}>
            Tous
          </button>
          {subjects.map((s) => (
            <button key={s} onClick={() => setSubject(subject === s ? null : s)}
              className="text-[10px] px-3 py-1.5 rounded-full font-semibold transition-all"
              style={{
                background: subject === s ? COLOR + '20' : 'var(--surface)',
                color: subject === s ? COLOR : 'var(--text-4)',
                border: `1px solid ${subject === s ? COLOR + '40' : 'var(--border)'}`,
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: COLOR + '20', borderTopColor: COLOR }} />
        </div>
      ) : filtered.length === 0 && decks.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: COLOR + '15' }}>
            <Layers size={24} style={{ color: COLOR }} />
          </div>
          <h2 className="text-lg text-white mb-2" style={{  }}>
            Aucun deck pour l&apos;instant
          </h2>
          <p className="text-sm text-[#475569] mb-6">Créez votre premier deck à partir de vos cours</p>
          <Link href="/flashcards/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: COLOR }}>
            <Plus size={14} />Créer un deck
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm text-[#64748B]">Aucun résultat</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((deck, i) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              index={i}
              onDeleted={(id) => setDecks((prev) => prev.filter((d) => d.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DeckCard({ deck, index, onDeleted }: { deck: Deck; index: number; onDeleted: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group/card animate-fade-up"
      style={{ animationDelay: `${index * 40}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-3 right-3 z-10 w-0 overflow-hidden group-hover/card:w-8 transition-[width] duration-200">
        <DeleteEntityButton
          table="decks"
          id={deck.id}
          entityLabel="ce deck"
          variant="icon"
          color={COLOR}
          onDeleted={onDeleted}
        />
      </div>
      <Link href={`/flashcards/${deck.id}`}
        className="block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${hovered ? COLOR + '40' : 'var(--border)'}`,
        }}>
      <div className="flex items-start justify-between gap-3 mb-4 transition-[padding] duration-200 group-hover/card:pr-9">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: COLOR + '15' }}>
          <Layers size={18} style={{ color: COLOR }} />
        </div>
        {deck.subject && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
            {deck.subject}
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-snug"
        style={{  }}>
        {deck.title}
      </h3>

      <div className="flex items-center justify-between mt-3 pt-3 border-t"
        style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] tabular-nums font-medium"
          style={{ color: COLOR, fontFamily: 'var(--font-mono, monospace)' }}>
          {deck.card_count} cartes
        </span>
        <span className="text-[10px] tabular-nums"
          style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono, monospace)' }}>
          {formatDate(deck.created_at)}
        </span>
      </div>
      </Link>
    </div>
  )
}
