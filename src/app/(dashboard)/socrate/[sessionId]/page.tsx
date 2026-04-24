'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { X, Send, Lightbulb, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProGate } from '@/components/pro-gate'
import type { SocrateMessage, FeynmanDiagnosis, FeynmanSession } from '@/types'
import type { Profile } from '@/types'

const COLOR = '#34D399'

export default function SocrateSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [session, setSession] = useState<FeynmanSession | null>(null)
  const [messages, setMessages] = useState<SocrateMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosis, setDiagnosis] = useState<FeynmanDiagnosis | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!profile || profile.plan !== 'pro') return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('feynman_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!data) { router.push('/socrate/new'); return }
      setSession(data as FeynmanSession)
      setMessages(data.messages as SocrateMessage[])
      if (data.diagnosis) setDiagnosis(data.diagnosis as FeynmanDiagnosis)
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    load()
  }, [sessionId, router, profile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, diagnosis])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    const optimistic: SocrateMessage = { role: 'user', content: userText }
    setMessages((m) => [...m, optimistic])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`/api/socrate/sessions/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userText }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur'); return }
      setMessages((m) => [...m, { role: 'assistant', content: json.message }])
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  async function handleDiagnose() {
    setDiagnosing(true)
    try {
      const res = await fetch(`/api/socrate/sessions/${sessionId}/diagnose`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erreur'); return }
      setDiagnosis(json.diagnosis as FeynmanDiagnosis)
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setDiagnosing(false)
    }
  }

  if (profileLoading) return null
  if (!profile) return null
  if (profile.plan !== 'pro') return <ProGate profile={profile}>{null}</ProGate>
  if (!session && !loading) return null

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div
        className="shrink-0 h-14 flex items-center px-4 md:px-8 gap-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link
          href="/socrate/new"
          className="flex items-center gap-1.5 text-xs transition-colors shrink-0"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <X size={14} />Quitter
        </Link>
        <div className="w-px h-4 shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: COLOR + '20' }}
          >
            <Lightbulb size={12} style={{ color: COLOR }} />
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
            Socrate{session ? ` — ${session.content_title}` : ''}
          </span>
        </div>
        {!diagnosis && messages.length >= 4 && (
          <button
            onClick={handleDiagnose}
            disabled={diagnosing}
            className="ml-auto shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
            style={{ background: COLOR + '20', color: COLOR, border: `1px solid ${COLOR}40` }}
          >
            {diagnosing ? 'Analyse…' : 'Terminer & diagnostiquer'}
          </button>
        )}
        <div className="ml-auto flex gap-1 shrink-0" style={{ display: (!diagnosis && messages.length >= 4) ? 'none' : undefined }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${loading ? 'animate-bounce' : ''}`}
              style={{ background: loading ? COLOR : 'var(--border-2)', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.length === 0 && loading && (
          <div className="flex justify-start">
            <div
              className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm"
              style={{ background: COLOR + '12', border: `1px solid ${COLOR}25` }}
            >
              <div className="text-[10px] font-semibold mb-1" style={{ color: COLOR }}>Socrate</div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: COLOR + '80', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className="max-w-[75%] px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'assistant'
                  ? {
                      background: COLOR + '10',
                      border: `1px solid ${COLOR}25`,
                      color: '#D1FAE5',
                      borderRadius: '1rem 1rem 1rem 4px',
                    }
                  : {
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)',
                      borderRadius: '1rem 1rem 4px 1rem',
                    }
              }
            >
              {msg.role === 'assistant' && (
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: COLOR }}>
                  Socrate
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && (
          <div className="flex justify-start animate-fade-in">
            <div
              className="px-4 py-3"
              style={{ background: COLOR + '10', border: `1px solid ${COLOR}25`, borderRadius: '1rem 1rem 1rem 4px' }}
            >
              <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: COLOR }}>
                Socrate
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: COLOR + '80', animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis panel */}
        {diagnosis && (
          <div
            className="rounded-2xl p-5 mt-4 animate-fade-in space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={18} style={{ color: COLOR }} />
              <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>
                Diagnostic Socrate
              </h3>
              <span
                className="ml-auto text-sm font-bold px-2.5 py-0.5 rounded-lg"
                style={{ background: COLOR + '20', color: COLOR }}
              >
                {diagnosis.clarity_score}/100
              </span>
            </div>

            {diagnosis.well_explained.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: COLOR }}>
                  Bien expliqué
                </p>
                <ul className="space-y-1">
                  {diagnosis.well_explained.map((n, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-2)' }}>
                      <span style={{ color: COLOR }}>✓</span> {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diagnosis.still_unclear.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#F59E0B' }}>
                  Encore flou
                </p>
                <ul className="space-y-1">
                  {diagnosis.still_unclear.map((n, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-2)' }}>
                      <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {diagnosis.best_explanation && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: COLOR + '08', border: `1px solid ${COLOR}20` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: COLOR }}>
                  Ta meilleure explication
                </p>
                <p className="text-sm italic" style={{ color: 'var(--text-2)' }}>
                  &ldquo;{diagnosis.best_explanation}&rdquo;
                </p>
              </div>
            )}

            {diagnosis.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>
                  À revoir
                </p>
                <ul className="space-y-1">
                  {diagnosis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-2)' }}>
                      <BookOpen size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--text-3)' }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!diagnosis && (
        <div className="shrink-0 px-4 md:px-8 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              placeholder="Réponds à Socrate…"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors disabled:opacity-50"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLOR + '60')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 cursor-pointer"
              style={{ background: COLOR }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
