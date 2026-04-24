'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

interface FicheViewerProps {
  content: string
  ficheId?: string
}

export function FicheViewer({ content, ficheId }: FicheViewerProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [saved, setSaved] = useState(content)
  const [saving, setSaving] = useState(false)
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')

  async function handleSave() {
    if (!ficheId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/fiches/${ficheId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content: draft }),
      })
      if (!res.ok) throw new Error()
      setSaved(draft)
      setEditing(false)
      toast.success('Fiche sauvegardée !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft(saved)
    setEditing(false)
  }

  const proseClasses = `prose prose-invert prose-violet max-w-none
    prose-headings:text-white prose-headings:font-bold
    prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
    prose-p:text-gray-300
    prose-strong:text-white
    prose-ul:text-gray-300
    prose-ol:text-gray-300
    prose-li:marker:text-violet-400
    prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1 prose-code:rounded
    prose-blockquote:border-violet-500 prose-blockquote:text-gray-400`

  if (editing) {
    return (
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex rounded-lg bg-white/5 border border-white/10 p-0.5 gap-0.5">
            <button
              onClick={() => setPreviewTab('edit')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                previewTab === 'edit' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              ✏️ Éditer
            </button>
            <button
              onClick={() => setPreviewTab('preview')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                previewTab === 'preview' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              👁️ Aperçu
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saving ? '⟳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Editor / Preview */}
        {previewTab === 'edit' ? (
          <div>
            <p className="text-xs text-gray-500 mb-2">Markdown supporté : **gras**, *italique*, ## Titre, - liste, etc.</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full min-h-[60vh] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors resize-y text-sm font-mono leading-relaxed"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="min-h-[60vh] rounded-xl bg-white/5 border border-white/10 px-6 py-5">
            <div className={proseClasses}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {ficheId && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:text-violet-300 text-gray-400 text-sm font-medium transition-colors"
          >
            ✏️ Modifier la fiche
          </button>
        </div>
      )}
      <div className={proseClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{saved}</ReactMarkdown>
      </div>
    </div>
  )
}
