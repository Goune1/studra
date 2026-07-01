import { cn } from '@/lib/utils'

/** Section label — mono uppercase tracked, with animated accent dot.
 *  Mirrors the landing `.eyebrow` component, scoped to `.app-v2`. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('eyebrow', className)}>
      <span className="eyebrow-dot" />
      <span>{children}</span>
    </div>
  )
}
