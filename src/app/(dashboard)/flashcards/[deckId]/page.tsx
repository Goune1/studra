import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Layers, BookOpen } from 'lucide-react'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'

const COLOR = '#F59E0B'

export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deck } = await supabase
    .from('decks').select('*').eq('id', deckId).eq('user_id', user!.id).single()
  if (!deck) notFound()

  const { data: cards } = await supabase
    .from('flashcards').select('*').eq('deck_id', deckId).order('created_at')

  return (
    <div className="max-w-350">
      <Link href="/flashcards" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors mb-6">
        <Layers size={12} />← Mes decks
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {deck.subject && (
            <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {deck.subject}
            </span>
          )}
          <span className="text-[10px] text-[#475569] tabular-nums"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            {formatDate(deck.created_at)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <h1 className="text-4xl text-white leading-tight flex-1 tracking-tight"
            style={{  }}>
            {deck.title}
          </h1>

          <div className="flex gap-3 shrink-0">
            <DeleteEntityButton
              table="decks"
              id={deck.id}
              entityLabel="ce deck"
              variant="button"
              color={COLOR}
              redirectTo="/flashcards"
            />
            <Link href={`/flashcards/${deckId}/study`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
              style={{ background: COLOR }}>
              <BookOpen size={14} />Réviser
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <span className="text-xs px-3 py-1.5 rounded-full tabular-nums font-medium"
            style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25`, fontFamily: 'var(--font-mono, monospace)' }}>
            {cards?.length ?? 0} cartes
          </span>
        </div>
      </div>

      {/* Cards grid */}
      <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-5">
        Aperçu des cartes
      </p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards?.map((card, i) => (
          <div key={card.id} className="rounded-xl border overflow-hidden animate-fade-up"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', animationDelay: `${i * 30}ms` }}>
            {/* Question face */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-4)' }}>Q{String(i + 1).padStart(2, '0')}</span>
              <p className="text-sm text-white mt-1 leading-snug line-clamp-2">{card.question}</p>
            </div>
            {/* Answer face */}
            <div className="px-4 py-3">
              <span className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: COLOR }}>Réponse</span>
              <p className="text-xs mt-1 leading-relaxed line-clamp-3"
                style={{ color: 'var(--text-2)' }}>{card.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
