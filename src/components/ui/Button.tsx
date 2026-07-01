import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'ghost'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  outline: 'btn btn-outline',
  ghost: 'btn btn-ghost',
}

/** Class helper for cases where a raw `<Link>`/`<a>`/`<button>` is needed. */
export function btnClass(variant: Variant = 'primary', className?: string) {
  return cn(VARIANT_CLASS[variant], className)
}

type ButtonAsButton = {
  variant?: Variant
  className?: string
  children: React.ReactNode
  href?: undefined
} & React.ButtonHTMLAttributes<HTMLButtonElement>

type ButtonAsLink = {
  variant?: Variant
  className?: string
  children: React.ReactNode
  href: string
}

/** Button matching the landing `.btn` system (variants primary/outline/ghost).
 *  Renders a Next `<Link>` when `href` is provided, otherwise a `<button>`. */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.href !== undefined) {
    const { variant = 'primary', className, children, href } = props
    return (
      <Link href={href} className={btnClass(variant, className)}>
        {children}
      </Link>
    )
  }

  const { variant = 'primary', className, children, href: _href, ...rest } = props
  void _href
  return (
    <button className={btnClass(variant, className)} {...rest}>
      {children}
    </button>
  )
}
