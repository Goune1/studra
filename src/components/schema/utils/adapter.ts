import type { SchemaData, SchemaNode, SchemaNodeColor } from '@/types'

interface RawNode {
  id?: unknown
  position?: { x?: number; y?: number }
  data?: { label?: string; category?: string }
  x?: number
  y?: number
  label?: string
  color?: string
  width?: number
  height?: number
}

interface RawEdge {
  id?: unknown
  source?: unknown
  target?: unknown
  label?: string
}

interface RawData {
  nodes?: RawNode[]
  edges?: RawEdge[]
  viewport?: { x?: number; y?: number; zoom?: number }
}

const CATEGORY_TO_COLOR: Record<string, SchemaNodeColor> = {
  main: 'primary',
  principal: 'primary',
  secondary: 'accent',
  cause: 'accent',
  consequence: 'neutral',
  consequences: 'neutral',
  opposition: 'neutral',
  default: 'neutral',
}

function asColor(v: unknown): SchemaNodeColor | undefined {
  if (v === 'primary' || v === 'neutral' || v === 'accent') return v
  return undefined
}

export function normalizeSchemaData(raw: unknown): SchemaData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as RawData
  const nodes: SchemaNode[] = (data.nodes ?? []).map((n, i) => {
    const id = n.id != null ? String(n.id) : `n${i}`
    const x = typeof n.position?.x === 'number' ? n.position!.x : (typeof n.x === 'number' ? n.x : 0)
    const y = typeof n.position?.y === 'number' ? n.position!.y : (typeof n.y === 'number' ? n.y : 0)
    const label = (n.data?.label ?? n.label ?? 'Concept').toString()
    const explicit = asColor(n.color)
    const fromCategory = n.data?.category ? CATEGORY_TO_COLOR[n.data.category] : undefined
    const color: SchemaNodeColor = explicit ?? fromCategory ?? 'neutral'
    return {
      id,
      label,
      x,
      y,
      width: typeof n.width === 'number' ? n.width : undefined,
      height: typeof n.height === 'number' ? n.height : undefined,
      color,
    }
  })
  const edges = (data.edges ?? [])
    .map((e, i) => ({
      id: e.id != null ? String(e.id) : `e${i}`,
      source: String(e.source ?? ''),
      target: String(e.target ?? ''),
      label: typeof e.label === 'string' ? e.label : undefined,
    }))
    .filter((e) => e.source && e.target)
  const vp = data.viewport
  const viewport =
    vp && typeof vp.x === 'number' && typeof vp.y === 'number' && typeof vp.zoom === 'number'
      ? { x: vp.x, y: vp.y, zoom: vp.zoom }
      : undefined
  return { nodes, edges, viewport }
}

export function serializeSchemaData(data: SchemaData): SchemaData {
  return {
    nodes: data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: Math.round(n.x),
      y: Math.round(n.y),
      ...(n.width ? { width: n.width } : {}),
      ...(n.height ? { height: n.height } : {}),
      ...(n.color ? { color: n.color } : {}),
    })),
    edges: data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.label ? { label: e.label } : {}),
    })),
    ...(data.viewport
      ? {
          viewport: {
            x: Math.round(data.viewport.x * 1000) / 1000,
            y: Math.round(data.viewport.y * 1000) / 1000,
            zoom: Math.round(data.viewport.zoom * 1000) / 1000,
          },
        }
      : {}),
  }
}
