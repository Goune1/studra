import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const messages = JSON.parse(read('messages/fr.json'))
const namespaces = ['settings', 'billing', 'upgrade', 'bac', 'affiliate']
const clients = [
  'src/app/[locale]/(dashboard)/settings/page.tsx',
  'src/app/[locale]/(dashboard)/settings/revision/page-client.tsx',
  'src/app/[locale]/(dashboard)/billing/page.tsx',
  'src/app/[locale]/(dashboard)/upgrade/page.tsx',
  'src/app/[locale]/(dashboard)/bac/client.tsx',
  'src/app/[locale]/(dashboard)/bac/bac-gate.tsx',
  'src/app/[locale]/(dashboard)/bac/bac-simulator.tsx',
  'src/app/[locale]/(dashboard)/bac/grades-view.tsx',
  'src/app/[locale]/(dashboard)/affiliate/affiliate-gate.tsx',
  'src/components/affiliate/AffiliateRegistrationForm.tsx',
  'src/components/affiliate/AffiliateDashboard.tsx',
  'src/components/settings/MarketingConsentToggle.tsx',
  'src/components/checkout-button.tsx',
  'src/components/manage-subscription-button.tsx'
]

test('defines French account and integration dashboard catalogs', () => {
  for (const namespace of namespaces) {
    assert.ok(Object.keys(messages.dashboard[namespace]).length > 0, `empty dashboard.${namespace}`)
  }
})

test('connects account and integration screens to next-intl', () => {
  for (const path of clients) {
    const source = read(path)
    assert.match(source, /(useTranslations|getTranslations)\(/, `${path} is not translated`)
    assert.doesNotMatch(source, /['"]fr-FR['"]/, `${path} hardcodes fr-FR`)
  }
})

test('removes known account and integration copy from components', () => {
  const source = clients.map(read).join('\n')
  assert.doesNotMatch(source, /Passer à Pro|Erreur lors du checkout|Moyen de paiement mis à jour|Identifiant Pronote|Mot de passe Pronote|Emails marketing activés|Déconnexion de Pronote/)
})
