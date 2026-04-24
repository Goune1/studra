export interface DragState {
  pointerId: number
  startClientX: number
  startClientY: number
  lastClientX: number
  lastClientY: number
  moved: boolean
}

export interface DragHandlers {
  onMove?: (e: PointerEvent, s: DragState, delta: { dx: number; dy: number }) => void
  onEnd?: (e: PointerEvent, s: DragState) => void
  onCancel?: (e: PointerEvent, s: DragState) => void
  threshold?: number
}

const MOVE_THRESHOLD = 3

/**
 * Generic pointer drag helper. Call this from a React onPointerDown event.
 * The handlers are wired to the document so the drag continues even if the
 * pointer leaves the originating element. We rely on pointer capture for
 * mobile reliability.
 */
export function startPointerDrag(e: React.PointerEvent, handlers: DragHandlers): DragState {
  const target = e.currentTarget as HTMLElement
  try {
    target.setPointerCapture(e.pointerId)
  } catch {
    /* ignore — some elements (e.g. SVG inside foreignObject) reject capture */
  }

  const state: DragState = {
    pointerId: e.pointerId,
    startClientX: e.clientX,
    startClientY: e.clientY,
    lastClientX: e.clientX,
    lastClientY: e.clientY,
    moved: false,
  }

  const threshold = handlers.threshold ?? MOVE_THRESHOLD

  function onMove(ev: PointerEvent) {
    if (ev.pointerId !== state.pointerId) return
    const dx = ev.clientX - state.lastClientX
    const dy = ev.clientY - state.lastClientY
    state.lastClientX = ev.clientX
    state.lastClientY = ev.clientY
    if (!state.moved) {
      const totalDx = ev.clientX - state.startClientX
      const totalDy = ev.clientY - state.startClientY
      if (Math.abs(totalDx) >= threshold || Math.abs(totalDy) >= threshold) {
        state.moved = true
      }
    }
    handlers.onMove?.(ev, state, { dx, dy })
  }
  function cleanup() {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.removeEventListener('pointercancel', onCancel)
    try {
      target.releasePointerCapture(state.pointerId)
    } catch {
      /* ignore */
    }
  }
  function onUp(ev: PointerEvent) {
    if (ev.pointerId !== state.pointerId) return
    cleanup()
    handlers.onEnd?.(ev, state)
  }
  function onCancel(ev: PointerEvent) {
    if (ev.pointerId !== state.pointerId) return
    cleanup()
    handlers.onCancel?.(ev, state)
  }
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.addEventListener('pointercancel', onCancel)
  return state
}
