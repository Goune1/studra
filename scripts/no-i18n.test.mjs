import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'

const root = new URL('../', import.meta.url).pathname
const ignoredDirectories = new Set(['.git', '.next', 'node_modules'])
const inspectedRoots = ['src', 'next.config.ts', 'global.d.ts']

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return []
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function sourceFiles() {
  return inspectedRoots.flatMap((entry) => {
    const path = join(root, entry)
    if (!existsSync(path)) return []
    return entry.endsWith('.ts') ? [path] : walk(path)
  }).filter((path) => /\.(?:ts|tsx|js|mjs)$/.test(path))
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('Studra is a French-only application without an i18n subsystem', () => {
  const forbiddenPaths = [
    'messages',
    'src/i18n',
    'src/components/LanguageSelector.tsx',
    'src/lib/seo-i18n.ts',
    'docs/i18n-audit.md',
    'supabase/migrations/014_preferred_locale.sql',
  ]
  for (const path of forbiddenPaths) {
    assert.equal(existsSync(join(root, path)), false, `${path} doit être supprimé`)
  }

  assert.equal(existsSync(join(root, 'src/app/[locale]')), false, 'le segment [locale] doit être supprimé')
  assert.equal(existsSync(join(root, 'src/app/page.tsx')), true, 'la route française / doit exister')
  assert.equal(existsSync(join(root, 'src/app/layout.tsx')), true, 'le layout racine français doit exister')

  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(packageJson.dependencies?.['next-intl'], undefined, 'next-intl doit être désinstallé')

  const forbiddenSymbols = [
    /(?:from\s*|import\s*\()['"]next-intl['"]/,
    /(?:from\s*|import\s*\()['"][^'"]*\/i18n(?:\/|['"])/,
    /\b(?:useTranslations|useLocale|useFormatter|setRequestLocale|resolveServerLocale|getLocalizedPathname|localizedMetadata)\b/,
    /\bNEXT_LOCALE\b/,
    /\bpreferred_locale\b/,
    /\bLanguageSelector\b/,
  ]
  const violations = []
  for (const path of sourceFiles()) {
    const source = stripComments(readFileSync(path, 'utf8'))
    for (const pattern of forbiddenSymbols) {
      if (pattern.test(source)) violations.push(`${relative(root, path)}: ${pattern}`)
    }
  }
  assert.deepEqual(violations, [], `dépendances ou symboles i18n restants:\n${violations.join('\n')}`)
})

test('legacy locale-prefixed public routes are not part of the application tree', () => {
  for (const locale of ['fr', 'en', 'es', 'pt', 'de', 'it']) {
    assert.equal(existsSync(join(root, `src/app/${locale}`)), false, `src/app/${locale} ne doit pas exister`)
  }
})

test('French copy does not contain broken translation placeholders', () => {
  const brokenPatterns = [
    /\$\$\{/,
    /===\s*1\s*\?\s*['"]#\s/,
  ]
  const violations = []
  for (const path of sourceFiles()) {
    const source = stripComments(readFileSync(path, 'utf8'))
    for (const pattern of brokenPatterns) {
      if (pattern.test(source)) violations.push(`${relative(root, path)}: ${pattern}`)
    }
  }
  assert.deepEqual(violations, [], `placeholders de traduction cassés:\n${violations.join('\n')}`)
})
