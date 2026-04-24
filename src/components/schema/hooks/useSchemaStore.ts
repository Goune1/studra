import { useReducer } from 'react'
import type { SchemaEdge, SchemaNode, SchemaNodeColor, SchemaViewport } from '@/types'

export interface SchemaState {
  nodes: SchemaNode[]
  edges: SchemaEdge[]
  viewport: SchemaViewport
  selectedIds: ReadonlySet<string>
  locked: boolean
  dirty: boolean
}

export type SchemaAction =
  | { type: 'init'; nodes: SchemaNode[]; edges: SchemaEdge[]; viewport: SchemaViewport }
  | { type: 'set-viewport'; vp: SchemaViewport }
  | { type: 'select'; ids: string[]; mode: 'replace' | 'toggle' | 'add' }
  | { type: 'clear-selection' }
  | { type: 'move-nodes'; ids: string[]; dx: number; dy: number }
  | { type: 'set-positions'; positions: Record<string, { x: number; y: number }> }
  | { type: 'rename-node'; id: string; label: string }
  | { type: 'set-color'; id: string; color: SchemaNodeColor }
  | { type: 'add-node'; node: SchemaNode }
  | { type: 'delete-node'; id: string }
  | { type: 'delete-selected' }
  | { type: 'add-edge'; edge: SchemaEdge }
  | { type: 'rename-edge'; id: string; label: string }
  | { type: 'delete-edge'; id: string }
  | { type: 'toggle-lock' }
  | { type: 'mark-clean' }

function applySelect(prev: ReadonlySet<string>, ids: string[], mode: 'replace' | 'toggle' | 'add'): Set<string> {
  if (mode === 'replace') return new Set(ids)
  const next = new Set(prev)
  for (const id of ids) {
    if (mode === 'toggle' && next.has(id)) next.delete(id)
    else next.add(id)
  }
  return next
}

function reducer(s: SchemaState, a: SchemaAction): SchemaState {
  switch (a.type) {
    case 'init':
      return {
        nodes: a.nodes,
        edges: a.edges,
        viewport: a.viewport,
        selectedIds: new Set(),
        locked: false,
        dirty: false,
      }
    case 'set-viewport':
      return { ...s, viewport: a.vp, dirty: true }
    case 'select':
      return { ...s, selectedIds: applySelect(s.selectedIds, a.ids, a.mode) }
    case 'clear-selection':
      return s.selectedIds.size === 0 ? s : { ...s, selectedIds: new Set() }
    case 'move-nodes': {
      if (s.locked || a.ids.length === 0) return s
      const ids = new Set(a.ids)
      return {
        ...s,
        dirty: true,
        nodes: s.nodes.map((n) => (ids.has(n.id) ? { ...n, x: n.x + a.dx, y: n.y + a.dy } : n)),
      }
    }
    case 'set-positions': {
      if (s.locked) return s
      return {
        ...s,
        dirty: true,
        nodes: s.nodes.map((n) => (a.positions[n.id] ? { ...n, x: a.positions[n.id].x, y: a.positions[n.id].y } : n)),
      }
    }
    case 'rename-node':
      if (s.locked) return s
      return { ...s, dirty: true, nodes: s.nodes.map((n) => (n.id === a.id ? { ...n, label: a.label } : n)) }
    case 'set-color':
      if (s.locked) return s
      return { ...s, dirty: true, nodes: s.nodes.map((n) => (n.id === a.id ? { ...n, color: a.color } : n)) }
    case 'add-node':
      if (s.locked) return s
      return { ...s, dirty: true, nodes: [...s.nodes, a.node] }
    case 'delete-node': {
      if (s.locked) return s
      const sel = new Set(s.selectedIds)
      sel.delete(a.id)
      return {
        ...s,
        dirty: true,
        nodes: s.nodes.filter((n) => n.id !== a.id),
        edges: s.edges.filter((e) => e.source !== a.id && e.target !== a.id),
        selectedIds: sel,
      }
    }
    case 'delete-selected': {
      if (s.locked || s.selectedIds.size === 0) return s
      const ids = s.selectedIds
      return {
        ...s,
        dirty: true,
        nodes: s.nodes.filter((n) => !ids.has(n.id)),
        edges: s.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
        selectedIds: new Set(),
      }
    }
    case 'add-edge': {
      if (s.locked) return s
      if (a.edge.source === a.edge.target) return s
      if (s.edges.some((e) => e.source === a.edge.source && e.target === a.edge.target)) return s
      return { ...s, dirty: true, edges: [...s.edges, a.edge] }
    }
    case 'rename-edge':
      if (s.locked) return s
      return { ...s, dirty: true, edges: s.edges.map((e) => (e.id === a.id ? { ...e, label: a.label } : e)) }
    case 'delete-edge':
      if (s.locked) return s
      return { ...s, dirty: true, edges: s.edges.filter((e) => e.id !== a.id) }
    case 'toggle-lock':
      return { ...s, locked: !s.locked }
    case 'mark-clean':
      return s.dirty ? { ...s, dirty: false } : s
    default:
      return s
  }
}

export function useSchemaStore(initial: Omit<SchemaState, 'selectedIds' | 'locked' | 'dirty'>) {
  return useReducer(reducer, {
    nodes: initial.nodes,
    edges: initial.edges,
    viewport: initial.viewport,
    selectedIds: new Set<string>(),
    locked: false,
    dirty: false,
  })
}
