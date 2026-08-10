import assert from 'node:assert/strict'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

async function loadSeoHelpers() {
  const directory = await mkdtemp(join(tmpdir(), 'studra-seo-i18n-'))
  const source = await read('src/lib/seo-i18n.ts')
  const compile = (input) => ts.transpileModule(input, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText

  const pathnameStub = `
    export const locales = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
    export const defaultLocale = 'fr' as const
    export function isAppLocale(value: unknown) {
      return typeof value === 'string' && locales.includes(value as never)
    }
    export function getLocalizedPathname(pathname: string, locale: string) {
      if (locale === defaultLocale) return pathname
      return pathname === '/' ? '/' + locale : '/' + locale + pathname
    }
  `

  try {
    await Promise.all([
      writeFile(join(directory, 'pathname.js'), compile(pathnameStub)),
      writeFile(
        join(directory, 'seo-i18n.js'),
        compile(source).replaceAll("require(\"@/i18n/pathname\")", "require(\"./pathname.js\")"),
      ),
    ])
    return await import(pathToFileURL(join(directory, 'seo-i18n.js')).href)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

test('indexes French metadata and keeps untranslated locales out of the index', async () => {
  const {localizedMetadata} = await loadSeoHelpers()

  const french = localizedMetadata({title: 'Accueil'}, '/', 'fr')
  assert.equal(french.alternates.canonical, 'https://studra.fr')
  assert.equal(french.alternates.languages.fr, 'https://studra.fr')
  assert.equal(french.alternates.languages.en, undefined)
  assert.equal(french.alternates.languages['x-default'], 'https://studra.fr')

  const german = localizedMetadata({title: 'Blog'}, '/blog', 'de')
  assert.equal(german.alternates.canonical, 'https://studra.fr/blog')
  assert.equal(german.alternates.languages, undefined)
  assert.deepEqual(german.robots, {index: false, follow: true})
})

test('keeps the sitemap French-only until translated locales are enabled', async () => {
  const {buildLocalizedSitemapEntries} = await loadSeoHelpers()
  const entries = buildLocalizedSitemapEntries([
    {pathname: '/', lastModified: '2026-04-24', changeFrequency: 'weekly', priority: 1},
    {pathname: '/blog', lastModified: '2026-04-24', changeFrequency: 'weekly', priority: 0.7},
  ])

  assert.equal(entries.length, 2)
  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      'https://studra.fr',
      'https://studra.fr/blog',
    ],
  )

  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.alternates.languages), [
      'fr', 'x-default',
    ])
  }
})

test('all public indexable page types generate localized metadata', async () => {
  const pages = [
    'src/app/[locale]/page.tsx',
    'src/app/[locale]/blog/page.tsx',
    'src/app/[locale]/blog/[slug]/page.tsx',
    'src/app/[locale]/changelog/page.tsx',
    'src/app/[locale]/cgu/page.tsx',
    'src/app/[locale]/cgv/page.tsx',
    'src/app/[locale]/confidentialite/page.tsx',
    'src/app/[locale]/(seo)/flashcards-ia/page.tsx',
    'src/app/[locale]/(seo)/fiches-de-revision-ia/page.tsx',
    'src/app/[locale]/(seo)/repetition-espacee/page.tsx',
    'src/app/[locale]/(seo)/examen-blanc-ia/page.tsx',
  ]

  for (const page of pages) {
    const source = await read(page)
    assert.match(source, /generateMetadata/, `${page} must generate locale-aware metadata`)
    assert.match(source, /localizedMetadata/, `${page} must use the shared alternate builder`)
  }
})

test('localized layout does not impose the French canonical on every route', async () => {
  const source = await read('src/app/[locale]/layout.tsx')
  assert.doesNotMatch(source, /alternates:\s*\{\s*canonical:\s*['"]https:\/\/studra\.fr['"]/)
})

test('sitemap uses the shared localized entry builder', async () => {
  const source = await read('src/app/sitemap.ts')
  assert.match(source, /buildLocalizedSitemapEntries/)
  assert.doesNotMatch(source, /url:\s*`\$\{BASE_URL\}/)
})
