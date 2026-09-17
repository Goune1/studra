import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { shouldPromoteReferral } from '../src/lib/referral-summary.ts'

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')

test('le bandeau ne cible que les utilisateurs pour qui un mois offert a de la valeur', () => {
  const base = { referralCode: 'X25C2F94', hasStripeSubscription: false, monthsGranted: 0 }
  assert.equal(shouldPromoteReferral(base), true, 'gratuit sans mois obtenu')
  assert.equal(shouldPromoteReferral({ ...base, monthsGranted: 2 }), true, 'encore un mois à gagner')
  assert.equal(shouldPromoteReferral({ ...base, monthsGranted: 3 }), false, 'plafond atteint')
  assert.equal(shouldPromoteReferral({ ...base, hasStripeSubscription: true }), false, 'abonné Stripe')
  assert.equal(shouldPromoteReferral({ ...base, referralCode: null }), false, 'sans code')
})

test('les données du dashboard calculent le lien uniquement quand le bandeau doit apparaître', () => {
  const queries = read('src/lib/dashboard/queries.ts')
  assert.match(queries, /\.from\('referral_rewards'\)\.select\('id', \{ count: 'exact', head: true \}\)\.eq\('referrer_id', user\.id\)/)
  assert.match(queries, /shouldPromoteReferral\(\{\s*referralCode: profile\?\.referral_code,\s*hasStripeSubscription,\s*monthsGranted: referralRewardsRes\.count \?\? 0,/)
  assert.match(queries, /referralPromo: promoteReferral && !referralRewardsRes\.error \? \{ link: referralLink\(profile!\.referral_code\) \} : null/)
})

test('placement : dashboard actif seulement, sous le programme du jour, jamais sur l’état vide', () => {
  const active = read('src/components/dashboard/DashboardActive.tsx')
  const banner = active.indexOf('{referralPromo && <ReferralBanner link={referralPromo.link} />}')
  assert.ok(banner > active.indexOf('className={styles.workGrid}'), 'après le bloc principal')
  assert.ok(banner > active.indexOf('className={styles.queueCard}'), 'après le programme du jour')
  assert.ok(banner < active.indexOf('className={styles.supportCard}'), 'avant rythme et outils')
  assert.doesNotMatch(read('src/components/dashboard/DashboardEmpty.tsx'), /ReferralBanner|referral/i)
  assert.doesNotMatch(read('src/components/sidebar.tsx'), /parrainage/i)
})

test('le bandeau se ferme durablement par navigateur, sans flash ni erreur de stockage', () => {
  const banner = read('src/components/dashboard/ReferralBanner.tsx')
  assert.match(banner, /const DISMISSED_KEY = 'studra:referral-banner-dismissed'/)
  assert.match(banner, /useState\(false\)/, 'invisible avant lecture du navigateur')
  assert.equal(banner.match(/try \{/g)?.length, 2, 'lecture et écriture protégées')
  assert.match(banner, /if \(readDismissed\(\)\) return[\s\S]*setVisible\(true\)[\s\S]*trackReferralBannerViewed\(\)/)
  assert.match(banner, /storeDismissed\(\)\s*setVisible\(false\)\s*trackReferralBannerDismissed\(\)/)
  assert.match(banner, /<CopyReferralLinkButton link=\{link\} source="dashboard_banner" \/>/)
  assert.match(banner, /href="\/settings\/parrainage"/)
  assert.match(banner, /aria-label="Masquer le bandeau de parrainage"/)
})

test('le paywall propose le parrainage à côté de l’abonnement, sur la modale comme sur le bandeau', () => {
  const modal = read('src/components/paywall/PaywallModal.tsx')
  assert.match(modal, /href="\/settings\/parrainage"\s*onClick=\{\(\) => trackReferralPaywallClicked\(tool, 'modal'\)\}/)
  assert.ok(modal.indexOf('Invite 2 amis') > modal.indexOf('handleCheckout}'), 'après le bouton Passer Pro')
  const banner = read('src/components/paywall/PaywallBanner.tsx')
  assert.match(banner, /href="\/settings\/parrainage"\s*onClick=\{\(\) => trackReferralPaywallClicked\(tool, 'banner'\)\}/)
  assert.match(banner, /href="\/upgrade"/, 'l’offre Pro reste proposée')
  assert.match(read('src/lib/analytics.ts'), /capture\('referral_paywall_clicked', \{ tool, surface \}\)/)
})

test('événements du bandeau et design system', () => {
  const analytics = read('src/lib/analytics.ts')
  assert.match(analytics, /capture\('referral_banner_viewed'\)/)
  assert.match(analytics, /capture\('referral_banner_dismissed'\)/)
  for (const file of ['src/components/dashboard/ReferralBanner.tsx', 'src/components/dashboard/referral-banner.module.css']) {
    const source = read(file)
    assert.doesNotMatch(source, /box-shadow|shadow-|gradient/i, `${file} : ombre ou dégradé`)
    assert.doesNotMatch(source, /orange|amber|#f59e0b|#f97316/i, `${file} : orange`)
    assert.doesNotMatch(source, /\p{Emoji_Presentation}/u, `${file} : emoji`)
    assert.doesNotMatch(source, /accent-soft/, `${file} : fond de carte coloré`)
    for (const icon of source.matchAll(/<(Gift|X)\s[^>]*\/>/g)) assert.match(icon[0], /strokeWidth=\{1\.5\}/, `${file} : ${icon[1]}`)
  }
})
