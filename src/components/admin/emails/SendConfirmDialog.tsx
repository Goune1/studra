'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface SendConfirmDialogProps {
  subject: string
  recipientCount: number
  excludedCount: number
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function SendConfirmDialog({
  subject,
  recipientCount,
  excludedCount,
  onConfirm,
  onClose,
}: SendConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const isConfirmed = confirmText === 'ENVOYER'

  async function handleSend() {
    if (!isConfirmed) return
    setSending(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#161616] p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Confirmer l'envoi</h2>
            <p className="mt-0.5 text-xs text-red-400">Cet envoi est irréversible.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 rounded-xl border border-[#222] bg-[#111] divide-y divide-[#1e1e1e]">
          <div className="flex justify-between px-4 py-3">
            <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wide">Objet</span>
            <span className="max-w-[200px] truncate text-right text-xs font-medium text-gray-300">{subject || '(sans objet)'}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wide">Destinataires</span>
            <span className="font-mono text-sm font-bold text-white">{recipientCount.toLocaleString('fr-FR')}</span>
          </div>
          {excludedCount > 0 && (
            <div className="flex justify-between px-4 py-3">
              <span className="font-mono text-[10px] text-amber-600/80 uppercase tracking-wide">Exclus (pas de consentement)</span>
              <span className="font-mono text-xs font-medium text-amber-600">{excludedCount.toLocaleString('fr-FR')}</span>
            </div>
          )}
        </div>

        {/* Confirm input */}
        <div className="mb-4">
          <label className="mb-1.5 block font-mono text-[10px] text-gray-600 uppercase tracking-wide">
            Tapez <span className="text-white">ENVOYER</span> pour confirmer
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ENVOYER"
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#111] px-3 py-2.5 font-mono text-sm text-white placeholder-gray-700 focus:border-[#444] focus:outline-none tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!isConfirmed || sending}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
