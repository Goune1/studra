import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  Icon: LucideIcon
  color: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
}

export function EmptyState({ Icon, color, title, subtitle, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border"
        style={{ background: color + '10', borderColor: color + '25' }}
      >
        <Icon size={40} style={{ color }} />
      </div>
      <h2 className="text-2xl mb-3 tracking-tight" style={{ color: 'var(--ink)' }}>
        {title}
      </h2>
      <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: 'var(--ink-500)' }}>{subtitle}</p>
      <Link
        href={ctaHref}
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 hover:opacity-90"
        style={{ background: color, color: '#fff' }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
