'use client'

import { memo } from 'react'
import { Edit3, Link2, Palette, Trash2 } from 'lucide-react'
import type { SchemaNode, SchemaNodeColor } from '@/types'

interface ContextBarProps {
  node: SchemaNode
  screenPos: { x: number; y: number }
  connecting: boolean
  onRename: () => void
  onConnect: () => void
  onCycleColor: () => void
  onDelete: () => void
}

function ContextBarImpl({ node, screenPos, connecting, onRename, onConnect, onCycleColor, onDelete }: ContextBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        transform: 'translate(-50%, -100%) translateY(-12px)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        borderRadius: 12,
        background: 'rgba(13,13,18,0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 14px 30px -12px rgba(0,0,0,0.6)',
        zIndex: 40,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Pill label="Renommer" onClick={onRename} icon={<Edit3 size={14} />} />
      <Pill
        label={connecting ? 'Annuler la connexion' : 'Connecter'}
        onClick={onConnect}
        icon={<Link2 size={14} />}
        active={connecting}
      />
      <Pill label={`Couleur : ${colorLabel(node.color)}`} onClick={onCycleColor} icon={<Palette size={14} />} />
      <Pill label="Supprimer" onClick={onDelete} icon={<Trash2 size={14} />} tone="danger" />
    </div>
  )
}

function colorLabel(c: SchemaNodeColor | undefined): string {
  if (c === 'primary') return 'Principal'
  if (c === 'accent') return 'Accent'
  return 'Neutre'
}

function Pill({
  label,
  onClick,
  icon,
  active,
  tone,
}: {
  label: string
  onClick: () => void
  icon: React.ReactNode
  active?: boolean
  tone?: 'danger'
}) {
  const baseColor = tone === 'danger' ? '#fca5a5' : active ? '#d4ccff' : 'rgba(230,231,238,0.9)'
  const baseBg = active ? 'rgba(139,122,255,0.22)' : 'transparent'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        minWidth: 44,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        padding: '0 10px',
        border: 'none',
        background: baseBg,
        color: baseColor,
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = tone === 'danger' ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)'
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.background = baseBg
      }}
    >
      {icon}
    </button>
  )
}

export const ContextBar = memo(ContextBarImpl)
