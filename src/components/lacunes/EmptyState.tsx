import Link from 'next/link'
import { Brain } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#818CF8]/10 border border-[#818CF8]/20">
        <Brain size={40} style={{ color: '#818CF8' }} />
      </div>

      <h2
        className="text-2xl text-white mb-3 tracking-tight"
        style={{  }}
      >
        Aucune donnée de révision
      </h2>

      <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed mb-8">
        Lance une session de flashcards pour que l&apos;IA puisse analyser tes lacunes.
      </p>

      <Link
        href="/flashcards"
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:opacity-90"
        style={{ background: '#818CF8' }}
      >
        Voir mes flashcards
      </Link>
    </div>
  )
}
