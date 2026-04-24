import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SchemaEditor from './SchemaEditorClient'
import { normalizeSchemaData } from '@/components/schema/utils/adapter'
import { formatDate } from '@/lib/utils'
import { GitBranch } from 'lucide-react'

const COLOR = '#10B981'

export default async function SchemaPage({ params }: { params: Promise<{ schemaId: string }> }) {
  const { schemaId } = await params
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
      <div className="flex items-center justify-between gap-4 px-2 pb-4 mb-2 border-b border-[#1E1E2E] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/schemas"
            className="text-xs text-[#475569] hover:text-white transition-colors shrink-0 flex items-center gap-1">
            <GitBranch size={12} />← Mes schémas
          </Link>
          <div className="w-px h-4 bg-[#1E1E2E] shrink-0" />
          <h1 className="text-lg text-white font-semibold truncate">{schema.title}</h1>
          {schema.subject && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
              style={{ background: COLOR + '15', color: COLOR, border: `1px solid ${COLOR}25` }}>
              {schema.subject}
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 tabular-nums hidden sm:inline"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)' }}>
            {nodeCount} nœuds · {edgeCount} relations
          </span>
        </div>
        <span className="text-xs text-[#475569] tabular-nums shrink-0 hidden md:block"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          {formatDate(schema.created_at)}
        </span>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--app-bg)' }}>
        <SchemaEditor schemaId={schemaId} initialData={data} />
      </div>
    </div>
  )
}
