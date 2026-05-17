/**
 * CampaignComposer — Compositeur d'email marketing avec chat IA itératif.
 *
 * Tests manuels à effectuer avant mise en production :
 * 1. Création de campagne : soumettre un premier message → vérifie qu'un campaignId est créé et que subject/html apparaissent
 * 2. Itération : envoyer "rends le ton plus chaleureux" → vérifie que le HTML change sans recréer la campagne
 * 3. Subject éditable : modifier le subject manuellement → vérifie que le PATCH est envoyé (debounce 800ms)
 * 4. RecipientPicker mode "all" → vérifie le count affiché
 * 5. RecipientPicker mode "plan" Pro → vérifie le filtre
 * 6. RecipientPicker mode "custom_ids" : saisir un email valide et un invalide → vérifie les exclusions
 * 7. Dialog de confirmation : taper "ENVOYER" → bouton s'active ; taper autre chose → bouton inactif
 * 8. Envoi : confirmer → toast succès, statut change
 * 9. Envoi sur campagne déjà envoyée → message d'erreur approprié
 * 10. Rate limit : tenter 4 envois en 24h → erreur 429 affichée
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { EmailPreview } from './EmailPreview'
import { RecipientPicker } from './RecipientPicker'
import { SendConfirmDialog } from './SendConfirmDialog'
import type { RecipientFilter } from '@/lib/email-marketing'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CampaignComposerProps {
  initialCampaignId?: string
  initialSubject?: string
  initialHtml?: string
  initialHistory?: ChatMessage[]
  initialFilter?: RecipientFilter
}

export function CampaignComposer({
  initialCampaignId,
  initialSubject = '',
  initialHtml = '',
  initialHistory = [],
  initialFilter = { mode: 'all' },
}: CampaignComposerProps) {
  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId ?? null)
  const [subject, setSubject] = useState(initialSubject)
  const [html, setHtml] = useState(initialHtml)
  const [history, setHistory] = useState<ChatMessage[]>(initialHistory)
  const [filter, setFilter] = useState<RecipientFilter>(initialFilter)
  const [recipientCount, setRecipientCount] = useState(0)
  const [excludedCount, setExcludedCount] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Sync subject edits (debounced)
  useEffect(() => {
    if (!campaignId || !subject) return
    const t = setTimeout(async () => {
      await fetch(`/api/admin/emails/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      })
    }, 800)
    return () => clearTimeout(t)
  }, [campaignId, subject])

  async function handleSend() {
    const msg = inputValue.trim()
    if (!msg || isGenerating) return
    setInputValue('')
    setIsGenerating(true)
    setHistory((prev) => [...prev, { role: 'user', content: msg }])

    try {
      let cid = campaignId
      if (!cid) {
        const res = await fetch('/api/admin/emails/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_filter: filter }),
        })
        if (!res.ok) throw new Error('Impossible de créer la campagne')
        const data = await res.json()
        cid = data.id as string
        setCampaignId(cid)
      }

      const res = await fetch('/api/admin/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: cid, userMessage: msg }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erreur de génération')
      }

      const data = await res.json() as { subject: string; html: string }
      setSubject(data.subject)
      setHtml(data.html)
      setHistory((prev) => [...prev, { role: 'assistant', content: `Email généré avec l'objet : "${data.subject}"` }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      toast.error(msg)
      setHistory((prev) => [...prev, { role: 'assistant', content: `Erreur : ${msg}` }])
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleConfirmSend() {
    if (!campaignId) throw new Error('Campagne non créée')
    await fetch(`/api/admin/emails/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_filter: filter }),
    })
    const res = await fetch('/api/admin/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, confirm: true }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Erreur lors de l\'envoi')
    }
    const result = await res.json()
    setShowConfirm(false)
    toast.success(`Campagne envoyée — ${result.sentCount} email(s)${result.failedCount ? `, ${result.failedCount} échec(s)` : ''}`)
  }

  const canSend = !!html && !!subject && !!campaignId

  return (
    <div className="flex h-[calc(100vh-108px)] gap-4 min-h-0">

      {/* ── Colonne gauche : chat ── */}
      <div className="flex w-[340px] shrink-0 flex-col rounded-xl border border-[#222] bg-[#161616]">

        {/* Chat header */}
        <div className="flex items-center gap-2 border-b border-[#1e1e1e] px-4 py-3">
          <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Chat IA</p>
            <p className="text-[10px] text-gray-600">GPT-4o-mini</p>
          </div>
          {campaignId && (
            <span className="ml-auto font-mono text-[9px] text-gray-700 border border-[#2a2a2a] rounded px-1.5 py-0.5">
              {history.filter(m => m.role === 'user').length} turn{history.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2a2a2a]">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 pb-8">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-400/60" />
              </div>
              <p className="font-mono text-[10px] text-gray-700 text-center max-w-[200px] leading-relaxed">
                Décris l'email que tu veux envoyer pour commencer
              </p>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white text-black font-medium'
                    : 'bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                <span className="text-[10px] text-gray-600">Génération…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#1e1e1e] p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Décris l'email que tu veux envoyer (ex: annonce nouvelle fonctionnalité FSRS pour les utilisateurs Pro)"
              rows={3}
              className="flex-1 resize-none rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:border-[#444] focus:outline-none leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 font-mono text-[9px] text-gray-700">Enter pour envoyer · Shift+Enter pour saut de ligne</p>
        </div>
      </div>

      {/* ── Colonne droite : preview + config ── */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-w-0">

        {/* Subject */}
        <div className="rounded-xl border border-[#222] bg-[#161616] px-4 py-3">
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-gray-600">Objet</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email (modifiable manuellement)"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 text-sm text-gray-200 placeholder-gray-700 focus:border-[#444] focus:outline-none"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 rounded-xl border border-[#222] bg-[#161616] p-4 min-h-0">
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-wide text-gray-600">Preview</label>
          <EmailPreview subject="" html={html} height={460} />
        </div>

        {/* Recipients + Send */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#222] bg-[#161616] p-4">
            <label className="mb-3 block font-mono text-[10px] uppercase tracking-wide text-gray-600">Destinataires</label>
            <RecipientPicker value={filter} onChange={setFilter} />
            <RecipientsCountBridge filter={filter} onCounts={(c, e) => { setRecipientCount(c); setExcludedCount(e) }} />
          </div>

          <div className="rounded-xl border border-[#222] bg-[#161616] p-4 flex flex-col justify-between">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-gray-600">Envoi</label>
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                {!html
                  ? 'Génère un email via le chat IA d\'abord.'
                  : !subject
                  ? 'Ajoute un objet avant d\'envoyer.'
                  : `Prêt à envoyer à ${recipientCount.toLocaleString('fr-FR')} destinataire${recipientCount !== 1 ? 's' : ''}.`}
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSend}
              className="mt-4 w-full rounded-lg bg-white py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-25"
            >
              Envoyer la campagne →
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <SendConfirmDialog
          subject={subject}
          recipientCount={recipientCount}
          excludedCount={excludedCount}
          onConfirm={handleConfirmSend}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

function RecipientsCountBridge({
  filter,
  onCounts,
}: {
  filter: RecipientFilter
  onCounts: (count: number, excluded: number) => void
}) {
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/emails/recipients?filter=${encodeURIComponent(JSON.stringify(filter))}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => onCounts(data.count ?? 0, data.excluded ?? 0))
      .catch(() => null)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])
  return null
}
