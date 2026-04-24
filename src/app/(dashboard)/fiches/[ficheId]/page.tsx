import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FicheViewer } from '@/components/fiche-viewer'
import { FileText, Clock, Type, Calendar, Layers } from 'lucide-react'

const COLOR = '#3B82F6'

function wordCount(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function extractHeadings(content: string): string[] {
  return content.split('\n').filter((l) => l.startsWith('## ')).map((l) => l.replace(/^#+\s+/, '').trim())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function FichePage({ params }: { params: Promise<{ ficheId: string }> }) {
  const { ficheId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: fiche } = await supabase.from('fiches').select('*').eq('id', ficheId).single()
  if (!fiche) notFound()
  if (fiche.user_id !== user!.id && !fiche.is_public) notFound()

  const wc = wordCount(fiche.generated_content)
  const rt = Math.max(1, Math.round(wc / 200))
  const headings = extractHeadings(fiche.generated_content)

  return (
    <div className="max-w-350">
      <Link href="/fiches" className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-white transition-colors mb-6">
        <FileText size={12} />← Mes fiches
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-8">
        {/* Left: content */}
        <div className="min-w-0">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {fiche.subject && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
                  {fiche.subject}
                </span>
              )}
              <span className="text-[10px] text-[#475569] tabular-nums" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {formatDate(fiche.created_at)}
              </span>
            </div>
            <h1 className="text-4xl text-white leading-tight tracking-tight" style={{  }}>
              {fiche.title}
            </h1>
          </div>

          <div className="rounded-2xl border p-6 md:p-8"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: `4px solid ${COLOR}` }}>
            <FicheViewer content={fiche.generated_content} ficheId={ficheId} />
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="min-w-0">
          <div className="xl:sticky xl:top-8 space-y-4">
            {headings.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-3">Sommaire</p>
                <nav className="space-y-0.5">
                  {headings.map((h, i) => (
                    <a key={i} href={`#${h.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors py-1.5 rounded-lg px-2 hover:bg-white/4">
                      <span className="text-[10px] tabular-nums w-5 shrink-0"
                        style={{ color: COLOR, fontFamily: 'var(--font-mono, monospace)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="line-clamp-1 text-xs">{h}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}

            <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-3">Statistiques</p>
              <div className="space-y-3">
                {[
                  { Icon: Type, label: 'Mots', value: `~${wc}` },
                  { Icon: Clock, label: 'Lecture', value: `${rt} min` },
                  { Icon: Calendar, label: 'Créée le', value: formatDate(fiche.created_at) },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR + '12' }}>
                      <Icon size={13} style={{ color: COLOR }} />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-[#64748B]">{label}</span>
                      <span className="text-xs font-medium text-[#94A3B8] tabular-nums"
                        style={{ fontFamily: 'var(--font-mono, monospace)' }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href={`/flashcards/new?fiche=${ficheId}`}
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 group"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F59E0B15' }}>
                <Layers size={15} style={{ color: '#F59E0B' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">Créer des flashcards</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Depuis cette fiche →</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
