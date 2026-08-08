'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
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
  GraduationCap,
  Sparkles,
  Settings,
  LogOut,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
  pro?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/flashcards',  label: 'Flashcards',   Icon: Layers },
  { href: '/fiches',      label: 'Fiches',        Icon: FileText },
  { href: '/socrate',     label: 'Socrate',       Icon: Lightbulb },
  { href: '/exams',       label: 'Examens',       Icon: ClipboardCheck },
  { href: '/planning',    label: 'Planning',      Icon: CalendarDays },
  { href: '/timelines',   label: 'Frises',        Icon: AlignLeft },
  { href: '/schemas',     label: 'Schémas',       Icon: GitBranch },
  { href: '/recall',      label: 'Rappel libre',  Icon: PenLine },
  { href: '/annales',     label: 'Annales',       Icon: Scroll },
  { href: '/lacunes',     label: 'Lacunes',       Icon: Target },
  { href: '/bac',         label: 'Notes Pronote', Icon: GraduationCap },
]


interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isPro: boolean
  userName: string
  userEmail: string
  userAvatar: string | null
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={{
        paddingLeft: '10px',
        paddingRight: '12px',
        color: active ? 'var(--ink)' : 'var(--ink-500)',
        background: active ? 'var(--accent-soft)' : undefined,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '' }}
    >
      <item.Icon
        size={15}
        style={{ color: active ? 'var(--accent)' : 'var(--ink-400)' }}
      />
      <span className="flex-1">{item.label}</span>
      {item.pro && (
        <span
          className="mono text-[9px] px-1.5 py-0.5 rounded-full font-medium tracking-wide"
          style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}
        >
          Pro
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ isOpen, onClose, isPro, userName, userEmail, userAvatar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const prevPathname = useRef(pathname)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      onClose()
      // Legitimate external sync: collapse menus in reaction to a route change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserMenuOpen(false)
    }
  }, [pathname, onClose])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Déconnecté')
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

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
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/studra-logo.png" alt="Studra" width={40} height={40} />
          <span style={{ color: 'var(--text-1)' }}>Studra</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: 'var(--ink-400)' }}
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
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {!isPro && (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-sub)' }}>
            <NavLink
              item={{ href: '/upgrade', label: 'Passer Pro', Icon: Sparkles }}
              active={isActive('/upgrade')}
            />
          </div>
        )}
      </nav>

      <div ref={userMenuRef} className="px-3 py-3 border-t" style={{ borderColor: 'var(--border-sub)' }}>
        {userMenuOpen && (
          <div
            className="mb-1 rounded-xl overflow-hidden border"
            style={{ borderColor: 'var(--border-sub)', background: 'var(--sidebar-bg)' }}
          >
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-white/4 transition-colors"
              style={{ color: 'var(--text-2)' }}
            >
              <Settings size={15} />
              Paramètres
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-white/4 transition-colors"
              style={{ color: 'var(--text-2)' }}
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        )}
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/4 transition-all duration-150"
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userName}
              width={32}
              height={32}
              className="rounded-full shrink-0 object-cover"
              style={{ width: 32, height: 32 }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              className="flex items-center justify-center rounded-full shrink-0 text-sm font-semibold"
              style={{ width: 32, height: 32, background: 'var(--border-sub)', color: 'var(--text-1)' }}
            >
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="flex-1 text-left min-w-0">
            <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
              {userName}
            </span>
            <span className="block text-xs truncate" style={{ color: 'var(--text-3)' }}>
              {userEmail}
            </span>
          </span>
          <ChevronsUpDown size={14} style={{ color: 'var(--text-3)' }} className="shrink-0" />
        </button>
      </div>
    </aside>
  )
}
