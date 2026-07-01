import { cn } from '@/lib/utils'

/** Pill badge — mono, soft accent tint by default. Pass `color` for a
 *  functional/semantic hue (rendered as soft tint + solid text). */
export function Badge({
  children,
  color,
  className,
}: {
  children: React.ReactNode
  color?: string
  className?: string
}) {
  const accent = color ?? 'var(--accent)'
  return (
    <span
      className={cn(
        'mono inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide',
        className,
      )}
      style={{
        color: accent,
        background: color ? `${color}14` : 'var(--accent-soft)',
        border: `1px solid ${color ? `${color}33` : 'rgba(31,77,63,0.18)'}`,
      }}
    >
      {children}
    </span>
  )
}
