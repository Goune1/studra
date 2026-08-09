'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  Lock,
  Unlock,
  Map as MapIcon,
  Save,
  Loader2,
  Check,
} from 'lucide-react'

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved'

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitToView: () => void
  onAddNode: () => void
  onAutoLayout: () => void
  onToggleLock: () => void
  onToggleMinimap: () => void
  onSave: () => void
  locked: boolean
  status: SaveStatus
  compact?: boolean
}

function ToolbarImpl({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToView,
  onAddNode,
  onAutoLayout,
  onToggleLock,
  onToggleMinimap,
  onSave,
  locked,
  status,
  compact,
}: ToolbarProps) {
  const t = useTranslations('components.schema')
  return (
    <div
      className="schema-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 8px',
        borderRadius: 16,
        background: 'rgba(13,13,18,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 14px 40px -18px rgba(0,0,0,0.65)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <IconBtn label={t('zoomOut')} onClick={onZoomOut}><ZoomOut size={16} /></IconBtn>
      <IconBtn label={t('zoomIn')} onClick={onZoomIn}><ZoomIn size={16} /></IconBtn>
      <IconBtn label={t('zoomReset')} onClick={onResetZoom}><span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>1:1</span></IconBtn>
      <IconBtn label={t('fit')} onClick={onFitToView}><Maximize size={15} /></IconBtn>
      <Divider />
      <IconBtn label={t('addNode')} onClick={onAddNode} tone="primary"><Plus size={16} /></IconBtn>
      <IconBtn label={t('autoLayout')} onClick={onAutoLayout}><LayoutGrid size={15} /></IconBtn>
      {compact ? <IconBtn label={t('showMinimap')} onClick={onToggleMinimap}><MapIcon size={15} /></IconBtn> : null}
      <IconBtn label={locked ? t('unlock') : t('lock')} onClick={onToggleLock}>
        {locked ? <Lock size={15} /> : <Unlock size={15} />}
      </IconBtn>
      <Divider />
      <SaveBtn onSave={onSave} status={status} />
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  tone,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  tone?: 'primary'
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        minWidth: 36,
        minHeight: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        padding: '0 8px',
        border: '1px solid transparent',
        background: tone === 'primary' ? 'rgba(139,122,255,0.18)' : 'transparent',
        color: tone === 'primary' ? '#d4ccff' : 'rgba(230,231,238,0.85)',
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = tone === 'primary' ? 'rgba(139,122,255,0.28)' : 'rgba(255,255,255,0.06)'
        el.style.color = '#fff'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = tone === 'primary' ? 'rgba(139,122,255,0.18)' : 'transparent'
        el.style.color = tone === 'primary' ? '#d4ccff' : 'rgba(230,231,238,0.85)'
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
}

function SaveBtn({ onSave, status }: { onSave: () => void; status: SaveStatus }) {
  const t = useTranslations('components.schema')
  const saving = status === 'saving'
  const saved = status === 'saved'
  const dirty = status === 'dirty'
  let label = t('saved')
  let icon: React.ReactNode = <Check size={14} />
  let bg = 'rgba(34,197,94,0.15)'
  let color = '#86efac'
  if (saving) {
    label = t('saving')
    icon = <Loader2 size={14} style={{ animation: 'schema-spin 1s linear infinite' }} />
    bg = 'rgba(139,122,255,0.18)'
    color = '#d4ccff'
  } else if (dirty) {
    label = t('save')
    icon = <Save size={14} />
    bg = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    color = '#fff'
  } else if (saved) {
    label = t('saved')
  }
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving || (!dirty && saved)}
      style={{
        minHeight: 36,
        padding: '0 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.05)',
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 600,
        cursor: saving || (!dirty && saved) ? 'default' : 'pointer',
        transition: 'opacity 160ms ease',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export const Toolbar = memo(ToolbarImpl)
