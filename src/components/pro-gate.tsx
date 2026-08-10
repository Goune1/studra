import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { Profile } from '@/types'

interface ProGateProps {
  profile: Profile
  children: React.ReactNode
}

export function ProGate({ profile, children }: ProGateProps) {
  const t = useTranslations('common.proGate')
  if (profile.plan === 'pro') return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-4xl mb-6">
        🔒
      </div>
      <h2 className="text-2xl font-bold mb-3">{t('title')}</h2>
      <p className="text-gray-400 max-w-md mb-2">
        {t('description')}
      </p>
      <ul className="text-sm text-gray-500 space-y-1 mb-8 mt-4">
        <li className="flex items-center gap-2 justify-center"><span className="text-violet-400">✓</span> {t('features.generations')}</li>
        <li className="flex items-center gap-2 justify-center"><span className="text-violet-400">✓</span> {t('features.socrate')}</li>
        <li className="flex items-center gap-2 justify-center"><span className="text-violet-400">✓</span> {t('features.gaps')}</li>
      </ul>
      <Link
        href="/upgrade"
        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-semibold text-lg transition-colors"
      >
        {t('cta')}
      </Link>
    </div>
  )
}
