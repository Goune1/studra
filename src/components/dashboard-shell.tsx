'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import Link from 'next/link'
import { Menu } from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  isPro: boolean
  userName: string
  userEmail: string
  userAvatar: string | null
}

export function DashboardShell({ children, isPro, userName, userEmail, userAvatar }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isPro={isPro}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      />

      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'var(--topbar-bg)', borderColor: 'var(--border-sub)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
          <Link href="/" className="text-base font-bold tracking-tight flex-1">
            <span style={{ color: 'var(--text-1)' }}>Studra</span>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
