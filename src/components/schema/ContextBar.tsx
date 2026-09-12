'use client'

import { memo } from 'react'
import { LinkSimple, Palette, PencilSimple, Trash } from '@phosphor-icons/react'
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
        borderRadius: 8,
        background: 'var(--bg-elev)',
        border: '1px solid var(--ink-200)',
        zIndex: 40,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Pill label={"Renommer"} onClick={onRename} icon={<PencilSimple size={14} />} />
      <Pill
        label={connecting ? "Annuler la connexion" : "Connecter"}
        onClick={onConnect}
        icon={<LinkSimple size={14} />}
        active={connecting}
      />
      <Pill label={`Couleur : ${colorLabel(node.color)}`} onClick={onCycleColor} icon={<Palette size={14} />} />
      <Pill label={"Supprimer"} onClick={onDelete} icon={<Trash size={14} />} tone="danger" />
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
  const baseColor = tone === 'danger' ? '#B4503C' : active ? 'var(--accent)' : 'var(--ink-700)'
  const baseBg = active ? 'var(--accent-soft)' : 'transparent'
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
        borderRadius: 7,
        padding: '0 10px',
        border: 'none',
        background: baseBg,
        color: baseColor,
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = tone === 'danger' ? 'rgba(180,80,60,0.10)' : 'var(--accent-soft)'
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
