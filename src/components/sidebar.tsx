'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Layers,
  FileText,
  GitBranch,
  AlignLeft,
  ClipboardCheck,
  Target,
  Lightbulb,
  PenLine,
  Scroll,
  CalendarDays,
  Sparkles,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
  color?: string
  pro?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/flashcards',  label: 'Flashcards',   Icon: Layers,         color: '#F59E0B' },
  { href: '/fiches',      label: 'Fiches',        Icon: FileText,       color: '#3B82F6' },
  { href: '/socrate',     label: 'Socrate',       Icon: Lightbulb,      color: '#34D399' },
  { href: '/exams',       label: 'Examens',       Icon: ClipboardCheck, color: '#EF4444' },
  { href: '/planning',    label: 'Planning',      Icon: CalendarDays,   color: '#6366f1' },
  { href: '/timelines',   label: 'Frises',        Icon: AlignLeft,      color: '#8B5CF6' },
  { href: '/schemas',     label: 'Schémas',       Icon: GitBranch,      color: '#10B981' },
  { href: '/recall',      label: 'Rappel libre',  Icon: PenLine,        color: '#8B5CF6' },
  { href: '/annales',     label: 'Annales',       Icon: Scroll,         color: '#F97316' },
  { href: '/lacunes',     label: 'Lacunes',       Icon: Target },
]

const bottomItems: NavItem[] = [
  { href: '/settings', label: 'Paramètres', Icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isPro: boolean
}

export function Sidebar({ isOpen, onClose, isPro }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Déconnecté')
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    const accentColor = item.color ?? '#8B8580'

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
          active ? '' : 'hover:bg-white/2',
        )}
        style={{
          paddingLeft: '10px',
          paddingRight: '12px',
          borderLeft: `2px solid ${active ? accentColor : 'transparent'}`,
          color: active ? 'var(--text-1)' : 'var(--text-2)',
          background: active ? 'var(--border-sub)' : undefined,
        }}
      >
        <item.Icon
          size={15}
          style={{ color: active ? accentColor : undefined }}
          className={active ? '' : item.color ? '' : 'text-[#94A3B8]'}
        />
        <span className="flex-1">{item.label}</span>
        {item.pro && (
          <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded-full font-semibold">
            Pro
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full w-64 flex flex-col z-40',
        'transition-transform duration-300 ease-in-out',
        'md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-sub)' }}
    >
      {/* Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-sub)' }}>
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span style={{ color: 'var(--text-1)' }}>Studra</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/6 text-[#5A5550] hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <div className="pt-3 mt-3 border-t space-y-0.5" style={{ borderColor: 'var(--border-sub)' }}>
          {!isPro && (
            <NavLink
              item={{ href: '/upgrade', label: 'Passer Pro', Icon: Sparkles, color: '#818cf8' }}
            />
          )}
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border-sub)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/2 transition-all duration-150"
          style={{ paddingLeft: '10px', paddingRight: '12px', borderLeft: '2px solid transparent', color: 'var(--text-2)' }}
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
