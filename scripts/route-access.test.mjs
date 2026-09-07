import assert from 'node:assert/strict'
import {test} from 'node:test'
import {pathToFileURL} from 'node:url'

const moduleUrl = pathToFileURL(new URL('../src/lib/route-access.ts', import.meta.url).pathname).href
const {isDashboardRoute} = await import(moduleUrl)

test('les routes dashboard exactes et leurs enfants sont privées', () => {
  for (const pathname of ['/dashboard', '/dashboard/', '/flashcards', '/flashcards/abc', '/settings/revision']) {
    assert.equal(isDashboardRoute(pathname), true, pathname)
  }
})

test('les pages SEO qui partagent un préfixe restent publiques', () => {
  for (const pathname of ['/flashcards-ia', '/fiches-de-revision-ia', '/examen-blanc-ia']) {
    assert.equal(isDashboardRoute(pathname), false, pathname)
  }
})

test('les anciens préfixes de langue sont retirés sans toucher aux autres routes', async () => {
  const {stripLegacyLocalePrefix} = await import(moduleUrl)
  assert.equal(stripLegacyLocalePrefix('/en'), '/')
  assert.equal(stripLegacyLocalePrefix('/es/login'), '/login')
  assert.equal(stripLegacyLocalePrefix('/fr/blog/article'), '/blog/article')
  assert.equal(stripLegacyLocalePrefix('/flashcards-ia'), null)
})
