'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ContentPicker from '@/components/ContentPicker'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ProGate } from '@/components/pro-gate'
import { createClient } from '@/lib/supabase/client'
import type { ContentItem } from '@/types'
import type { Profile } from '@/types'

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
        toast.error(json.error ?? 'Erreur lors du démarrage')
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Eyebrow className="mb-2">Socrate</Eyebrow>
        <h1 className="section-h">Mode Socrate</h1>
        <p className="lede mt-3">
          Explique une notion à Socrate. Il t&apos;interroge par la maïeutique pour révéler ce que tu n&apos;as pas encore bien compris.
        </p>
      </div>

      <div className="app-card p-6 mb-4">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink-700)' }}>
          Choisis le contenu à expliquer
        </h2>
        <ContentPicker selected={selected} onSelect={setSelected} />
      </div>

      {selected && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: 'var(--accent-soft)', border: '1px solid rgba(31,77,63,0.2)' }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {selected.title}
          </span>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Démarrage…' : 'Démarrer la session Socrate'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--ink-500)' }}>
        Compte comme 1 génération sur ton quota mensuel
      </p>
    </div>
  )
}
