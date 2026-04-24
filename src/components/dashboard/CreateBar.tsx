'use client'

import Link from 'next/link'
import { Layers, FileText, GitBranch, AlignLeft, ClipboardCheck } from 'lucide-react'

const TOOLS = [
  { href: '/flashcards/new', label: 'Flashcards', Icon: Layers, color: '#7C7AE8' },
  { href: '/fiches/new', label: 'Fiche', Icon: FileText, color: '#5BB8BD' },
  { href: '/schemas/new', label: 'Schéma', Icon: GitBranch, color: '#E8A87C' },
  { href: '/timelines/new', label: 'Frise', Icon: AlignLeft, color: '#68C26A' },
  { href: '/exams/new', label: 'Examen', Icon: ClipboardCheck, color: '#C26868' },
]

export function CreateBar() {
  return (
    <section>
      <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-[0.14em] mb-4">
        Créer
      </p>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(({ href, label, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors group focus:outline-none"
            style={{
              borderColor: `${color}30`,
              backgroundColor: `${color}0d`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${color}1a`
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}55`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${color}0d`
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}30`
            }}
          >
            <Icon
              size={14}
              strokeWidth={1.5}
              style={{ color }}
            />
            <span className="text-xs font-medium" style={{ color }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
