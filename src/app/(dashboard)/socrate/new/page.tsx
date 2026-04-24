'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ContentPicker from '@/components/ContentPicker'
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>
          Mode Socrate
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
          Explique une notion à Socrate. Il t&apos;interroge par la maïeutique pour révéler ce que tu n&apos;as pas encore bien compris.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-2)' }}>
          Choisis le contenu à expliquer
        </h2>
        <ContentPicker selected={selected} onSelect={setSelected} />
      </div>

      {selected && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: '#34D39915', border: '1px solid #34D39930' }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#34D399' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            {selected.title}
          </span>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 cursor-pointer"
        style={{ background: '#34D399', color: '#fff' }}
      >
        {loading ? 'Démarrage…' : 'Démarrer la session Socrate'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-3)' }}>
        Compte comme 1 génération sur ton quota mensuel
      </p>
    </div>
  )
}
