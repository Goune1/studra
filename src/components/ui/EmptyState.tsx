import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

/** Empty-state block — soft accent icon, title, hint, optional CTA.
 *  Replaces raw dashes / ad-hoc empty treatments. */
export function EmptyState({
  Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  Icon: LucideIcon
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div
      className="app-card flex flex-col items-center px-8 py-14 text-center"
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--accent-soft)' }}
      >
        <Icon size={24} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-medium tracking-tight" style={{ color: 'var(--ink)' }}>
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: 'var(--ink-500)' }}>
          {description}
        </p>
      )}
      {actionHref && actionLabel && (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
