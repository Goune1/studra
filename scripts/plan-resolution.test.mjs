import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')

function sourceFiles(dir = join(root, 'src')) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry) ? [relative(root, path)] : []
  })
}

// Seul module autorisé à interpréter les colonnes de plan.
const PLAN_MODULE = 'src/lib/plan.ts'

// Programme d'affiliation (hors périmètre du chantier parrainage) : ces
// fichiers comptent des abonnés Stripe payants via la colonne plan, que seul
// le webhook écrit. Leur sémantique n'est pas l'accès Pro.
const AFFILIATE_STRIPE_READERS = new Set([
  'src/lib/affiliate.ts',
  'src/app/api/admin/affiliates/route.ts',
  'src/app/api/admin/affiliates/[id]/route.ts',
  'src/app/admin/affiliates/page.tsx',
  'src/app/admin/affiliates/[id]/page.tsx',
])

// Exceptions ponctuelles, justifiées : ce ne sont pas des lectures du plan
// d'un utilisateur.
const ALLOWED_LINES = [
  // Filtre de destinataires choisi par l'admin ('free' | 'pro'), converti en is_pro.
  { file: 'src/lib/email-marketing.ts', pattern: /\.eq\(IS_PRO_FIELD, filter\.plan === 'pro'\)/ },
  // Déclaration du type Profile (colonne sélectionnée par `*`), sans lecture.
  { file: 'src/types/index.ts', pattern: /^\s*pro_until: string \| null$/ },
  // Résultat de la RPC referral_qualify : date du mois offert qui vient d'être
  // accordé, jamais utilisée pour décider de l'accès Pro.
  { file: 'src/lib/referral.ts', pattern: /^\s*pro_until\?: string \| null$|row\.pro_until/ },
]

const FORBIDDEN = [
  { name: "comparaison plan === 'pro' | 'free'", pattern: /\bplan\s*[!=]==?\s*['"](?:pro|free)['"]/ },
  { name: "comparaison 'pro' | 'free' === plan", pattern: /['"](?:pro|free)['"]\s*[!=]==?\s*[\w?.]*\bplan\b/ },
  { name: 'filtre SQL sur la colonne plan', pattern: /\.(?:eq|neq|in|filter|match)\(\s*['"]plan['"]/ },
  { name: 'sélection de la colonne plan', pattern: /\.select\(\s*[`'"][^`'"]*(?<![\w_])plan(?![\w_])/ },
  { name: 'lecture directe de pro_until', pattern: /\bpro_until\b/ },
]

test('la règle Pro n’est interprétée que par src/lib/plan.ts', () => {
  const violations = []
  for (const file of sourceFiles()) {
    if (file === PLAN_MODULE || AFFILIATE_STRIPE_READERS.has(file)) continue
    const lines = read(file).split('\n')
    lines.forEach((line, index) => {
      if (ALLOWED_LINES.some((allowed) => allowed.file === file && allowed.pattern.test(line))) return
      for (const { name, pattern } of FORBIDDEN) {
        if (pattern.test(line)) violations.push(`${file}:${index + 1} — ${name}\n    ${line.trim()}`)
      }
    })
  }
  assert.deepEqual(violations, [], `Passer par resolvePlan / PLAN_SELECT :\n${violations.join('\n')}`)
})

test('src/lib/plan.ts lit is_pro et ne recalcule pas la règle', () => {
  const source = read(PLAN_MODULE)
  assert.match(source, /export const PLAN_SELECT = '[^']*\bis_pro\b/)
  assert.match(source, /isPro = row\?\.is_pro === true/)
  assert.doesNotMatch(source, /Date\.now|new Date|getTime/, 'aucune comparaison de date côté TypeScript')
  assert.doesNotMatch(source, /from ['"]@\/lib\/supabase\/server['"]|next\/headers/, 'module utilisable côté client')
})

const CALL_SITES = [
  'src/lib/generation-quota.ts',
  'src/app/(dashboard)/dashboard-layout-content.tsx',
  'src/lib/dashboard/queries.ts',
  'src/components/pro-gate.tsx',
  'src/app/(dashboard)/lacunes/page-client.tsx',
  'src/app/(dashboard)/socrate/new/page-client.tsx',
  'src/app/(dashboard)/socrate/[sessionId]/page-client.tsx',
  'src/app/(dashboard)/billing/page.tsx',
  'src/app/(dashboard)/settings/page.tsx',
  'src/app/(dashboard)/upgrade/page.tsx',
  'src/lib/admin/queries.ts',
  'src/lib/email-marketing.ts',
]

for (const file of CALL_SITES) {
  test(`${file} résout le plan via src/lib/plan.ts`, () => {
    assert.match(read(file), /from '@\/lib\/plan'/)
  })
}

test('les lectures de profil qui résolvent le plan sélectionnent le champ calculé is_pro', () => {
  for (const file of CALL_SITES.filter((path) => path !== 'src/lib/email-marketing.ts' && path !== 'src/components/pro-gate.tsx')) {
    const source = read(file)
    assert.match(source, /PLAN_SELECT|select\('\*, is_pro'\)/, `${file} doit sélectionner is_pro`)
  }
})

test('billing, settings et upgrade distinguent abonnement Stripe et Pro offert (Q4)', () => {
  for (const file of ['src/app/(dashboard)/billing/page.tsx', 'src/app/(dashboard)/settings/page.tsx']) {
    const source = read(file)
    assert.match(source, /hasStripeSubscription \? hasStripeCustomer && <ManageSubscriptionButton \/> : <CheckoutButton \/>/, file)
    assert.match(source, /Pro offert jusqu'au/, file)
    assert.match(source, /ne sont pas reportés/, file)
  }
  const upgrade = read('src/app/(dashboard)/upgrade/page.tsx')
  assert.match(upgrade, /if \(hasStripeSubscription\) redirect\('\/dashboard'\)/)
  assert.doesNotMatch(upgrade, /if \(isPro\) redirect/)
})

test("en SQL, plan = 'pro' n'apparaît plus que dans public.is_pro", () => {
  const migration = read('supabase/migrations/021_pro_entitlement.sql')
  const code = migration.replace(/--.*$/gm, '')
  assert.match(code, /create or replace function public\.is_pro\(p public\.profiles\)/)
  assert.equal(code.match(/plan = 'pro'/g)?.length, 1, "une seule occurrence : dans is_pro")
  assert.equal(code.match(/public\.is_pro\(p\)/g)?.length, 6, 'consume_generation_credit + 5 policies')
})
