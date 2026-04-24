'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  CreditCard,
  Zap,
  Settings,
  ArrowLeft,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: Users,           label: 'Membres',         href: '/admin'              },
  { icon: CreditCard,      label: 'Paiements',       href: '/admin/paiements'    },
  { icon: Zap,             label: 'Générations IA',  href: '/admin/generations'  },
  { icon: Settings,        label: 'Paramètres',      href: '/admin/settings'     },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-12 xl:w-[220px] bg-[#111111] border-r border-[#222222] flex flex-col z-40 transition-all duration-300">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-3 xl:px-4 border-b border-[#222222] shrink-0">
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold">S</span>
        </div>
        <div className="hidden xl:flex items-center gap-2 min-w-0">
          <span className="font-semibold text-white text-sm whitespace-nowrap">Studra</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#222222] text-gray-400 font-mono border border-[#333333]">admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-1.5 xl:px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 h-9 px-2 rounded-md transition-colors group ${
                active
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon size={15} className={`shrink-0 ${active ? 'text-green-400' : ''}`} />
              <span className="hidden xl:block text-sm whitespace-nowrap">{label}</span>
              {active && (
                <span className="hidden xl:block ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-1.5 xl:px-2 pb-4 border-t border-[#222222] pt-3">
        <Link
          href="/"
          className="flex items-center gap-3 h-9 px-2 rounded-md text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a] transition-colors"
        >
          <ArrowLeft size={15} className="shrink-0" />
          <span className="hidden xl:block text-xs whitespace-nowrap">Retour au site</span>
        </Link>
      </div>
    </aside>
  )
}
