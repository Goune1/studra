import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))

const componentFiles = [
  'src/components/sidebar.tsx',
  'src/components/dashboard-shell.tsx',
  'src/components/dashboard/DashboardActive.tsx',
  'src/components/dashboard/DashboardEmpty.tsx',
  'src/components/dashboard/UpgradeBanner.tsx',
  'src/components/ContentPicker.tsx',
  'src/components/content-input-form.tsx',
  'src/components/image-upload-input.tsx',
  'src/components/also-generate.tsx',
  'src/components/flashcard-card.tsx',
  'src/components/flashcards/FlashCard.tsx',
  'src/components/fiche-viewer.tsx',
  'src/components/DeleteEntityButton.tsx',
  'src/components/pro-gate.tsx',
]

const routeFiles = [
  'src/app/[locale]/(dashboard)/fiches/[ficheId]/page.tsx',
  'src/app/[locale]/(dashboard)/fiches/page-client.tsx',
  'src/app/[locale]/(dashboard)/fiches/new/page-client.tsx',
  'src/app/[locale]/(dashboard)/flashcards/[deckId]/page.tsx',
  'src/app/[locale]/(dashboard)/flashcards/page-client.tsx',
  'src/app/[locale]/(dashboard)/flashcards/new/page-client.tsx',
  'src/app/[locale]/(dashboard)/flashcards/[deckId]/study/page-client.tsx',
]

test('defines the dashboard core message catalog', () => {
  for (const namespace of ['common', 'components', 'dashboard', 'shell', 'home', 'fiches', 'flashcards']) {
    assert.ok(messages[namespace], `missing ${namespace}`)
    assert.ok(Object.keys(messages[namespace]).length > 0, `empty ${namespace}`)
  }
})

test('connects every dashboard core component and route to next-intl', () => {
  for (const path of [...componentFiles, ...routeFiles]) {
    const source = read(path)
    assert.match(source, /\b(useTranslations|getTranslations)\s*\(/, `${path} does not read translated messages`)
  }
})

test('uses localized navigation in dashboard core components', () => {
  for (const path of componentFiles.filter((path) => /sidebar|dashboard-shell|also-generate|pro-gate/.test(path))) {
    assert.match(read(path), /@\/i18n\/navigation/, `${path} does not use locale-aware navigation`)
  }
})

test('does not keep manual French locale formatting in the dashboard core', () => {
  for (const path of [...componentFiles, ...routeFiles]) {
    assert.doesNotMatch(read(path), /fr-FR|toLocale(?:DateString|String)\(/, `${path} keeps manual locale formatting`)
  }
})
