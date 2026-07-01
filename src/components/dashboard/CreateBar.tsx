import Link from 'next/link'
import { Layers, FileText, GitBranch, AlignLeft, ClipboardCheck } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'

const TOOLS = [
  { href: '/flashcards/new', label: 'Flashcards', Icon: Layers },
  { href: '/fiches/new', label: 'Fiche', Icon: FileText },
  { href: '/schemas/new', label: 'Schéma', Icon: GitBranch },
  { href: '/timelines/new', label: 'Frise', Icon: AlignLeft },
  { href: '/exams/new', label: 'Examen', Icon: ClipboardCheck },
]

export function CreateBar() {
  return (
    <section>
      <Eyebrow className="mb-4">Créer</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors focus:outline-none hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--ink-200)' }}
          >
            <Icon size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ink-700)' }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
