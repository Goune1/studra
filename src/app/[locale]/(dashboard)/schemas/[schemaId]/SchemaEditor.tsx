'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { SchemaData, SchemaEdge, SchemaNode, SchemaNodeColor, SchemaViewport } from '@/types'
import { Canvas } from '@/components/schema/Canvas'
import { Toolbar, type SaveStatus } from '@/components/schema/Toolbar'
import { Minimap } from '@/components/schema/Minimap'
import { ContextBar } from '@/components/schema/ContextBar'
import { useSchemaStore } from '@/components/schema/hooks/useSchemaStore'
import { computeAutoLayout } from '@/components/schema/hooks/useAutoLayout'
import { NODE_DEFAULT_H, NODE_DEFAULT_W, getNodeRect, unionRect } from '@/components/schema/utils/geometry'
import { ZOOM_MAX, ZOOM_MIN, canvasToScreen, clampZoom } from '@/components/schema/utils/coords'
import { serializeSchemaData } from '@/components/schema/utils/adapter'

const AUTO_SAVE_INTERVAL = 30_000
const COLOR_CYCLE: SchemaNodeColor[] = ['neutral', 'primary', 'accent']

interface SchemaEditorProps {
  schemaId: string
  initialData: SchemaData
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern) } catch { /* ignore */ }
  }
}

export default function SchemaEditor({ schemaId, initialData }: SchemaEditorProps) {
  const t = useTranslations('dashboard.schemas.toast')
  const schemaT = useTranslations('dashboard.schemas')
  const [state, dispatch] = useSchemaStore({
    nodes: initialData.nodes,
    edges: initialData.edges,
    viewport: initialData.viewport ?? { x: 0, y: 0, zoom: 1 },
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [connectionMode, setConnectionMode] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [minimapOpen, setMinimapOpen] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [isCompact, setIsCompact] = useState(false)

  const savedRef = useRef<SchemaData>(initialData)
  const autoSaveTimerRef = useRef<number | null>(null)
  const userTouchedViewportRef = useRef(Boolean(initialData.viewport))

  // Always-fresh snapshot of state — lets handleSave be a stable reference
  const latestStateRef = useRef({ nodes: state.nodes, edges: state.edges, viewport: state.viewport, dirty: state.dirty })
  latestStateRef.current = { nodes: state.nodes, edges: state.edges, viewport: state.viewport, dirty: state.dirty }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setIsCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (state.dirty) setStatus('dirty')
  }, [state.dirty])

  // Stable across all renders — reads state via latestStateRef, never from closure
  const handleSave = useCallback(async () => {
    setStatus('saving')
    const { nodes, edges, viewport } = latestStateRef.current
    const payload: SchemaData = { nodes, edges, viewport }
    try {
      const res = await fetch(`/api/schemas/${schemaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_data: serializeSchemaData(payload) }),
      })
      if (!res.ok) throw new Error('Save failed')
      savedRef.current = payload
      dispatch({ type: 'mark-clean' })
      setStatus('saved')
      toast.success(t('saved'))
      vibrate(8)
    } catch {
      setStatus('dirty')
      toast.error(t('saveError'))
    }
  }, [schemaId, dispatch])

  // Auto-save debounce — re-arms on every structural change while dirty.
  // handleSave is stable so this effect only runs when nodes/edges/viewport/dirty actually change.
  useEffect(() => {
    if (!state.dirty) {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      return
    }
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = window.setTimeout(handleSave, AUTO_SAVE_INTERVAL)
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [state.nodes, state.edges, state.viewport, state.dirty, handleSave])

  // Fit to view — re-runs on every container/nodes change until the user touches the viewport
  useEffect(() => {
    if (userTouchedViewportRef.current) return
    if (containerSize.w === 0 || containerSize.h === 0) return
    const bounds = unionRect(state.nodes.map(getNodeRect))
    if (!bounds) return
    const padding = 80
    const rafId = requestAnimationFrame(() => {
      const zoom = clampZoom(Math.min((containerSize.w - padding * 2) / bounds.w, (containerSize.h - padding * 2) / bounds.h, 1))
      const vp: SchemaViewport = {
        x: containerSize.w / 2 - (bounds.x + bounds.w / 2) * zoom,
        y: containerSize.h / 2 - (bounds.y + bounds.h / 2) * zoom,
        zoom,
      }
      dispatch({ type: 'set-viewport', vp })
    })
    return () => cancelAnimationFrame(rafId)
  }, [containerSize, state.nodes, dispatch])

  // Keyboard delete + save shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isEditing = e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      if (isEditing) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedIds.size > 0 && !state.locked) {
        e.preventDefault()
        dispatch({ type: 'delete-selected' })
        vibrate([10, 20, 10])
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.selectedIds, state.locked, dispatch, handleSave])

  // Warn before tab close if there are unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latestStateRef.current.dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const handleViewportChange = useCallback(
    (vp: SchemaViewport) => {
      userTouchedViewportRef.current = true
      dispatch({ type: 'set-viewport', vp })
    },
    [dispatch],
  )

  const handleSelect = useCallback(
    (ids: string[], mode: 'replace' | 'toggle' | 'add') => {
      dispatch({ type: 'select', ids, mode })
      vibrate(5)
    },
    [dispatch],
  )

  const handleClearSelection = useCallback(() => {
    dispatch({ type: 'clear-selection' })
    setConnectionMode(false)
  }, [dispatch])

  const handleMove = useCallback(
    (ids: string[], dx: number, dy: number) => dispatch({ type: 'move-nodes', ids, dx, dy }),
    [dispatch],
  )

  const handleCommitPositions = useCallback(() => {
    /* positions already committed reducer-side; placeholder for future history */
  }, [])

  const handleRequestEdit = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  const handleCommitLabel = useCallback(
    (id: string, label: string) => {
      dispatch({ type: 'rename-node', id, label })
      setEditingId(null)
    },
    [dispatch],
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const handleAddEdge = useCallback(
    (edge: SchemaEdge) => {
      dispatch({ type: 'add-edge', edge })
      vibrate(12)
    },
    [dispatch],
  )

  const handleRenameEdge = useCallback(
    (id: string, label: string | null) => {
      if (label == null) dispatch({ type: 'delete-edge', id })
      else dispatch({ type: 'rename-edge', id, label })
    },
    [dispatch],
  )

  const handleCanvasDoubleClick = useCallback(
    (pt: { x: number; y: number }) => {
      if (state.locked) return
      const id = generateNodeId()
      const node: SchemaNode = {
        id,
        label: 'Nouveau concept',
        x: pt.x - NODE_DEFAULT_W / 2,
        y: pt.y - NODE_DEFAULT_H / 2,
        color: 'neutral',
      }
      dispatch({ type: 'add-node', node })
      dispatch({ type: 'select', ids: [id], mode: 'replace' })
      setEditingId(id)
    },
    [dispatch, state.locked],
  )

  // Toolbar actions
  const handleZoom = useCallback(
    (factor: number) => {
      if (containerSize.w === 0) return
      userTouchedViewportRef.current = true
      const cx = containerSize.w / 2
      const cy = containerSize.h / 2
      const newZoom = clampZoom(state.viewport.zoom * factor)
      const ratio = newZoom / state.viewport.zoom
      const x = cx - (cx - state.viewport.x) * ratio
      const y = cy - (cy - state.viewport.y) * ratio
      dispatch({ type: 'set-viewport', vp: { x, y, zoom: newZoom } })
    },
    [containerSize, state.viewport, dispatch],
  )

  const handleResetZoom = useCallback(() => handleZoom(1 / state.viewport.zoom), [handleZoom, state.viewport.zoom])

  const handleFitToView = useCallback(() => {
    if (containerSize.w === 0) return
    const bounds = unionRect(state.nodes.map(getNodeRect))
    if (!bounds) return
    userTouchedViewportRef.current = true
    const padding = 80
    const zoom = clampZoom(Math.min((containerSize.w - padding * 2) / bounds.w, (containerSize.h - padding * 2) / bounds.h, ZOOM_MAX))
    const vp: SchemaViewport = {
      x: containerSize.w / 2 - (bounds.x + bounds.w / 2) * zoom,
      y: containerSize.h / 2 - (bounds.y + bounds.h / 2) * zoom,
      zoom,
    }
    dispatch({ type: 'set-viewport', vp })
  }, [containerSize, state.nodes, dispatch])

  const handleAddNode = useCallback(() => {
    if (state.locked) return
    const cx = (containerSize.w / 2 - state.viewport.x) / state.viewport.zoom
    const cy = (containerSize.h / 2 - state.viewport.y) / state.viewport.zoom
    const id = generateNodeId()
    dispatch({
      type: 'add-node',
      node: { id, label: 'Nouveau concept', x: cx - NODE_DEFAULT_W / 2, y: cy - NODE_DEFAULT_H / 2, color: 'neutral' },
    })
    dispatch({ type: 'select', ids: [id], mode: 'replace' })
    setEditingId(id)
  }, [state.locked, state.viewport, containerSize, dispatch])

  const handleAutoLayout = useCallback(() => {
    if (state.locked) return
    const { positions } = computeAutoLayout(state.nodes, state.edges)
    dispatch({ type: 'set-positions', positions })
    requestAnimationFrame(() => handleFitToView())
  }, [state.locked, state.nodes, state.edges, dispatch, handleFitToView])

  const handleToggleLock = useCallback(() => {
    dispatch({ type: 'toggle-lock' })
    toast(state.locked ? t('unlocked') : t('locked'))
  }, [dispatch, state.locked])

  const handleMinimapRecenter = useCallback(
    (canvasPt: { x: number; y: number }) => {
      userTouchedViewportRef.current = true
      const vp: SchemaViewport = {
        x: containerSize.w / 2 - canvasPt.x * state.viewport.zoom,
        y: containerSize.h / 2 - canvasPt.y * state.viewport.zoom,
        zoom: state.viewport.zoom,
      }
      dispatch({ type: 'set-viewport', vp })
    },
    [containerSize, state.viewport.zoom, dispatch],
  )

  // Context bar positioning — computed from screen coords of the single selected node
  const singleSelectedNode: SchemaNode | null = useMemo(() => {
    if (state.selectedIds.size !== 1) return null
    const id = [...state.selectedIds][0]
    return state.nodes.find((n) => n.id === id) ?? null
  }, [state.selectedIds, state.nodes])

  const contextBarPos = useMemo(() => {
    if (!singleSelectedNode) return null
    const rect = getNodeRect(singleSelectedNode)
    const canvasPt = { x: rect.x + rect.w / 2, y: rect.y }
    return canvasToScreen(canvasPt, state.viewport)
  }, [singleSelectedNode, state.viewport])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 16,
      }}
    >
      <style>{`
        @keyframes schema-spin { to { transform: rotate(360deg) } }
      `}</style>

      <Canvas
        nodes={state.nodes}
        edges={state.edges}
        viewport={state.viewport}
        selectedIds={state.selectedIds}
        editingId={editingId}
        locked={state.locked}
        connectionMode={connectionMode}
        onViewportChange={handleViewportChange}
        onContainerResize={setContainerSize}
        onSelectNodes={handleSelect}
        onClearSelection={handleClearSelection}
        onMoveNodes={handleMove}
        onCommitPositions={handleCommitPositions}
        onRequestEdit={handleRequestEdit}
        onCommitLabel={handleCommitLabel}
        onCancelEdit={handleCancelEdit}
        onAddEdge={handleAddEdge}
        onRenameEdge={handleRenameEdge}
        onCanvasDoubleClick={handleCanvasDoubleClick}
        onExitConnectionMode={() => setConnectionMode(false)}
      />

      {/* Context bar */}
      {singleSelectedNode && contextBarPos && !editingId ? (
        <ContextBar
          node={singleSelectedNode}
          screenPos={contextBarPos}
          connecting={connectionMode}
          onRename={() => setEditingId(singleSelectedNode.id)}
          onConnect={() => setConnectionMode((v) => !v)}
          onCycleColor={() => {
            const curr: SchemaNodeColor = singleSelectedNode.color ?? 'neutral'
            const next = COLOR_CYCLE[(COLOR_CYCLE.indexOf(curr) + 1) % COLOR_CYCLE.length]
            dispatch({ type: 'set-color', id: singleSelectedNode.id, color: next })
          }}
          onDelete={() => {
            dispatch({ type: 'delete-node', id: singleSelectedNode.id })
            vibrate([10, 20, 10])
          }}
        />
      ) : null}

      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: isCompact ? 12 : 16,
          transform: 'translateX(-50%)',
          zIndex: 20,
          width: isCompact ? 'calc(100% - 16px)' : 'auto',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Toolbar
          onZoomIn={() => handleZoom(1.2)}
          onZoomOut={() => handleZoom(1 / 1.2)}
          onResetZoom={handleResetZoom}
          onFitToView={handleFitToView}
          onAddNode={handleAddNode}
          onAutoLayout={handleAutoLayout}
          onToggleLock={handleToggleLock}
          onToggleMinimap={() => setMinimapOpen((v) => !v)}
          onSave={handleSave}
          locked={state.locked}
          status={status}
          compact={isCompact}
        />
      </div>

      {/* Minimap */}
      {(isCompact ? minimapOpen : true) ? (
        <div style={{ position: 'absolute', right: 12, bottom: isCompact ? 80 : 16, zIndex: 15 }}>
          <Minimap
            nodes={state.nodes}
            viewport={state.viewport}
            containerSize={containerSize}
            onRecenter={handleMinimapRecenter}
          />
        </div>
      ) : null}

      {/* Zoom badge */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          padding: '4px 8px',
          borderRadius: 8,
          background: 'rgba(11,11,15,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11,
          color: 'rgba(230,231,238,0.75)',
          fontVariantNumeric: 'tabular-nums',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {Math.round(state.viewport.zoom * 100)}%
        <span style={{ marginLeft: 8, opacity: 0.6 }}>
          {schemaT('detail.stats', {nodes: state.nodes.length, edges: state.edges.length})}
        </span>
      </div>

      {/* Zoom bounds are enforced via clampZoom */}
      <span style={{ display: 'none' }} data-zoom-bounds={`${ZOOM_MIN}-${ZOOM_MAX}`} />
    </div>
  )
}

function generateNodeId(): string {
  return 'n_' + Math.random().toString(36).slice(2, 10)
}
