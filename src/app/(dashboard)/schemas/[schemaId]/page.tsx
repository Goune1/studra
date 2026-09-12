import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteEntityButton } from '@/components/DeleteEntityButton'
import { normalizeSchemaData } from '@/components/schema/utils/adapter'
import SchemaEditor from './SchemaEditorClient'
import styles from '../schemas.module.css'

export default async function SchemaPage({ params }: { params: Promise<{ schemaId: string }> }) {
  const { schemaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: schema } = await supabase.from('schemas').select('*').eq('id', schemaId).eq('user_id', user!.id).single()
  if (!schema) notFound()

  const data = normalizeSchemaData(schema.generated_data)
  const nodeCount = data.nodes.length
  const edgeCount = data.edges.length
  const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(schema.created_at))

  return (
    <div className={styles.schemaDetail}>
      <header className={styles.detailHeader}>
        <div className={styles.detailIdentity}>
          <Link href="/schemas" className={styles.backLink}><ArrowLeft size={14} /> Mes schémas</Link>
          <h1>{schema.title}</h1>
          {schema.subject && <span className={styles.detailSubject}>{schema.subject}</span>}
          <span className={styles.detailMeta}>{nodeCount} nœud{nodeCount > 1 ? 's' : ''} · {edgeCount} lien{edgeCount > 1 ? 's' : ''}</span>
        </div>
        <div className={styles.detailActions}>
          <time className={styles.detailDate} dateTime={schema.created_at}>{date}</time>
          <DeleteEntityButton table="schemas" id={schema.id} entityLabel="ce schéma" variant="button" redirectTo="/schemas" />
        </div>
      </header>
      <div className={styles.editorFrame}>
        <SchemaEditor schemaId={schemaId} initialData={data} />
      </div>
    </div>
  )
}
