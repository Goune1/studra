import type { SchemaNode } from '@/types'

export const NODE_DEFAULT_W = 180
export const NODE_DEFAULT_H = 56

export type Side = 'top' | 'bottom' | 'left' | 'right'

export interface Anchor {
  x: number
  y: number
  side: Side
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function getNodeRect(n: SchemaNode): Rect {
  return {
    x: n.x,
    y: n.y,
    w: n.width ?? NODE_DEFAULT_W,
    h: n.height ?? NODE_DEFAULT_H,
  }
}

export function getNodeCenter(n: SchemaNode): { cx: number; cy: number } {
  const r = getNodeRect(n)
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 }
}

export function rectCenter(r: Rect): { cx: number; cy: number } {
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 }
}

export function getEdgeAnchorToward(from: SchemaNode, target: { cx: number; cy: number }): Anchor {
  const r = getNodeRect(from)
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  const dx = target.cx - cx
  const dy = target.cy - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy, side: 'right' }
  const halfW = r.w / 2
  const halfH = r.h / 2
  const ax = Math.abs(dx) || 1e-6
  const ay = Math.abs(dy) || 1e-6
  const tX = halfW / ax
  const tY = halfH / ay
  if (tX < tY) {
    const x = cx + Math.sign(dx) * halfW
    const y = cy + dy * tX
    return { x, y, side: dx > 0 ? 'right' : 'left' }
  }
  const y = cy + Math.sign(dy) * halfH
  const x = cx + dx * tY
  return { x, y, side: dy > 0 ? 'bottom' : 'top' }
}

function r(n: number): string {
  // Round to 2 decimals to keep SVG paths stable across runtimes
  return (Math.round(n * 100) / 100).toFixed(2)
}

export function buildEdgePath(from: Anchor, to: Anchor): string {
  const dist = Math.hypot(to.x - from.x, to.y - from.y)
  const k = Math.max(40, Math.min(220, dist / 2.2))
  const dirVec = (s: Side): [number, number] => {
    if (s === 'right') return [1, 0]
    if (s === 'left') return [-1, 0]
    if (s === 'top') return [0, -1]
    return [0, 1]
  }
  const [fdx, fdy] = dirVec(from.side)
  const [tdx, tdy] = dirVec(to.side)
  const c1x = from.x + fdx * k
  const c1y = from.y + fdy * k
  const c2x = to.x + tdx * k
  const c2y = to.y + tdy * k
  return `M ${r(from.x)} ${r(from.y)} C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(to.x)} ${r(to.y)}`
}

export function bezierMidpoint(from: Anchor, to: Anchor): { x: number; y: number } {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}

export function unionRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of rects) {
    if (r.x < minX) minX = r.x
    if (r.y < minY) minY = r.y
    if (r.x + r.w > maxX) maxX = r.x + r.w
    if (r.y + r.h > maxY) maxY = r.y + r.h
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
