import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))
const targets = [
  'src/app/[locale]/(dashboard)/planning',
  'src/app/[locale]/(dashboard)/recall',
  'src/app/[locale]/(dashboard)/socrate',
  'src/app/[locale]/(dashboard)/lacunes',
  'src/components/lacunes'
]

for (const namespace of ['planning', 'recall', 'socrate', 'lacunes']) {
  test(`defines dashboard.${namespace} messages`, () => {
    assert.ok(messages.dashboard?.[namespace])
    assert.ok(Object.keys(messages.dashboard[namespace]).length > 0)
  })
}

test('targeted route components use next-intl and localized navigation', () => {
  const source = targets.map((path) => {
    return execFileSync('rg', ['--files', path], {encoding: 'utf8'}).trim().split('\n').filter(Boolean).map(read).join('\n')
  }).join('\n')

  assert.match(source, /useTranslations\(/)
  assert.match(source, /getTranslations\(/)
  assert.match(source, /@\/i18n\/navigation/)
  assert.doesNotMatch(source, /import\s+(?:Link|\{[^}]*\buseRouter\b[^}]*\})\s+from ['"]next\/(navigation|link)['"]|<a\s+href=/)
})

test('targeted UI does not retain known French copy inline', () => {
  const source = targets.map((path) => {
    return execFileSync('rg', ['--files', path], {encoding: 'utf8'}).trim().split('\n').filter(Boolean).map(read).join('\n')
  }).join('\n')

  assert.doesNotMatch(source, />\s*(?:Rappel libre|Lacunes|Lance une session|Réponds à Socrate|Aucune lacune|Erreur lors du démarrage)\s*</)
})

test('messages use ICU plural syntax for count copy', () => {
  const serialized = JSON.stringify(messages.dashboard)
  assert.match(serialized, /\{count, plural,/) 
})
