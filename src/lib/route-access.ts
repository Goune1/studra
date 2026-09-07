const dashboardRoutes = [
  '/dashboard',
  '/flashcards',
  '/fiches',
  '/schemas',
  '/timelines',
  '/exams',
  '/lacunes',
  '/socrate',
  '/recall',
  '/annales',
  '/planning',
  '/settings',
  '/billing',
  '/affiliate',
] as const

const legacyLocalePattern = /^\/(?:fr|en|es|pt|de|it)(?=\/|$)/

export function stripLegacyLocalePrefix(pathname: string): string | null {
  if (!legacyLocalePattern.test(pathname)) return null
  const stripped = pathname.replace(legacyLocalePattern, '')
  return stripped || '/'
}

export function isDashboardRoute(pathname: string): boolean {
  return dashboardRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
