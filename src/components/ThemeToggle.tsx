'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:scale-105"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-3)',
      }}
    >
      <span
        className="transition-all duration-300"
        style={{ opacity: theme === 'light' ? 1 : 0.35, color: '#F59E0B' }}
      >
        <Sun size={13} />
      </span>
      {/* pill track */}
      <div
        className="relative w-7 h-3.5 rounded-full transition-colors duration-300"
        style={{ background: theme === 'dark' ? '#1E1E2E' : '#F59E0B30' }}
      >
        <div
          className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-300"
          style={{
            background: theme === 'dark' ? '#475569' : '#F59E0B',
            left: theme === 'dark' ? 2 : 'calc(100% - 12px)',
          }}
        />
      </div>
      <span
        className="transition-all duration-300"
        style={{ opacity: theme === 'dark' ? 1 : 0.35, color: '#94A3B8' }}
      >
        <Moon size={13} />
      </span>
    </button>
  )
}
