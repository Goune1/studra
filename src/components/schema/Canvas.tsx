'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SchemaEdge, SchemaNode, SchemaViewport } from '@/types'
import { Edge } from './Edge'
import { Node } from './Node'
import {
  NODE_DEFAULT_H,
  NODE_DEFAULT_W,
  type Anchor,
  getEdgeAnchorToward,
  getNodeCenter,
  getNodeRect,
  pointInRect,
} from './utils/geometry'
import { ZOOM_MAX, ZOOM_MIN, clampZoom, getRelativePointer, screenToCanvas } from './utils/coords'
import { startPointerDrag } from './hooks/usePointerDrag'

export interface CanvasHandle {
  getContainer: () => HTMLDivElement | null
}

interface CanvasProps {
  nodes: SchemaNode[]
  edges: SchemaEdge[]
  viewport: SchemaViewport
  selectedIds: ReadonlySet<string>
  editingId: string | null
  locked: boolean
  connectionMode: boolean
  onViewportChange: (vp: SchemaViewport) => void
  onContainerResize?: (size: { w: number; h: number }) => void
  onSelectNodes: (ids: string[], mode: 'replace' | 'toggle' | 'add') => void
  onClearSelection: () => void
  onMoveNodes: (ids: string[], dx: number, dy: number) => void
  onCommitPositions: () => void
  onRequestEdit: (id: string) => void
  onCommitLabel: (id: string, label: string) => void
  onCancelEdit: (id: string) => void
  onAddEdge: (edge: SchemaEdge) => void
  onRenameEdge: (id: string, label: string | null) => void
  onCanvasDoubleClick: (canvasPoint: { x: number; y: number }) => void
  onExitConnectionMode: () => void
}

interface PointerEventLike {
  clientX: number
  clientY: number
}

export function Canvas({
  nodes,
  edges,
  viewport,
  selectedIds,
  editingId,
  locked,
  connectionMode,
  onViewportChange,
  onContainerResize,
  onSelectNodes,
  onClearSelection,
  onMoveNodes,
  onCommitPositions,
  onRequestEdit,
  onCommitLabel,
  onCancelEdit,
  onAddEdge,
  onRenameEdge,
  onCanvasDoubleClick,
  onExitConnectionMode,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [draggingIds, setDraggingIds] = useState<string[] | null>(null)
  const [connectDraft, setConnectDraft] = useState<{ sourceId: string; cursor: { x: number; y: number } } | null>(null)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchRef = useRef<{ dist: number; zoom: number; midScreen: { x: number; y: number } } | null>(null)
  // Always-fresh viewport — lets wheel/drag handlers avoid stale closures without re-registering.
  // Synced in an effect (not during render) so we don't read/write a ref while rendering.
  const viewportRef = useRef(viewport)
  useEffect(() => {
    viewportRef.current = viewport
  })

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      const size = { w: rect.width, h: rect.height }
      setContainerSize(size)
      onContainerResize?.(size)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onContainerResize])

  const nodeById = useMemo(() => {
    const m = new Map<string, SchemaNode>()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  // Wheel zoom — stable listener (registered once); reads viewport via viewportRef
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const vp = viewportRef.current
      const rect = el!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const factor = Math.pow(1.0015, -e.deltaY)
      const newZoom = clampZoom(vp.zoom * factor)
      const ratio = newZoom / vp.zoom
      if (ratio === 1) return
      const x = sx - (sx - vp.x) * ratio
      const y = sy - (sy - vp.y) * ratio
      onViewportChange({ x, y, zoom: newZoom })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onViewportChange])

  const beginNodeDrag = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      if (locked) return
      if (editingId === nodeId) return
      if (e.button !== undefined && e.button !== 0) return

      const isShift = e.shiftKey
      if (isShift) {
        onSelectNodes([nodeId], 'toggle')
      } else if (!selectedIds.has(nodeId)) {
        onSelectNodes([nodeId], 'replace')
      }

      const movingIds = (selectedIds.has(nodeId) && !isShift) || isShift
        ? [...selectedIds, nodeId].filter((v, i, a) => a.indexOf(v) === i)
        : [nodeId]

      let pendingDx = 0
      let pendingDy = 0
      let rafId: number | null = null
      let committed = false

      startPointerDrag(e, {
        onMove: (_, __, delta) => {
          if (delta.dx === 0 && delta.dy === 0) return
          // Accumulate sub-frame deltas; dispatch once per animation frame
          pendingDx += delta.dx / viewportRef.current.zoom
          pendingDy += delta.dy / viewportRef.current.zoom
          if (rafId !== null) return
          rafId = requestAnimationFrame(() => {
            rafId = null
            if (pendingDx === 0 && pendingDy === 0) return
            onMoveNodes(movingIds, pendingDx, pendingDy)
            setDraggingIds(movingIds)
            pendingDx = 0
            pendingDy = 0
            committed = true
          })
        },
        onEnd: () => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId)
            rafId = null
            if (pendingDx !== 0 || pendingDy !== 0) {
              onMoveNodes(movingIds, pendingDx, pendingDy)
              committed = true
            }
          }
          if (committed) onCommitPositions()
          setDraggingIds(null)
        },
        onCancel: () => {
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
          setDraggingIds(null)
        },
      })
    },
    // viewport.zoom removed — read via viewportRef to avoid recreating on every zoom
    [locked, editingId, selectedIds, onSelectNodes, onMoveNodes, onCommitPositions],
  )

  const beginHandleDrag = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      if (locked) return
      e.stopPropagation()
      setConnectDraft({ sourceId: nodeId, cursor: getCanvasPoint(e, containerRef.current, viewportRef.current) })

      startPointerDrag(e, {
        threshold: 0,
        onMove: (ev) => {
          const pt = getCanvasPoint(ev, containerRef.current, viewportRef.current)
          setConnectDraft((prev) => (prev ? { ...prev, cursor: pt } : prev))
        },
        onEnd: (ev) => {
          const targetId = findNodeAtPoint(ev.clientX, ev.clientY, nodeId)
          setConnectDraft(null)
          if (targetId) {
            onAddEdge({ id: generateEdgeId(), source: nodeId, target: targetId })
          }
        },
        onCancel: () => setConnectDraft(null),
      })
    },
    [locked, onAddEdge], // viewport removed — read via viewportRef
  )

  // Background pan — also coordinates pinch
  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointersRef.current.size === 2) {
        const pts = [...activePointersRef.current.values()]
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        pinchRef.current = { dist, zoom: viewportRef.current.zoom, midScreen: mid }
        return
      }

      // Single pointer: pan
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

      // Capture viewport at drag start via ref — always fresh, no stale closure
      const startVpX = viewportRef.current.x
      const startVpY = viewportRef.current.y
      const startZoom = viewportRef.current.zoom

      startPointerDrag(e, {
        onMove: (ev, state) => {
          // If a second pointer is active, handle as pinch instead
          if (activePointersRef.current.size >= 2) {
            const active = activePointersRef.current.get(ev.pointerId)
            if (active) {
              active.x = ev.clientX
              active.y = ev.clientY
            }
            const pts = [...activePointersRef.current.values()]
            if (pts.length >= 2 && pinchRef.current) {
              const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
              const factor = dist / pinchRef.current.dist
              const newZoom = clampZoom(pinchRef.current.zoom * factor)
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              const sx = pinchRef.current.midScreen.x - rect.left
              const sy = pinchRef.current.midScreen.y - rect.top
              // Midpoint-preserving zoom relative to pinch-start viewport
              const zoomRatio = newZoom / pinchRef.current.zoom
              const x = sx - (sx - startVpX) * zoomRatio
              const y = sy - (sy - startVpY) * zoomRatio
              onViewportChange({ x, y, zoom: newZoom })
            }
            return
          }

          // Pan: compute total delta from drag start so stale closure doesn't matter
          const totalDx = ev.clientX - state.startClientX
          const totalDy = ev.clientY - state.startClientY
          onViewportChange({ x: startVpX + totalDx, y: startVpY + totalDy, zoom: startZoom })
        },
        onEnd: (ev) => {
          activePointersRef.current.delete(ev.pointerId)
          if (activePointersRef.current.size < 2) pinchRef.current = null
        },
        onCancel: (ev) => {
          activePointersRef.current.delete(ev.pointerId)
          if (activePointersRef.current.size < 2) pinchRef.current = null
        },
      })
    },
    [connectDraft, connectionMode, onViewportChange], // viewport removed — read via viewportRef at drag start
  )

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      onClearSelection()
    },
    [onClearSelection],
  )

  const handleBackgroundDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      const pt = getCanvasPoint(e.nativeEvent, containerRef.current, viewport)
      onCanvasDoubleClick(pt)
    },
    [onCanvasDoubleClick, viewport],
  )

  // Connection-mode tap on a node
  const handleNodeTap = useCallback(
    (id: string) => {
      if (!connectionMode) return
      const source = connectDraft?.sourceId ?? (selectedIds.size === 1 ? [...selectedIds][0] : null)
      if (source && source !== id) {
        onAddEdge({ id: generateEdgeId(), source, target: id })
      }
      onExitConnectionMode()
      setConnectDraft(null)
    },
    [connectionMode, connectDraft, selectedIds, onAddEdge, onExitConnectionMode],
  )

  // Derive the active connection source. When connection mode is on and the
  // user hasn't started a drag yet, seed it from the single selected node.
  const effectiveConnectDraft = useMemo(() => {
    if (connectDraft) return connectDraft
    if (!connectionMode) return null
    if (selectedIds.size !== 1) return null
    const id = [...selectedIds][0]
    const node = nodeById.get(id)
    if (!node) return null
    const c = getNodeCenter(node)
    return { sourceId: id, cursor: { x: c.cx, y: c.cy } }
  }, [connectDraft, connectionMode, selectedIds, nodeById])

  // Escape key exits connection mode
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && connectionMode) onExitConnectionMode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [connectionMode, onExitConnectionMode])

  // Stable handlers for Node.memo — inline arrows would break reference equality
  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (connectionMode) {
        e.stopPropagation()
        handleNodeTap(id)
        return
      }
      beginNodeDrag(e, id)
    },
    [connectionMode, handleNodeTap, beginNodeDrag],
  )

  const handleNodeDoubleClick = useCallback(
    (id: string) => {
      if (connectionMode) return
      onRequestEdit(id)
    },
    [connectionMode, onRequestEdit],
  )

  // O(1) dragging lookup — avoids O(n²) Array.includes per render
  const draggingSet = useMemo(() => new Set(draggingIds ?? []), [draggingIds])

  // Grid pattern — fixed screen-space unit scaled by zoom
  const gridUnit = 24 * viewport.zoom
  const gridOpacity = Math.min(0.55, Math.max(0.18, viewport.zoom * 0.45))

  // Edge geometry — recomputed only when positions/topology change, not on selection
  const edgeGeometry = useMemo(() => {
    return edges.map((e) => {
      const s = nodeById.get(e.source)
      const t = nodeById.get(e.target)
      if (!s || !t) return null
      const sCenter = getNodeCenter(s)
      const tCenter = getNodeCenter(t)
      const from = getEdgeAnchorToward(s, tCenter)
      const to = getEdgeAnchorToward(t, sCenter)
      return { edge: e, from, to }
    })
  }, [edges, nodeById])

  // Highlighted flag — recomputed only on selection change, not on node move
  const edgeViews = useMemo(() => {
    return edgeGeometry.map((v) => {
      if (!v) return null
      const highlighted = selectedIds.has(v.edge.source) || selectedIds.has(v.edge.target)
      return { ...v, highlighted }
    })
  }, [edgeGeometry, selectedIds])

  const connectDraftView = useMemo(() => {
    if (!effectiveConnectDraft) return null
    const source = nodeById.get(effectiveConnectDraft.sourceId)
    if (!source) return null
    const from = getEdgeAnchorToward(source, { cx: effectiveConnectDraft.cursor.x, cy: effectiveConnectDraft.cursor.y })
    const to: Anchor = { x: effectiveConnectDraft.cursor.x, y: effectiveConnectDraft.cursor.y, side: 'left' }
    return { from, to }
  }, [effectiveConnectDraft, nodeById])

  const singleSelectedId = selectedIds.size === 1 ? [...selectedIds][0] : null

  return (
    <div
      ref={containerRef}
      className="schema-canvas"
      onPointerDown={onBackgroundPointerDown}
      onClick={handleBackgroundClick}
      onDoubleClick={handleBackgroundDoubleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 18% 12%, rgba(88,80,236,0.12), transparent 40%), radial-gradient(circle at 82% 88%, rgba(236,72,153,0.08), transparent 45%), #0B0B10',
        touchAction: 'none',
        cursor: connectionMode ? 'crosshair' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* SVG grid background */}
      <svg
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          <pattern
            id="schema-grid"
            width={gridUnit}
            height={gridUnit}
            patternUnits="userSpaceOnUse"
            x={viewport.x % gridUnit}
            y={viewport.y % gridUnit}
          >
            <circle cx={0.5} cy={0.5} r={0.9} fill={`rgba(255,255,255,${gridOpacity})`} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#schema-grid)" opacity={0.4} />
      </svg>

      {/* SVG edges layer with viewport transform */}
      <svg
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      >
        <defs>
          <marker id="schema-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.35)" />
          </marker>
          <marker id="schema-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(139,122,255,0.95)" />
          </marker>
        </defs>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
          {edgeViews.map((v) =>
            v ? (
              <Edge
                key={v.edge.id}
                id={v.edge.id}
                from={v.from}
                to={v.to}
                label={v.edge.label}
                highlighted={v.highlighted}
                onLabelDoubleClick={(id) => {
                  const current = edges.find((e) => e.id === id)?.label ?? ''
                  const next = window.prompt('Libellé de la relation', current)
                  if (next != null) onRenameEdge(id, next.trim() || null)
                }}
              />
            ) : null,
          )}
          {connectDraftView ? (
            <path
              d={`M ${connectDraftView.from.x} ${connectDraftView.from.y} L ${connectDraftView.to.x} ${connectDraftView.to.y}`}
              stroke="rgba(139,122,255,0.9)"
              strokeWidth={1.6}
              strokeDasharray="4 4"
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          ) : null}
        </g>
      </svg>

      {/* Nodes HTML layer with viewport transform */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '0 0',
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'relative', pointerEvents: 'none' }}>
          {nodes.map((n) => (
            <div key={n.id} style={{ position: 'absolute', pointerEvents: 'auto' }}>
              <Node
                node={n}
                selected={selectedIds.has(n.id)}
                dragging={draggingSet.has(n.id)}
                showHandles={!locked && !connectionMode && singleSelectedId === n.id}
                zoom={viewport.zoom}
                editing={editingId === n.id}
                onPointerDown={handleNodePointerDown}
                onDoubleClick={handleNodeDoubleClick}
                onCommitLabel={onCommitLabel}
                onCancelLabel={onCancelEdit}
                onHandlePointerDown={beginHandleDrag}
              />
            </div>
          ))}
        </div>
      </div>

      {connectionMode ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(139,122,255,0.2)',
            border: '1px solid rgba(139,122,255,0.5)',
            color: '#d4ccff',
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Sélectionnez un nœud cible · Échap pour annuler
        </div>
      ) : null}

      {/* containerSize is consumed via onContainerResize; kept here for debugging */}
      <span hidden data-w={containerSize.w} data-h={containerSize.h} data-zoom-range={`${ZOOM_MIN}-${ZOOM_MAX}`} />
    </div>
  )
}

function getCanvasPoint(e: PointerEventLike, container: HTMLElement | null, vp: SchemaViewport): { x: number; y: number } {
  const rel = getRelativePointer({ clientX: e.clientX, clientY: e.clientY }, container)
  return screenToCanvas(rel, vp)
}

function findNodeAtPoint(clientX: number, clientY: number, excludeId: string): string | null {
  if (typeof document === 'undefined') return null
  const stack = document.elementsFromPoint(clientX, clientY)
  for (const el of stack) {
    const target = el.closest('[data-node-id]') as HTMLElement | null
    if (target) {
      const id = target.getAttribute('data-node-id')
      if (id && id !== excludeId) return id
    }
  }
  return null
}

function generateEdgeId(): string {
  return 'e_' + Math.random().toString(36).slice(2, 10)
}

// Helpers re-exported for the parent
export const canvasGeometryHelpers = { getNodeRect, pointInRect, NODE_DEFAULT_W, NODE_DEFAULT_H }
