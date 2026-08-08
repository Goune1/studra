import type {Locale} from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Layers, BookOpen } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { setRequestLocale } from 'next-intl/server'

const COLOR = '#1F4D3F'

export default async function DeckPage({ params }: { params: Promise<{ deckId: string; locale: string }> }) {
  const { deckId, locale } = await params
  setRequestLocale(locale as Locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deck } = await supabase
    .from('decks').select('*').eq('id', deckId).eq('user_id', user!.id).single()
  if (!deck) notFound()

  const { data: cards } = await supabase
    .from('flashcards').select('*').eq('deck_id', deckId).order('created_at')

  return (
    <div className="max-w-350">
      <Link
        href="/flashcards"
        className="inline-flex items-center gap-1.5 text-xs mb-6 transition-colors"
        style={{ color: 'var(--ink-500)' }}
      >
        <Layers size={12} />← Mes decks
      </Link>

      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          {deck.subject && (
            <span
              className="mono text-[10px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}
            >
              {deck.subject}
            </span>
          )}
          <span
            className="mono text-[10px] tabular-nums"
            style={{ color: 'var(--ink-400)' }}
          >
            {formatDate(deck.created_at)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <Eyebrow className="mb-2">Deck</Eyebrow>
            <h1 className="section-h">{deck.title}</h1>
          </div>

          <div className="flex gap-3 shrink-0">
            <DeleteEntityButton
              table="decks"
              id={deck.id}
              entityLabel="ce deck"
              variant="button"
              color={COLOR}
              redirectTo="/flashcards"
            />
            <Link
              href={`/flashcards/${deckId}/study`}
              className="btn btn-primary"
            >
              <BookOpen size={14} />Réviser
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <span
            className="mono text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}
          >
            {cards?.length ?? 0} carte{(cards?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Cards grid */}
      <p
        className="mono text-[10px] font-semibold uppercase tracking-widest mb-5"
        style={{ color: 'var(--ink-400)' }}
      >
        Aperçu des cartes
      </p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards?.map((card, i) => (
          <div
            key={card.id}
            className="rounded-xl overflow-hidden animate-fade-up"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${i * 30}ms` }}
          >
            {/* Question face */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span
                className="mono text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--ink-400)' }}
              >
                Q{String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm mt-1 leading-snug line-clamp-2" style={{ color: 'var(--ink)' }}>
                {card.question}
              </p>
            </div>
            {/* Answer face */}
            <div className="px-4 py-3">
              <span
                className="mono text-[9px] font-bold uppercase tracking-widest"
                style={{ color: COLOR }}
              >
                Réponse
              </span>
              <p className="text-xs mt-1 leading-relaxed line-clamp-3" style={{ color: 'var(--ink-700)' }}>
                {card.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
