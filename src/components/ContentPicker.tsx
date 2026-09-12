'use client'

import { useEffect, useState } from 'react'
import { FileText, Cards, TextAlignLeft } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import type { ContentItem } from '@/types'
import { ImageUploadInput } from '@/components/image-upload-input'
import styles from './content-picker.module.css'

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

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [fichesResult, decksResult] = await Promise.all([
        supabase.from('fiches').select('id, title, subject, source_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('decks').select('id, title, subject, source_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ])
      if (fichesResult.data) setFiches(fichesResult.data.map((item) => ({ ...item, type: 'fiche' as const })))
      if (decksResult.data) setDecks(decksResult.data.map((item) => ({ ...item, type: 'deck' as const })))
      setLoading(false)
    }
    load()
  }, [])

  function handleCustomApply() {
    if (!customText.trim() || !customTitle.trim()) return
    onSelect({ id: 'custom', title: customTitle.trim(), subject: null, type: 'fiche', source_content: customText.trim() })
  }

  const tabs = [
    { key: 'fiches' as const, label: 'Mes fiches', Icon: FileText },
    { key: 'decks' as const, label: 'Mes flashcards', Icon: Cards },
    { key: 'text' as const, label: 'Texte libre', Icon: TextAlignLeft },
  ]
  const items = tab === 'fiches' ? fiches : tab === 'decks' ? decks : []

  return (
    <div className={styles.picker}>
      <div className={styles.tabs} role="tablist" aria-label="Source du contenu">
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} data-active={tab === key} className={styles.tab} onClick={() => setTab(key)}>
            <Icon size={14} /><span>{label}</span>
          </button>
        ))}
      </div>

      {tab !== 'text' && (
        loading ? (
          <div className={styles.grid}>{[1, 2, 3, 4].map((item) => <div key={item} className={styles.skeleton} />)}</div>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Aucun contenu trouvé. Crée d’abord une fiche ou un deck.</p>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <button key={item.id} type="button" data-selected={selected?.id === item.id} className={styles.item} onClick={() => onSelect(item)}>
                <strong>{item.title}</strong>
                <span>{item.subject || (item.type === 'deck' ? 'Flashcards' : 'Fiche')}</span>
              </button>
            ))}
          </div>
        )
      )}

      {tab === 'text' && (
        <div className={styles.freeText}>
          <input className={styles.input} placeholder="Titre du sujet" value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
          <ImageUploadInput onTextExtracted={(text) => setCustomText((current) => current ? `${current}\n\n${text}` : text)} />
          <textarea className={styles.textarea} placeholder="Colle ici ton cours ou tes notes…" value={customText} onChange={(event) => setCustomText(event.target.value)} rows={6} />
          <button type="button" onClick={handleCustomApply} disabled={!customText.trim() || !customTitle.trim()} className={styles.applyButton}>Utiliser ce texte</button>
        </div>
      )}
    </div>
  )
}
