'use client'

import dynamic from 'next/dynamic'
import type { SchemaData } from '@/types'

function SchemaEditorLoading() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
      Chargement…
    </div>
  )
}

const SchemaEditor = dynamic(() => import('./SchemaEditor'), {
  ssr: false,
  loading: SchemaEditorLoading,
})

export default function SchemaEditorClient(props: { schemaId: string; initialData: SchemaData }) {
  return <SchemaEditor {...props} />
}
