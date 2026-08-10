import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))

for (const route of ['login', 'register', 'forgot-password', 'reset-password']) {
  const key = route.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

  test(`defines ${route} messages and localized metadata`, () => {
    assert.ok(Object.keys(messages.auth[key]).length > 0, `empty auth.${key}`)
    assert.ok(messages.auth[key].metadata)
    const layout = read(`src/app/[locale]/(auth)/${route}/layout.tsx`)
    assert.match(layout, /generateMetadata/)
    assert.match(layout, /getTranslations\(/)
    assert.doesNotMatch(layout, /export\s+const\s+metadata/)
  })

  test(`connects the ${route} client UI to next-intl`, () => {
    const client = read(`src/app/[locale]/(auth)/${route}/page-client.tsx`)
    assert.match(client, /useTranslations\(/)
  })
}

test('removes known French auth copy from route components', () => {
  const source = [
    read('src/app/[locale]/(auth)/login/page-client.tsx'),
    read('src/app/[locale]/(auth)/register/page-client.tsx')
  ].join('\n')
  assert.doesNotMatch(source, /Bon retour parmi nous|Commencez à réviser intelligemment|Continuer avec Google|Pas encore de compte|Déjà un compte|Créer mon compte|Compte créé !/)
})
