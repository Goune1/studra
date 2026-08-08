import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const fromRoot = (path) => join(root.pathname, path)
const read = (path) => readFileSync(fromRoot(path), 'utf8')

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

test('configures the six locales with French as the unprefixed default', () => {
  const routing = read('src/i18n/routing.ts')
  const pathnameConfig = read('src/i18n/pathname.ts')

  for (const locale of ['fr', 'en', 'es', 'pt', 'de', 'it']) {
    assert.match(pathnameConfig, new RegExp(`['"]${locale}['"]`))
  }
  assert.match(pathnameConfig, /defaultLocale\s*=\s*['"]fr['"]/)
  assert.match(routing, /localePrefix:\s*['"]as-needed['"]/)
})

test('keeps technical and admin routes outside the locale segment', () => {
  assert.ok(existsSync(fromRoot('src/app/[locale]/page.tsx')))
  assert.ok(existsSync(fromRoot('src/app/[locale]/(dashboard)/dashboard/page.tsx')))
  assert.ok(existsSync(fromRoot('src/app/admin/page.tsx')))
  assert.ok(existsSync(fromRoot('src/app/api/billing/checkout/route.ts')))
  assert.ok(existsSync(fromRoot('src/app/auth/callback/route.ts')))
  assert.ok(!existsSync(fromRoot('src/app/[locale]/admin')))
  assert.ok(!existsSync(fromRoot('src/app/[locale]/api')))
})

test('uses a Next 16 proxy and removes the legacy middleware entrypoint', () => {
  const proxy = read('src/proxy.ts')

  assert.match(proxy, /createMiddleware/)
  assert.match(proxy, /updateSession/)
  assert.ok(!existsSync(fromRoot('src/middleware.ts')))
})

test('provides only the French source message catalog with typed keys', () => {
  const messageFiles = readdirSync(fromRoot('messages')).filter((name) => name.endsWith('.json'))

  assert.deepEqual(messageFiles, ['fr.json'])
  assert.ok(existsSync(fromRoot('global.d.ts')))
})

test('sets the request locale in every localized page and layout', () => {
  const localizedRoot = fromRoot('src/app/[locale]')
  const routeFiles = walk(localizedRoot).filter((path) => /\/(page|layout)\.tsx$/.test(path))

  assert.ok(routeFiles.length > 0)
  for (const path of routeFiles) {
    assert.match(readFileSync(path, 'utf8'), /setRequestLocale\s*\(/, path)
  }
})

test('loads next-intl through the Next.js plugin', () => {
  const packageJson = JSON.parse(read('package.json'))
  const nextConfig = read('next.config.ts')

  assert.equal(packageJson.dependencies['next-intl'], '^4.13.5')
  assert.match(nextConfig, /createNextIntlPlugin/)
})
