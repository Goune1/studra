'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { SchemaData } from '@/types'

function SchemaEditorLoading() {
  const t = useTranslations('dashboard.schemas')
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(230,231,238,0.55)', fontSize: 13 }}>
      {t('detail.loading' as never)}
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
