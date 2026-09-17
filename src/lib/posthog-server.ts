import { PostHog } from 'posthog-node'

/**
 * Envoie un événement PostHog depuis le serveur, puis vide la file.
 * Même fonctionnement que capturePostHog du webhook Stripe, laissé intact.
 * À appeler hors du chemin de réponse (after()) : shutdown() attend l'envoi.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return
  const posthog = new PostHog(apiKey, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST })
  try {
    posthog.capture({ distinctId, event, properties })
  } finally {
    await posthog.shutdown()
  }
}
