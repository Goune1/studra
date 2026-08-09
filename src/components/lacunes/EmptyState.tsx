import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Brain } from 'lucide-react'

export function EmptyState() {
  const t = useTranslations('dashboard.lacunes')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#818CF8]/10 border border-[#818CF8]/20">
        <Brain size={40} style={{ color: '#818CF8' }} />
      </div>

      <h2
        className="text-2xl text-white mb-3 tracking-tight"
        style={{  }}
      >
        {t('emptyTitle')}
      </h2>

      <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed mb-8">
        {t('emptyDescription')}
      </p>

      <Link
        href="/flashcards"
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:opacity-90"
        style={{ background: '#818CF8' }}
      >
        {t('flashcards')}
      </Link>
    </div>
  )
}
