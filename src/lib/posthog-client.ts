export interface DeferredPostHogClient {
  capture: (event: string, properties?: Record<string, unknown>) => unknown
  identify: (distinctId: string, properties?: Record<string, unknown>) => unknown
  reset: () => unknown
  people: { set: (properties: Record<string, unknown>) => unknown }
}

type PostHogAction = (client: DeferredPostHogClient) => void

let client: DeferredPostHogClient | null = null
const pendingActions: PostHogAction[] = []
const MAX_PENDING_ACTIONS = 100

export function registerPostHogClient(nextClient: DeferredPostHogClient) {
  client = nextClient
  pendingActions.splice(0).forEach((action) => action(nextClient))
}

export function withPostHog(action: PostHogAction) {
  if (typeof window === 'undefined') return

  if (client) {
    action(client)
    return
  }

  if (pendingActions.length < MAX_PENDING_ACTIONS) {
    pendingActions.push(action)
  }
}
