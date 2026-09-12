'use client'

import { memo, useLayoutEffect, useRef, useState } from 'react'
import type { SchemaNode, SchemaNodeColor } from '@/types'
import { NODE_DEFAULT_H, NODE_DEFAULT_W, type Side } from './utils/geometry'

interface LabelEditorProps {
  initial: string
  textColor: string
  onCommit: (value: string) => void
  onCancel: () => void
}

function LabelEditor({ initial, textColor, onCommit, onCancel }: LabelEditorProps) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onCommit(value)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: textColor,
        font: 'inherit',
        textAlign: 'center',
      }}
    />
  )
}

interface NodeProps {
  node: SchemaNode
  selected: boolean
  dragging: boolean
  showHandles: boolean
  zoom: number
  editing: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
  onCommitLabel: (id: string, label: string) => void
  onCancelLabel: (id: string) => void
  onHandlePointerDown: (e: React.PointerEvent, id: string, side: Side) => void
}

const COLOR_STYLES: Record<SchemaNodeColor, { bg: string; border: string; text: string; ring: string; shadow: string }> = {
  primary: {
    bg: 'rgba(31,77,63,0.14)',
    border: 'rgba(31,77,63,0.42)',
    text: '#173D32',
    ring: '#1F4D3F',
    shadow: 'none',
  },
  accent: {
    bg: 'rgba(31,77,63,0.08)',
    border: 'rgba(31,77,63,0.28)',
    text: '#1F4D3F',
    ring: '#1F4D3F',
    shadow: 'none',
  },
  neutral: {
    bg: '#FFFFFF',
    border: '#E4E4E7',
    text: '#18181B',
    ring: '#1F4D3F',
    shadow: 'none',
  },
}

function NodeImpl({
  node,
  selected,
  dragging,
  showHandles,
  zoom,
  editing,
  onPointerDown,
  onDoubleClick,
  onCommitLabel,
  onCancelLabel,
  onHandlePointerDown,
}: NodeProps) {
  const w = node.width ?? NODE_DEFAULT_W
  const h = node.height ?? NODE_DEFAULT_H
  const colors = COLOR_STYLES[node.color ?? 'neutral']

  return (
    <div
      data-node-id={node.id}
      aria-label={"Modifier le nœud"}
      onPointerDown={(e) => onPointerDown(e, node.id)}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onDoubleClick(node.id)
      }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: `translate3d(${node.x}px, ${node.y}px, 0)${dragging ? ' scale(1.025)' : ''}`,
        background: colors.bg,
        border: `1px solid ${selected ? colors.ring : colors.border}`,
        boxShadow: selected || dragging ? '0 0 0 2px rgba(31,77,63,0.16)' : colors.shadow,
        color: colors.text,
        borderRadius: 11,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.25,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        willChange: dragging ? 'transform' : 'auto',
        transition: dragging
          ? 'box-shadow 120ms ease'
          : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease, border-color 160ms ease',
      }}
    >
      {editing ? (
        <LabelEditor
          initial={node.label}
          textColor={colors.text}
          onCommit={(v) => {
            const cleaned = v.trim()
            if (cleaned && cleaned !== node.label) onCommitLabel(node.id, cleaned)
            else onCancelLabel(node.id)
          }}
          onCancel={() => onCancelLabel(node.id)}
        />
      ) : (
        <span style={{ pointerEvents: 'none', wordBreak: 'break-word' }}>{node.label}</span>
      )}

      {showHandles && !editing
        ? (['top', 'right', 'bottom', 'left'] as Side[]).map((side) => {
            const pos = handlePos(side, w, h)
            const size = Math.max(14, 16 / Math.max(0.6, zoom))
            return (
              <button
                key={side}
                aria-label={`Connecter depuis ${side}`}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onHandlePointerDown(e, node.id, side)
                }}
                style={{
                  position: 'absolute',
                  left: pos.x - size / 2,
                  top: pos.y - size / 2,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: '#1F4D3F',
                  border: '2px solid #FFFFFF',
                  cursor: 'crosshair',
                  padding: 0,
                  touchAction: 'none',
                }}
              />
            )
          })
        : null}
    </div>
  )
}

function handlePos(side: Side, w: number, h: number) {
  switch (side) {
    case 'top':
      return { x: w / 2, y: 0 }
    case 'bottom':
      return { x: w / 2, y: h }
    case 'left':
      return { x: 0, y: h / 2 }
    case 'right':
      return { x: w, y: h / 2 }
  }
}

export const Node = memo(NodeImpl, (prev, next) => {
  return (
    prev.node === next.node &&
    prev.selected === next.selected &&
    prev.dragging === next.dragging &&
    prev.showHandles === next.showHandles &&
    prev.editing === next.editing &&
    prev.zoom === next.zoom &&
    prev.onPointerDown === next.onPointerDown &&
    prev.onDoubleClick === next.onDoubleClick &&
    prev.onCommitLabel === next.onCommitLabel &&
    prev.onCancelLabel === next.onCancelLabel &&
    prev.onHandlePointerDown === next.onHandlePointerDown
  )
})
