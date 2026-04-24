'use client'

import { memo, useRef } from 'react'
import type { SchemaNode, SchemaViewport } from '@/types'
import { NODE_DEFAULT_H, NODE_DEFAULT_W, getNodeRect, unionRect } from './utils/geometry'

interface MinimapProps {
  nodes: SchemaNode[]
  viewport: SchemaViewport
  containerSize: { w: number; h: number }
  onRecenter: (canvas: { x: number; y: number }) => void
}

const MINIMAP_W = 180
const MINIMAP_H = 120
const PADDING = 160

function MinimapImpl({ nodes, viewport, containerSize, onRecenter }: MinimapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  if (containerSize.w === 0 || containerSize.h === 0) {
    return null
  }

  const rects = nodes.map(getNodeRect)
  const contentBounds = unionRect(rects) ?? { x: 0, y: 0, w: NODE_DEFAULT_W, h: NODE_DEFAULT_H }

  const viewportBounds = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    w: containerSize.w / viewport.zoom,
    h: containerSize.h / viewport.zoom,
  }

  const world = unionRect([contentBounds, viewportBounds]) ?? contentBounds
  const worldExpanded = {
    x: world.x - PADDING,
    y: world.y - PADDING,
    w: world.w + PADDING * 2,
    h: world.h + PADDING * 2,
  }
  const scale = Math.min(MINIMAP_W / worldExpanded.w, MINIMAP_H / worldExpanded.h)
  const offsetX = (MINIMAP_W - worldExpanded.w * scale) / 2 - worldExpanded.x * scale
  const offsetY = (MINIMAP_H - worldExpanded.h * scale) / 2 - worldExpanded.y * scale

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const localX = e.clientX - rect.left
    const localY = e.clientY - rect.top
    const canvasX = (localX - offsetX) / scale
    const canvasY = (localY - offsetY) / scale
    onRecenter({ x: canvasX, y: canvasY })
  }

  return (
    <svg
      ref={svgRef}
      width={MINIMAP_W}
      height={MINIMAP_H}
      onPointerDown={handlePointer}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return
        handlePointer(e)
      }}
      style={{
        display: 'block',
        borderRadius: 10,
        background: 'rgba(11,11,15,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 20px -12px rgba(0,0,0,0.5)',
        touchAction: 'none',
        cursor: 'crosshair',
      }}
    >
      {rects.map((r, i) => (
        <rect
          key={nodes[i].id}
          x={r.x * scale + offsetX}
          y={r.y * scale + offsetY}
          width={Math.max(2, r.w * scale)}
          height={Math.max(2, r.h * scale)}
          rx={1.5}
          fill={nodes[i].color === 'primary' ? '#8b7aff' : nodes[i].color === 'accent' ? '#f472b6' : 'rgba(255,255,255,0.35)'}
        />
      ))}
      <rect
        x={viewportBounds.x * scale + offsetX}
        y={viewportBounds.y * scale + offsetY}
        width={viewportBounds.w * scale}
        height={viewportBounds.h * scale}
        fill="rgba(139,122,255,0.10)"
        stroke="rgba(139,122,255,0.85)"
        strokeWidth={1}
        rx={3}
      />
    </svg>
  )
}

export const Minimap = memo(MinimapImpl)
