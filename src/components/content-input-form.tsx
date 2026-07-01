'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { ImageUploadInput } from '@/components/image-upload-input'

interface ContentInputFormProps {
  onSubmit: (data: { title: string; subject: string; content: string; language: string }) => Promise<void>
  submitLabel: string
  titlePlaceholder: string
  contentPlaceholder: string
  loading: boolean
  extras?: React.ReactNode
}

const MAX_CHARS = 100000

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

type SourceTab = 'text' | 'pdf' | 'youtube' | 'photo'

export function ContentInputForm({
  onSubmit,
  submitLabel,
  titlePlaceholder,
  contentPlaceholder,
  loading,
  extras,
}: ContentInputFormProps) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('fr')
  const [sourceTab, setSourceTab] = useState<SourceTab>('text')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/extract/pdf', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de l\'extraction du PDF')
        return
      }
      setContent(json.text)
      if (!title) setTitle(file.name.replace('.pdf', ''))
      toast.success(`PDF extrait : ${json.pages} page(s), ${json.text.length} caractères`)
    } catch {
      toast.error('Erreur lors de la lecture du PDF')
    } finally {
      setExtracting(false)
    }
  }

  async function handleYoutubeExtract() {
    if (!youtubeUrl) return
    setExtracting(true)
    try {
      const res = await fetch('/api/extract/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erreur lors de l\'extraction YouTube')
        return
      }
      setContent(json.text)
      toast.success('Transcription YouTube extraite !')
      setSourceTab('text')
    } catch {
      toast.error('Erreur lors de l\'extraction YouTube')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ title, subject, content, language })
  }

  const busy = loading || extracting

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title + Subject */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-700)' }}>Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={busy}
            className="w-full px-4 py-3 rounded-xl outline-none transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
            placeholder={titlePlaceholder}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-700)' }}>Matière</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={busy}
            className="w-full px-4 py-3 rounded-xl outline-none transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
            placeholder="Maths, Histoire, Biologie..."
          />
        </div>
      </div>

      {/* Language selector */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-700)' }}>Langue de génération</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={busy}
              onClick={() => setLanguage(lang.code)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={
                language === lang.code
                  ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                  : { background: 'transparent', border: '1px solid var(--ink-200)', color: 'var(--ink-500)' }
              }
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source type tabs */}
      <div>
        <div className="flex gap-1 mb-3 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-2)' }}>
          {([['text', 'Texte', '📝'], ['pdf', 'PDF', '📄'], ['youtube', 'YouTube', '🎬'], ['photo', 'Photo', '📷']] as const).map(([tab, label, icon]) => (
            <button
              key={tab}
              type="button"
              disabled={busy}
              onClick={() => setSourceTab(tab)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                sourceTab === tab
                  ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                  : { background: 'transparent', color: 'var(--ink-500)' }
              }
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {sourceTab === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--ink-700)' }}>Contenu du cours *</label>
              <span className="text-xs" style={{ color: content.length > MAX_CHARS * 0.9 ? '#A8762E' : 'var(--ink-500)' }}>
                {content.length.toLocaleString('fr')} / {MAX_CHARS.toLocaleString('fr')}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              required
              disabled={busy}
              rows={12}
              className="w-full px-4 py-3 rounded-xl outline-none transition-colors disabled:opacity-50 resize-none font-mono text-sm"
              style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
              placeholder={contentPlaceholder}
            />
          </div>
        )}

        {sourceTab === 'pdf' && (
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
            style={{ borderColor: 'var(--ink-200)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
            onClick={() => !busy && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
              disabled={busy}
            />
            {extracting ? (
              <div className="flex flex-col items-center gap-2" style={{ color: 'var(--accent)' }}>
                <span className="animate-spin text-2xl">⟳</span>
                <span className="text-sm">Extraction du PDF...</span>
              </div>
            ) : content && sourceTab === 'pdf' ? (
              <div style={{ color: 'var(--accent)' }}>
                <div className="text-2xl mb-1">✓</div>
                <div className="text-sm">{content.length.toLocaleString()} caractères extraits</div>
                <div className="text-xs mt-1" style={{ color: 'var(--ink-500)' }}>Cliquez pour changer de fichier</div>
              </div>
            ) : (
              <div style={{ color: 'var(--ink-500)' }}>
                <div className="text-3xl mb-2">📄</div>
                <div className="font-medium mb-1" style={{ color: 'var(--ink)' }}>Déposez votre PDF ici</div>
                <div className="text-sm">ou cliquez pour sélectionner un fichier</div>
                <div className="text-xs mt-2" style={{ color: 'var(--ink-400)' }}>Max 10 Mo · PDF uniquement</div>
              </div>
            )}
          </div>
        )}

        {sourceTab === 'photo' && (
          <ImageUploadInput
            disabled={busy}
            onTextExtracted={(extracted) => {
              setContent((prev) => prev ? prev + '\n\n' + extracted : extracted)
              setSourceTab('text')
            }}
          />
        )}

        {sourceTab === 'youtube' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ink-700)' }}>URL de la vidéo YouTube</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={busy}
                  className="flex-1 px-4 py-3 rounded-xl outline-none transition-colors disabled:opacity-50"
                  style={{ background: 'var(--bg-elev)', border: '1px solid var(--ink-200)', color: 'var(--ink)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ink-200)')}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <button
                  type="button"
                  onClick={handleYoutubeExtract}
                  disabled={busy || !youtubeUrl}
                  className="btn btn-primary disabled:cursor-not-allowed"
                >
                  {extracting ? <span className="animate-spin">⟳</span> : 'Extraire'}
                </button>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-500)' }}>
              La vidéo doit avoir des sous-titres activés (automatiques ou manuels).
            </p>
            {content && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: 'var(--accent-soft)', border: '1px solid rgba(31,77,63,0.18)', color: 'var(--accent)' }}
              >
                ✓ Transcription extraite ({content.length.toLocaleString()} caractères) — vous pouvez maintenant générer.
              </div>
            )}
          </div>
        )}
      </div>

      {extras}

      <button
        type="submit"
        disabled={busy || content.length < 50}
        className="btn btn-primary w-full"
        style={{ padding: '16px 24px', fontSize: 16, borderRadius: 12 }}
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            Génération en cours...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  )
}
