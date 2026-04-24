import { useCallback, useState } from 'react'
import type { SchemaViewport } from '@/types'
import { clampZoom } from '../utils/coords'

const DEFAULT_VIEWPORT: SchemaViewport = { x: 0, y: 0, zoom: 1 }

export function useViewport(initial?: SchemaViewport) {
  const [vp, setVp] = useState<SchemaViewport>(initial ?? DEFAULT_VIEWPORT)

  const panBy = useCallback((dx: number, dy: number) => {
    setVp((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }, [])

  const zoomAt = useCallback((screenX: number, screenY: number, factor: number) => {
    setVp((v) => {
      const newZoom = clampZoom(v.zoom * factor)
      const ratio = newZoom / v.zoom
      const x = screenX - (screenX - v.x) * ratio
      const y = screenY - (screenY - v.y) * ratio
      return { x, y, zoom: newZoom }
    })
  }, [])

  const setZoomCentered = useCallback((containerW: number, containerH: number, zoom: number) => {
    setVp((v) => {
      const newZoom = clampZoom(zoom)
      const ratio = newZoom / v.zoom
      const cx = containerW / 2
      const cy = containerH / 2
      const x = cx - (cx - v.x) * ratio
      const y = cy - (cy - v.y) * ratio
      return { x, y, zoom: newZoom }
    })
  }, [])

  const setViewport = useCallback((next: SchemaViewport) => setVp(next), [])

  return { vp, setViewport, panBy, zoomAt, setZoomCentered }
}
