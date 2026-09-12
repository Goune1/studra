'use client'

import { memo } from 'react'
import {
  ArrowsOut,
  Check,
  CircleNotch,
  FloppyDisk,
  GridFour,
  Lock,
  LockOpen,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  MapTrifold,
  Plus,
} from '@phosphor-icons/react'

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
  return (
    <div
      className="schema-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 8px',
        borderRadius: 8,
        background: 'var(--bg-elev)',
        border: '1px solid var(--ink-200)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <IconBtn label={"Zoom arrière"} onClick={onZoomOut}><MagnifyingGlassMinus size={16} /></IconBtn>
      <IconBtn label={"Zoom avant"} onClick={onZoomIn}><MagnifyingGlassPlus size={16} /></IconBtn>
      <IconBtn label={"Zoom 100%"} onClick={onResetZoom}><span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>1:1</span></IconBtn>
      <IconBtn label={"Ajuster à la vue"} onClick={onFitToView}><ArrowsOut size={15} /></IconBtn>
      <Divider />
      <IconBtn label={"Ajouter un nœud"} onClick={onAddNode} tone="primary"><Plus size={16} /></IconBtn>
      <IconBtn label={"Mise en page auto"} onClick={onAutoLayout}><GridFour size={15} /></IconBtn>
      {compact ? <IconBtn label={"Afficher la minimap"} onClick={onToggleMinimap}><MapTrifold size={15} /></IconBtn> : null}
      <IconBtn label={locked ? "Déverrouiller" : "Verrouiller"} onClick={onToggleLock}>
        {locked ? <Lock size={15} /> : <LockOpen size={15} />}
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
        borderRadius: 7,
        padding: '0 8px',
        border: '1px solid transparent',
        background: tone === 'primary' ? 'var(--accent-soft)' : 'transparent',
        color: tone === 'primary' ? 'var(--accent)' : 'var(--ink-700)',
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = 'var(--accent-soft)'
        el.style.color = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = tone === 'primary' ? 'var(--accent-soft)' : 'transparent'
        el.style.color = tone === 'primary' ? 'var(--accent)' : 'var(--ink-700)'
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 20, background: 'var(--ink-200)', margin: '0 4px' }} />
}

function SaveBtn({ onSave, status }: { onSave: () => void; status: SaveStatus }) {
  const saving = status === 'saving'
  const saved = status === 'saved'
  const dirty = status === 'dirty'
  let label = "Sauvegardé"
  let icon: React.ReactNode = <Check size={14} />
  let bg = 'var(--accent-soft)'
  let color = 'var(--accent)'
  if (saving) {
    label = "Sauvegarde…"
    icon = <CircleNotch size={14} style={{ animation: 'schema-spin 1s linear infinite' }} />
    bg = 'var(--accent-soft)'
    color = 'var(--accent)'
  } else if (dirty) {
    label = "Sauvegarder"
    icon = <FloppyDisk size={14} />
    bg = 'var(--accent)'
    color = 'var(--accent-fg)'
  } else if (saved) {
    label = "Sauvegardé"
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
        borderRadius: 7,
        border: '1px solid var(--ink-200)',
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
