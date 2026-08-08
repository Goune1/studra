import type {Locale} from 'next-intl'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SchemaEditor from './SchemaEditorClient'
import { normalizeSchemaData } from '@/components/schema/utils/adapter'
import { formatDate } from '@/lib/utils'
import { GitBranch } from 'lucide-react'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { setRequestLocale } from 'next-intl/server'

const COLOR = '#1F4D3F'

export default async function SchemaPage({ params }: { params: Promise<{ schemaId: string; locale: string }> }) {
  const { schemaId, locale } = await params
  setRequestLocale(locale as Locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: schema } = await supabase
    .from('schemas').select('*').eq('id', schemaId).eq('user_id', user!.id).single()
  if (!schema) notFound()

  const data = normalizeSchemaData(schema.generated_data)
  const nodeCount = data.nodes.length
  const edgeCount = data.edges.length

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex items-center justify-between gap-4 px-2 pb-4 mb-2 border-b shrink-0" style={{ borderColor: 'var(--ink-200)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/schemas"
            className="text-xs transition-colors shrink-0 flex items-center gap-1" style={{ color: 'var(--ink-500)' }}>
            <GitBranch size={12} />← Mes schémas
          </Link>
          <div className="w-px h-4 shrink-0" style={{ background: 'var(--ink-200)' }} />
          <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--ink)' }}>{schema.title}</h1>
          {schema.subject && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
              style={{ background: 'var(--accent-soft)', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {schema.subject}
            </span>
          )}
          <span className="mono text-[10px] px-2 py-0.5 rounded-full shrink-0 tabular-nums hidden sm:inline"
            style={{ background: 'var(--surface-2)', color: 'var(--ink-500)', border: '1px solid var(--ink-200)' }}>
            {nodeCount} nœuds · {edgeCount} relations
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="mono text-xs tabular-nums hidden md:block" style={{ color: 'var(--ink-400)' }}>
            {formatDate(schema.created_at)}
          </span>
          <DeleteEntityButton
            table="schemas"
            id={schema.id}
            entityLabel="ce schéma"
            variant="button"
            redirectTo="/schemas"
          />
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--ink-200)', background: 'var(--bg-elev)' }}>
        <SchemaEditor schemaId={schemaId} initialData={data} />
      </div>
    </div>
  )
}
