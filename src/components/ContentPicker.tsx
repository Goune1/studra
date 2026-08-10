'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Layers, AlignLeft } from 'lucide-react'
import type { ContentItem } from '@/types'
import { ImageUploadInput } from '@/components/image-upload-input'
import { useTranslations } from 'next-intl'

interface ContentPickerProps {
  selected: ContentItem | null
  onSelect: (item: ContentItem) => void
}

export default function ContentPicker({ selected, onSelect }: ContentPickerProps) {
  const [tab, setTab] = useState<'fiches' | 'decks' | 'text'>('fiches')
  const [fiches, setFiches] = useState<ContentItem[]>([])
  const [decks, setDecks] = useState<ContentItem[]>([])
  const [customText, setCustomText] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const t = useTranslations('components.contentPicker')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [fichesRes, decksRes] = await Promise.all([
        supabase.from('fiches').select('id, title, subject, source_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('decks').select('id, title, subject, source_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ])

      if (fichesRes.data) {
        setFiches(fichesRes.data.map((f) => ({ id: f.id, title: f.title, subject: f.subject, type: 'fiche' as const, source_content: f.source_content })))
      }
      if (decksRes.data) {
        setDecks(decksRes.data.map((d) => ({ id: d.id, title: d.title, subject: d.subject, type: 'deck' as const, source_content: d.source_content })))
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleCustomApply() {
    if (!customText.trim() || !customTitle.trim()) return
    onSelect({
      id: 'custom',
      title: customTitle.trim(),
      subject: null,
      type: 'fiche',
      source_content: customText.trim(),
    })
  }

  const tabs = [
    { key: 'fiches' as const, label: t('tabs.fiches'), Icon: FileText },
    { key: 'decks' as const, label: t('tabs.decks'), Icon: Layers },
    { key: 'text' as const, label: t('tabs.text'), Icon: AlignLeft },
  ]

  const items = tab === 'fiches' ? fiches : tab === 'decks' ? decks : []

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: tab === key ? 'var(--surface)' : 'transparent',
              color: tab === key ? 'var(--text-1)' : 'var(--text-2)',
              border: tab === key ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content list */}
      {tab !== 'text' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>
              {t('empty')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = selected?.id === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="text-left px-4 py-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                      border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--border)',
                      color: 'var(--text-1)',
                    }}
                  >
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    {item.subject && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                        {item.subject}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Free text tab */}
      {tab === 'text' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('titlePlaceholder')}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
            }}
          />
          <ImageUploadInput
            onTextExtracted={(extracted) =>
              setCustomText((prev) => (prev ? prev + '\n\n' + extracted : extracted))
            }
          />
          <textarea
            placeholder={t('textPlaceholder')}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
            }}
          />
          <button
            onClick={handleCustomApply}
            disabled={!customText.trim() || !customTitle.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            {t('useText')}
          </button>
        </div>
      )}
    </div>
  )
}
