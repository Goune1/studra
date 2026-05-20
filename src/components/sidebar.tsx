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
  { href: '/bac',         label: 'Notes Pronote', Icon: GraduationCap, color: '#06B6D4' },
]


interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isPro: boolean
  userName: string
  userEmail: string
  userAvatar: string | null
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
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/logo.png" alt="Studra" width={34} height={34} />
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

        {!isPro && (
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-sub)' }}>
            <NavLink
              item={{ href: '/upgrade', label: 'Passer Pro', Icon: Sparkles, color: '#818cf8' }}
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
