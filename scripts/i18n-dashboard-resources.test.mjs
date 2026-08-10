import assert from 'node:assert/strict'
import {readdirSync, readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))

const resourceNamespaces = ['schemas', 'timelines', 'exams', 'annales']
const resourceRoots = [
  'src/app/[locale]/(dashboard)/schemas',
  'src/app/[locale]/(dashboard)/timelines',
  'src/app/[locale]/(dashboard)/exams',
  'src/app/[locale]/(dashboard)/annales',
]

const filesUnder = (root) => readdirSync(new URL(`../${root}/`, import.meta.url), {withFileTypes: true})
  .flatMap((entry) => {
    const path = `${root}/${entry.name}`
    return entry.isDirectory() ? filesUnder(path) : /\.(tsx|ts)$/.test(entry.name) ? [path] : []
  })

test('defines non-empty dashboard resource namespaces', () => {
  assert.ok(messages.dashboard)
  for (const namespace of resourceNamespaces) {
    assert.ok(messages.dashboard[namespace], `missing dashboard.${namespace}`)
    assert.ok(Object.keys(messages.dashboard[namespace]).length > 0, `empty dashboard.${namespace}`)
  }
})

test('connects every resource route and specific component to next-intl', () => {
  const files = resourceRoots.flatMap(filesUnder).filter((path) => path.endsWith('page-client.tsx'))

  for (const path of [
    'src/components/timeline-viewer.tsx',
    'src/components/schema/Canvas.tsx',
    'src/components/schema/ContextBar.tsx',
    'src/components/schema/Minimap.tsx',
    'src/components/schema/Node.tsx',
    'src/components/schema/Toolbar.tsx',
  ]) {
    assert.match(read(path), /\b(useTranslations|getTranslations)\s*\(/, `${path} is not translated`)
  }
  for (const path of files) {
    assert.match(read(path), /\b(useTranslations|getTranslations)\s*\(/, `${path} is not translated`)
  }
})

test('uses localized navigation and formatting in resource routes', () => {
  for (const root of resourceRoots) {
    assert.ok(root)
  }

  const files = [
    'src/app/[locale]/(dashboard)/schemas/page-client.tsx',
    'src/app/[locale]/(dashboard)/timelines/page-client.tsx',
    'src/app/[locale]/(dashboard)/exams/page-client.tsx',
    'src/app/[locale]/(dashboard)/annales/page-client.tsx',
  ]
  for (const path of files) {
    const source = read(path)
    assert.match(source, /useTranslations\(/, `${path} has no translations`)
    assert.match(source, /@\/i18n\/navigation/, `${path} does not use localized navigation`)
  }
  assert.match(read('src/app/[locale]/(dashboard)/schemas/page-client.tsx'), /useFormatter\(/)
  assert.match(read('src/app/[locale]/(dashboard)/timelines/page-client.tsx'), /useFormatter\(/)
  assert.match(read('src/app/[locale]/(dashboard)/exams/page-client.tsx'), /useFormatter\(/)
  assert.match(read('src/app/[locale]/(dashboard)/annales/page-client.tsx'), /useFormatter\(/)
})

test('removes visible French resource copy from route and specific component source', () => {
  const source = [
    ...resourceRoots.flatMap(filesUnder),
    'src/components/timeline-viewer.tsx',
    'src/components/schema/Canvas.tsx',
    'src/components/schema/ContextBar.tsx',
    'src/components/schema/Minimap.tsx',
    'src/components/schema/Node.tsx',
    'src/components/schema/Toolbar.tsx',
  ]
    .filter((path) => path.endsWith('.tsx'))
    .map(read)
    .join('\n')

  assert.doesNotMatch(source, /Créer un schéma|Nouvelle frise|Nouvel examen|Enregistrer|Supprimer|Chargement du canvas/)
})
