import { cn } from '@/lib/utils'

/** Surface card — white elevation, soft border, 16px radius (`.app-card`). */
export function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={cn('app-card', className)} style={style}>
      {children}
    </div>
  )
}
