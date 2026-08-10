import assert from 'node:assert/strict'
import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {test} from 'node:test'

const root = new URL('../', import.meta.url).pathname
const dashboardRoot = join(root, 'src/app/[locale]/(dashboard)')
const componentTargets = [
  'src/components/sidebar.tsx',
  'src/components/dashboard-shell.tsx',
  'src/components/dashboard',
  'src/components/affiliate',
  'src/components/lacunes',
  'src/components/schema',
  'src/components/settings',
  'src/components/ContentPicker.tsx',
  'src/components/DeleteEntityButton.tsx',
  'src/components/also-generate.tsx',
  'src/components/checkout-button.tsx',
  'src/components/content-input-form.tsx',
  'src/components/fiche-viewer.tsx',
  'src/components/flashcard-card.tsx',
  'src/components/flashcards',
  'src/components/image-upload-input.tsx',
  'src/components/manage-subscription-button.tsx',
  'src/components/pro-gate.tsx',
  'src/components/timeline-viewer.tsx'
].map((path) => join(root, path))

function files(path) {
  if (!statSync(path).isDirectory()) return [path]
  return readdirSync(path).flatMap((name) => files(join(path, name)))
}

const targets = [dashboardRoot, ...componentTargets]
  .flatMap(files)
  .filter((path) => /\.(tsx|ts)$/.test(path))

const visibleResiduals = /écris tout ce que tu sais|Moyenne générale|Aucune note pour cette période|Aucune matière disponible|Analyse tes matières Pronote|Moyenne Pronote agrégée|Notes estimées le jour J|Mention estimée|Erreur lors de la recherche des établissements|Pronote connecté avec succès|Données synchronisées|Synchroniser les données|Déconnecter Pronote|Étape 1 - Trouver votre établissement|Créer une autre fiche|Générer la fiche|Révolution Française|Aucune fiche ne correspond|Créer un autre deck|Générer les cartes|photosynthèse|Crée ton premier deck|Session terminée|Prochaine révision|Répétition espacée \(FSRS\)|Rétention cible|Enregistrer les paramètres|révision\$\{settings\.total_reviews/

test('dashboard has no residual hardcoded locale formatting', () => {
  for (const path of targets) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /['"]fr-FR['"]|\.toLocale(?:DateString|String)\(/, path)
  }
})

test('dashboard has no known residual French UI copy', () => {
  for (const path of targets) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), visibleResiduals, path)
  }
})

test('dashboard does not import raw Next links or routers', () => {
  for (const path of targets) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /from ['"]next\/link['"]/, path)
    assert.doesNotMatch(source, /import\s*\{[^}]*\buseRouter\b[^}]*\}\s*from ['"]next\/navigation['"]/, path)
  }
})
