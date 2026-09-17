import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { summarizeReferrals } from '../src/lib/referral-summary.ts'
import { referralLink } from '../src/lib/referral-code.ts'

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')

const referral = (id, createdAt, overrides = {}) => ({
  id,
  status: 'pending',
  created_at: createdAt,
  qualified_at: null,
  consumed_at: null,
  reward_id: null,
  ...overrides,
})
const qualified = (id, createdAt, overrides = {}) =>
  referral(id, createdAt, { status: 'qualified', qualified_at: createdAt, ...overrides })

test('aucun filleul : tout à zéro, progression 0/2', () => {
  assert.deepEqual(summarizeReferrals([], []), { qualifiedCount: 0, monthsGranted: 0, capReached: false, progress: 0, history: [] })
})

test('un qualifié non consommé et un pending : 1/2, historique du plus récent au plus ancien', () => {
  const summary = summarizeReferrals([
    referral('b', '2026-09-12T10:00:00Z'),
    qualified('a', '2026-09-10T10:00:00Z'),
  ], [])
  assert.equal(summary.qualifiedCount, 1)
  assert.equal(summary.progress, 1)
  assert.deepEqual(summary.history.map(({ id, position, status }) => ({ id, position, status })), [
    { id: 'b', position: 2, status: 'pending' },
    { id: 'a', position: 1, status: 'qualified' },
  ])
})

test('deux filleuls consommés : 1 mois, progression repartie à 0, rang du mois affiché', () => {
  const summary = summarizeReferrals([
    qualified('a', '2026-09-10T10:00:00Z', { consumed_at: '2026-09-11T10:00:00Z', reward_id: 'r1' }),
    qualified('b', '2026-09-11T10:00:00Z', { consumed_at: '2026-09-11T10:00:00Z', reward_id: 'r1' }),
  ], [{ id: 'r1', sequence: 1 }])
  assert.equal(summary.monthsGranted, 1)
  assert.equal(summary.progress, 0)
  assert.ok(summary.history.every((item) => item.status === 'rewarded' && item.rewardSequence === 1))
})

test('plafond : progression masquée, filleuls non consommés marqués au-delà du plafond', () => {
  const rows = []
  const rewards = [{ id: 'r1', sequence: 1 }, { id: 'r2', sequence: 2 }, { id: 'r3', sequence: 3 }]
  for (let n = 1; n <= 6; n++) rows.push(qualified(`c${n}`, `2026-09-0${n}T10:00:00Z`, { consumed_at: '2026-09-09T10:00:00Z', reward_id: `r${Math.ceil(n / 2)}` }))
  rows.push(qualified('c7', '2026-09-08T10:00:00Z'))
  const summary = summarizeReferrals(rows, rewards)
  assert.equal(summary.capReached, true)
  assert.equal(summary.progress, null)
  assert.equal(summary.qualifiedCount, 7)
  assert.equal(summary.history[0].status, 'over_cap')
})

test('l’historique ne contient aucune donnée personnelle', () => {
  const summary = summarizeReferrals([qualified('a', '2026-09-10T10:00:00Z')], [])
  assert.deepEqual(Object.keys(summary.history[0]).sort(), ['id', 'position', 'qualifiedAt', 'rewardSequence', 'signedUpAt', 'status'])
})

test('le lien suit le format https://www.studra.fr/?ref=CODE', () => {
  assert.equal(referralLink('X25C2F94'), 'https://www.studra.fr/?ref=X25C2F94')
})

const PAGE = 'src/app/(dashboard)/settings/parrainage/page.tsx'
const VIEW = 'src/app/(dashboard)/settings/parrainage/parrainage-view.tsx'
const NEW_UI_FILES = [
  PAGE,
  VIEW,
  'src/components/referral/CopyReferralLinkButton.tsx',
  'src/components/referral/copy-referral-link-button.module.css',
  'src/app/(dashboard)/settings/parrainage/parrainage.module.css',
  'src/app/(dashboard)/settings/settings-nav.tsx',
  'src/app/(dashboard)/settings/layout.tsx',
  'src/app/(dashboard)/settings/settings-layout.module.css',
]

test('la page ne lit jamais les colonnes masquées au parrain', () => {
  const page = read(PAGE)
  assert.doesNotMatch(page, /referred_id|referred_email_hash|email/)
  assert.match(page, /\.from\('referrals'\)\s*\.select\('id, status, created_at, qualified_at, consumed_at, reward_id'\)/)
  assert.match(page, /PLAN_SELECT/)
})

test('design system : Lucide 1.5, pas d’orange, d’ombre, de dégradé ni d’emoji', () => {
  for (const file of NEW_UI_FILES) {
    const source = read(file)
    assert.doesNotMatch(source, /box-shadow|shadow-|gradient/i, `${file} : ombre ou dégradé`)
    assert.doesNotMatch(source, /orange|amber|#f59e0b|#f97316|#ea580c|#c2410c/i, `${file} : orange`)
    assert.doesNotMatch(source, /\p{Extended_Pictographic}/u, `${file} : emoji`)
    assert.doesNotMatch(source, /@phosphor-icons/, `${file} : icônes Lucide uniquement`)
    for (const icon of source.matchAll(/<(Check|Copy|Brain|Gift|UserRound|Icon)\s[^>]*\/>/g)) {
      assert.match(icon[0], /strokeWidth=\{1\.5\}/, `${file} : ${icon[1]} sans strokeWidth 1.5`)
    }
  }
})

test('entrée uniquement dans la navigation des paramètres, pas dans la sidebar principale', () => {
  const nav = read('src/app/(dashboard)/settings/settings-nav.tsx')
  assert.match(nav, /href: '\/settings', label: 'Compte'/)
  assert.match(nav, /href: '\/settings\/revision', label: 'Révision'/)
  assert.match(nav, /href: '\/settings\/parrainage', label: 'Parrainage'/)
  assert.doesNotMatch(read('src/components/sidebar.tsx'), /parrainage/i)
  assert.doesNotMatch(read('src/components/dashboard/DashboardActive.tsx') + read('src/components/dashboard/DashboardEmpty.tsx'), /parrainage/i)
})
