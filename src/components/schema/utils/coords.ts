import type { SchemaViewport } from '@/types'

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 2.5

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
}

export function screenToCanvas(p: { x: number; y: number }, vp: SchemaViewport): { x: number; y: number } {
  return { x: (p.x - vp.x) / vp.zoom, y: (p.y - vp.y) / vp.zoom }
}

export function canvasToScreen(p: { x: number; y: number }, vp: SchemaViewport): { x: number; y: number } {
  return { x: p.x * vp.zoom + vp.x, y: p.y * vp.zoom + vp.y }
}

export function getRelativePointer(e: { clientX: number; clientY: number }, container: HTMLElement | null): { x: number; y: number } {
  if (!container) return { x: e.clientX, y: e.clientY }
  const rect = container.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
