'use client'

import dynamic from 'next/dynamic'
import type { SchemaData } from '@/types'

const SchemaEditor = dynamic(() => import('./SchemaEditor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(230,231,238,0.55)',
        fontSize: 13,
      }}
    >
      Chargement du canvas…
    </div>
  ),
})

export default function SchemaEditorClient(props: { schemaId: string; initialData: SchemaData }) {
  return <SchemaEditor {...props} />
}
