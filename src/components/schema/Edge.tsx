'use client'

import { memo } from 'react'
import type { Anchor } from './utils/geometry'
import { bezierMidpoint, buildEdgePath } from './utils/geometry'

interface EdgeProps {
  id: string
  from: Anchor
  to: Anchor
  label?: string
  highlighted?: boolean
  onLabelDoubleClick?: (id: string) => void
}

function EdgeImpl({ id, from, to, label, highlighted, onLabelDoubleClick }: EdgeProps) {
  const path = buildEdgePath(from, to)
  const stroke = highlighted ? 'rgba(139, 122, 255, 0.95)' : 'rgba(255,255,255,0.22)'
  const strokeWidth = highlighted ? 1.8 : 1.2
  const mid = bezierMidpoint(from, to)
  return (
    <g data-edge-id={id} className="schema-edge">
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        markerEnd={highlighted ? 'url(#schema-arrow-active)' : 'url(#schema-arrow)'}
        style={{ transition: 'stroke 160ms ease, stroke-width 160ms ease' }}
      />
      {label ? (
        <g
          transform={`translate(${mid.x} ${mid.y})`}
          onDoubleClick={(e) => {
            e.stopPropagation()
            onLabelDoubleClick?.(id)
          }}
          style={{ cursor: onLabelDoubleClick ? 'text' : 'default' }}
        >
          <rect
            x={-(label.length * 3.4 + 8)}
            y={-9}
            width={label.length * 6.8 + 16}
            height={18}
            rx={6}
            fill="rgba(11,11,15,0.85)"
            stroke="rgba(255,255,255,0.08)"
          />
          <text
            x={0}
            y={4}
            fontSize={11}
            fontWeight={500}
            textAnchor="middle"
            fill={highlighted ? '#c7bdff' : '#9ca3af'}
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  )
}

export const Edge = memo(EdgeImpl)
