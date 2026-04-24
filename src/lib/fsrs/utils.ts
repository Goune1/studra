/** Format the time until a due date into a human-readable French label. */
export function formatInterval(due: Date, now: Date = new Date()): string {
  const diffMs = due.getTime() - now.getTime()
  if (diffMs <= 0) return '< 1 min'

  const mins = Math.round(diffMs / 60_000)
  if (mins < 1)   return '< 1 min'
  if (mins < 60)  return `${mins} min`

  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h`

  const days = Math.round(diffMs / 86_400_000)
  if (days === 1)  return 'Demain'
  if (days < 7)    return `${days} j`
  if (days < 14)   return '1 sem'
  if (days < 21)   return '2 sem'
  if (days < 28)   return '3 sem'

  const months = Math.round(days / 30)
  if (months < 12) return `${months} mois`

  const years = Math.round(days / 365)
  return `${years} an${years > 1 ? 's' : ''}`
}
