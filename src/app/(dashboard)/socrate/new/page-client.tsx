'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ContentPicker from '@/components/ContentPicker'
import { ProGate } from '@/components/pro-gate'
import { createClient } from '@/lib/supabase/client'
import type { ContentItem, Profile } from '@/types'
import styles from '../socrate.module.css'

export default function SocrateNewPage() {
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data as Profile)
        setProfileLoading(false)
      })
    })
  }, [])

  async function handleStart() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/socrate/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_title: selected.title,
          source_content: selected.source_content,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Impossible de démarrer la session')
        return
      }
      router.push(`/socrate/${json.sessionId}`)
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) return null
  if (!profile) return null
  if (profile.plan !== 'pro') return <ProGate profile={profile}>{null}</ProGate>

  return (
    <div className={styles.newPage}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Mode Socrate</p>
        <h1>Teste ta compréhension.</h1>
        <p>Réponds aux questions de Socrate à partir d&apos;un contenu que tu as déjà étudié.</p>
      </header>

      <section className={styles.pickerPanel} aria-labelledby="content-title">
        <h2 id="content-title" className={styles.panelLabel}>Contenu à étudier</h2>
        <ContentPicker selected={selected} onSelect={setSelected} />
      </section>

      {selected && (
        <div className={styles.selectedContent}>
          <CheckCircle size={17} weight="fill" aria-hidden="true" />
          <span>{selected.title}</span>
        </div>
      )}

      <button onClick={handleStart} disabled={!selected || loading} className={styles.primaryButton}>
        {loading ? 'Démarrage…' : <>Commencer la session <ArrowRight size={16} aria-hidden="true" /></>}
      </button>
      <p className={styles.quotaNote}>Compte comme 1 génération sur ton quota mensuel</p>
    </div>
  )
}
