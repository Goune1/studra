import type { SchemaEdge, SchemaNode } from '@/types'
import { NODE_DEFAULT_H, NODE_DEFAULT_W } from '../utils/geometry'

const LEVEL_GAP = 110
const SIBLING_GAP = 40
const RADIAL_RING_GAP = 180

export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>
  mode: 'tree' | 'radial'
}

function nodeWidth(n: SchemaNode): number {
  return n.width ?? NODE_DEFAULT_W
}
function nodeHeight(n: SchemaNode): number {
  return n.height ?? NODE_DEFAULT_H
}

export function computeAutoLayout(nodes: SchemaNode[], edges: SchemaEdge[]): LayoutResult {
  if (nodes.length === 0) return { positions: {}, mode: 'tree' }

  const incoming = new Map<string, string[]>()
  const outgoing = new Map<string, string[]>()
  const byId = new Map<string, SchemaNode>()
  nodes.forEach((n) => {
    incoming.set(n.id, [])
    outgoing.set(n.id, [])
    byId.set(n.id, n)
  })
  edges.forEach((e) => {
    if (incoming.has(e.target)) incoming.get(e.target)!.push(e.source)
    if (outgoing.has(e.source)) outgoing.get(e.source)!.push(e.target)
  })

  const roots = nodes
    .filter((n) => (incoming.get(n.id) ?? []).length === 0)
    .map((n) => n.id)

  // Pure tree case: exactly one root and the BFS reaches every node without revisits.
  if (roots.length === 1) {
    const tree = tryHierarchicalLayout(nodes, byId, outgoing, incoming, roots[0])
    if (tree) return { positions: tree, mode: 'tree' }
  } else if (roots.length > 1) {
    const tree = tryHierarchicalLayout(nodes, byId, outgoing, incoming, roots)
    if (tree) return { positions: tree, mode: 'tree' }
  }

  // Fallback: radial
  const center = pickHub(nodes, outgoing, incoming)
  return { positions: radialLayout(nodes, byId, outgoing, center), mode: 'radial' }
}

function tryHierarchicalLayout(
  nodes: SchemaNode[],
  byId: Map<string, SchemaNode>,
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>,
  rootOrRoots: string | string[],
): Record<string, { x: number; y: number }> | null {
  const roots = Array.isArray(rootOrRoots) ? rootOrRoots : [rootOrRoots]
  const level = new Map<string, number>()
  const queue: string[] = []
  roots.forEach((r) => {
    level.set(r, 0)
    queue.push(r)
  })
  while (queue.length) {
    const id = queue.shift()!
    const lv = level.get(id)!
    for (const child of outgoing.get(id) ?? []) {
      if (!level.has(child)) {
        // Only assign if the parent is the only contributor or we're the deepest one yet
        const parents = incoming.get(child) ?? []
        if (parents.length === 1) {
          level.set(child, lv + 1)
          queue.push(child)
        } else {
          // Place at max-of-parents + 1 once all parents resolved
          if (parents.every((p) => level.has(p))) {
            level.set(child, Math.max(...parents.map((p) => level.get(p)!)) + 1)
            queue.push(child)
          }
        }
      }
    }
  }
  // Anything left out → fail and let caller fall back
  if (level.size !== nodes.length) {
    nodes.forEach((n) => {
      if (!level.has(n.id)) level.set(n.id, 0)
    })
  }

  const byLevel = new Map<number, string[]>()
  level.forEach((lv, id) => {
    if (!byLevel.has(lv)) byLevel.set(lv, [])
    byLevel.get(lv)!.push(id)
  })

  const positions: Record<string, { x: number; y: number }> = {}
  const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b)
  let cumY = 0
  for (const lv of sortedLevels) {
    const ids = byLevel.get(lv)!
    const widths = ids.map((id) => nodeWidth(byId.get(id)!))
    const totalW = widths.reduce((s, w) => s + w, 0) + (ids.length - 1) * SIBLING_GAP
    const rowH = Math.max(...ids.map((id) => nodeHeight(byId.get(id)!)))
    let x = -totalW / 2
    ids.forEach((id, i) => {
      positions[id] = { x, y: cumY }
      x += widths[i] + SIBLING_GAP
    })
    cumY += rowH + LEVEL_GAP
  }
  return positions
}

function pickHub(
  nodes: SchemaNode[],
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>,
): string {
  let bestId = nodes[0].id
  let bestScore = -1
  for (const n of nodes) {
    const score = (outgoing.get(n.id)?.length ?? 0) + (incoming.get(n.id)?.length ?? 0)
    if (score > bestScore) {
      bestScore = score
      bestId = n.id
    }
  }
  return bestId
}

function radialLayout(
  nodes: SchemaNode[],
  byId: Map<string, SchemaNode>,
  outgoing: Map<string, string[]>,
  centerId: string,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  positions[centerId] = { x: -nodeWidth(byId.get(centerId)!) / 2, y: -nodeHeight(byId.get(centerId)!) / 2 }
  const visited = new Set<string>([centerId])
  let frontier = outgoing.get(centerId) ?? []
  let ring = 1
  while (frontier.length) {
    const next: string[] = []
    const radius = RADIAL_RING_GAP * ring
    const fresh = frontier.filter((id) => !visited.has(id))
    fresh.forEach((id, i) => {
      visited.add(id)
      const angle = (i / Math.max(1, fresh.length)) * 2 * Math.PI - Math.PI / 2
      const w = nodeWidth(byId.get(id)!)
      const h = nodeHeight(byId.get(id)!)
      positions[id] = {
        x: Math.cos(angle) * radius - w / 2,
        y: Math.sin(angle) * radius - h / 2,
      }
      for (const child of outgoing.get(id) ?? []) {
        if (!visited.has(child)) next.push(child)
      }
    })
    frontier = next
    ring += 1
    if (ring > 12) break
  }
  // Any unvisited (disconnected) node → place around an outer ring
  const orphans = nodes.filter((n) => !positions[n.id])
  if (orphans.length) {
    const radius = RADIAL_RING_GAP * (ring + 1)
    orphans.forEach((n, i) => {
      const angle = (i / orphans.length) * 2 * Math.PI
      positions[n.id] = {
        x: Math.cos(angle) * radius - nodeWidth(n) / 2,
        y: Math.sin(angle) * radius - nodeHeight(n) / 2,
      }
    })
  }
  return positions
}
