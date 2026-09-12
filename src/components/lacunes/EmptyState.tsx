import Link from 'next/link'
import { Brain } from '@phosphor-icons/react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-[11px] flex items-center justify-center mb-6 border" style={{ background: 'var(--accent-soft)', borderColor: 'rgba(31,77,63,0.2)' }}>
        <Brain size={30} style={{ color: 'var(--accent)' }} />
      </div>

      <h2
        className="text-2xl font-medium mb-3 tracking-tight"
        style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
      >
        {"Aucune donnée de révision"}
      </h2>

      <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: 'var(--ink-500)' }}>
        {"Lance une session de flashcards pour que l’IA puisse analyser tes lacunes."}
      </p>

      <Link
        href="/flashcards"
        className="px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-150  hover:opacity-90"
        style={{ background: 'var(--accent)' }}
      >
        {"Voir mes flashcards"}
      </Link>
    </div>
  )
}
