import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import Link from 'next/link'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'

const LAST_UPDATED = '10 avril 2026'
const CONTACT_EMAIL = 'contact@studra.fr'
const APP_NAME = 'Studra'
const APP_URL = 'https://studra.fr'
const PRICE_PRO_MONTHLY = '4,99 €'

export const metadata = {
  title: 'Conditions Générales de Vente',
  description: "Consultez les Conditions Générales de Vente de Studra : tarifs, abonnements, remboursements et politique de facturation.",
  alternates: { canonical: 'https://studra.fr/cgv' },
  robots: { index: true, follow: true },
}

const sections = [
  {
    id: 'vendeur',
    title: '1. Identité du vendeur',
    content: `Le Service ${APP_NAME}, accessible à l'adresse ${APP_URL}, est édité et exploité par un entrepreneur individuel (ci-après « le Vendeur »).

Contact : ${CONTACT_EMAIL}

Pour toute question relative à une commande ou à votre abonnement, vous pouvez contacter le Vendeur à l'adresse e-mail ci-dessus.`,
  },
  {
    id: 'objet',
    title: '2. Objet',
    content: `Les présentes Conditions Générales de Vente (ci-après « CGV ») s'appliquent à toute souscription d'un abonnement payant (offre Pro) sur la plateforme ${APP_NAME}.

Elles complètent les Conditions Générales d'Utilisation (CGU) disponibles à l'adresse ${APP_URL}/cgu. En cas de contradiction, les CGV prévalent sur les CGU pour les aspects commerciaux.

Toute souscription à l'offre Pro implique l'acceptation sans réserve des présentes CGV.`,
  },
  {
    id: 'offres',
    title: '3. Description des offres',
    content: `${APP_NAME} propose les offres suivantes :

Offre Gratuite (sans frais)
• 5 générations IA par mois calendaire
• Accès à tous les formats (flashcards, fiches, schémas, frises, examens)
• Aucun engagement, aucune carte bancaire requise

Offre Pro (abonnement payant)
• Générations IA illimitées
• Accès à toutes les fonctionnalités présentes et futures
• Support prioritaire

Le détail et les tarifs en vigueur sont consultables sur la page Tarifs du site. Le Vendeur se réserve le droit de faire évoluer les fonctionnalités incluses dans chaque offre, avec information préalable des abonnés.`,
  },
  {
    id: 'prix',
    title: '4. Prix et modalités de paiement',
    content: `Les prix sont indiqués en euros, toutes taxes comprises (TTC).

Au jour de la dernière mise à jour des présentes CGV, les tarifs de l'offre Pro sont :
• Mensuel : ${PRICE_PRO_MONTHLY} / mois

Le Vendeur se réserve le droit de modifier ses tarifs à tout moment. Les abonnés en cours seront informés de toute hausse de prix au moins 30 jours avant sa prise d'effet. Le nouveau tarif s'appliquera à la prochaine période de facturation suivant l'information.

Le paiement est effectué en ligne, de manière sécurisée, via Stripe. Sont acceptés : cartes bancaires Visa, Mastercard, American Express. Le débit intervient au moment de la souscription, puis à chaque renouvellement.

Le Vendeur ne stocke aucune donnée bancaire. Toutes les transactions sont chiffrées et traitées exclusivement par Stripe (certifié PCI-DSS).

Une facture électronique est émise automatiquement à chaque paiement et transmise à l'adresse e-mail de l'abonné.`,
  },
  {
    id: 'souscription',
    title: '5. Souscription et prise d\'effet',
    content: `La souscription à l'offre Pro s'effectue en ligne depuis la page Paramètres du compte ou depuis la page Tarifs. La commande est définitive après validation du paiement par Stripe.

Un e-mail de confirmation est envoyé à l'adresse enregistrée sur le compte. L'accès aux fonctionnalités Pro est activé immédiatement après validation du paiement.

L'abonnement est conclu pour une durée d'un mois ou d'un an selon la formule choisie, et se renouvelle automatiquement à son terme dans les mêmes conditions, sauf résiliation préalable.`,
  },
  {
    id: 'retractation',
    title: '6. Droit de rétractation',
    content: `Conformément aux articles L. 221-18 et suivants du Code de la consommation, l'utilisateur consommateur dispose d'un délai de 14 jours à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.

Cependant, conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé avec l'accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.

En souscrivant à l'offre Pro et en accédant immédiatement aux fonctionnalités, l'utilisateur reconnaît expressément que l'exécution du contrat a commencé avant l'expiration du délai de 14 jours et renonce en conséquence à son droit de rétractation.

Si l'utilisateur souhaite exercer son droit de rétractation sans avoir utilisé les fonctionnalités Pro, il peut contacter le Vendeur à ${CONTACT_EMAIL} dans le délai de 14 jours. Le remboursement sera effectué dans un délai de 14 jours suivant la réception de la demande, par le même moyen de paiement que celui utilisé lors de la souscription.`,
  },
  {
    id: 'resiliation',
    title: '7. Résiliation de l\'abonnement',
    content: `L'abonné peut résilier son abonnement Pro à tout moment depuis la page Paramètres de son compte (rubrique « Paramètres » → « Gérer mon abonnement »).

La résiliation prend effet à la fin de la période de facturation en cours. L'abonné conserve l'accès aux fonctionnalités Pro jusqu'à cette date. Aucun remboursement prorata temporis n'est effectué pour la période restante, sauf en cas d'exercice du droit de rétractation dans les conditions de l'article 6 ci-dessus.

À l'issue de la période Pro, le compte bascule automatiquement vers l'offre Gratuite. Les données et contenus de l'utilisateur sont conservés.

Le Vendeur se réserve le droit de résilier un abonnement en cas de violation des CGU, sans remboursement.`,
  },
  {
    id: 'inexecution',
    title: '8. Inexécution et force majeure',
    content: `Le Vendeur s'engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité du Service 24h/24, 7j/7. Des interruptions ponctuelles peuvent toutefois survenir pour maintenance, mises à jour ou pour des raisons techniques indépendantes de la volonté du Vendeur.

En cas d'indisponibilité prolongée du Service (supérieure à 72 heures consécutives) imputable au Vendeur, l'abonné peut demander un avoir ou une prolongation de son abonnement à hauteur de la durée d'indisponibilité.

Le Vendeur ne saurait être tenu responsable de l'inexécution de ses obligations en cas de force majeure, au sens de l'article 1218 du Code civil, incluant notamment les pannes de fournisseurs tiers (hébergement, IA, paiement), catastrophes naturelles, ou décisions gouvernementales.`,
  },
  {
    id: 'garanties',
    title: '9. Garanties et qualité du service',
    content: `Le Vendeur garantit que le Service fonctionne conformément à sa description au moment de la souscription.

Compte tenu de la nature du Service reposant sur des modèles d'intelligence artificielle, le Vendeur ne peut garantir :
• L'exactitude, la complétude ou la pertinence des contenus générés ;
• L'adéquation des contenus générés à un usage pédagogique, professionnel ou à des examens officiels particuliers.

Les contenus générés sont fournis à titre d'aide à la révision. L'utilisateur est seul responsable de leur vérification et de l'usage qu'il en fait.

Conformément aux articles L. 217-1 et suivants du Code de la consommation, le consommateur bénéficie de la garantie légale de conformité pour les services numériques. En cas de défaut de conformité, le consommateur peut demander la mise en conformité du service ou, si celle-ci est impossible, une réduction du prix ou la résolution du contrat.`,
  },
  {
    id: 'responsabilite',
    title: '10. Responsabilité',
    content: `La responsabilité du Vendeur ne peut être engagée qu'en cas de faute prouvée. En tout état de cause, la responsabilité du Vendeur est limitée au montant des sommes effectivement versées par l'abonné au cours des 12 mois précédant le fait générateur.

Le Vendeur ne saurait être responsable des dommages indirects tels que perte de données, manque à gagner, préjudice commercial ou atteinte à la réputation résultant de l'utilisation ou de l'impossibilité d'utiliser le Service.`,
  },
  {
    id: 'donnees',
    title: '11. Données personnelles',
    content: `Dans le cadre des transactions commerciales, le Vendeur collecte et traite les données suivantes :
• Adresse e-mail (identification et facturation) ;
• Historique des paiements (via Stripe).

Ces données sont conservées pendant la durée légale de 10 ans à compter de la transaction pour les obligations comptables et fiscales.

Pour plus d'informations sur le traitement des données personnelles, voir les CGU (article 7 — Données personnelles) et la politique de confidentialité disponible à ${APP_URL}/cgu.`,
  },
  {
    id: 'droit',
    title: '12. Droit applicable et litiges',
    content: `Les présentes CGV sont soumises au droit français.

En cas de litige, le consommateur est invité à contacter en premier lieu le Vendeur à ${CONTACT_EMAIL} pour tenter de trouver une solution amiable.

À défaut de résolution amiable dans un délai de 60 jours, le consommateur peut recourir gratuitement à un médiateur de la consommation agréé. Les coordonnées du médiateur compétent seront communiquées sur demande.

Le consommateur peut également recourir à la plateforme de résolution des litiges en ligne mise à disposition par la Commission européenne, accessible à l'adresse : https://ec.europa.eu/consumers/odr

En dernier recours, les tribunaux français compétents seront saisis.`,
  },
]

export default async function CGVPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="landing-v2 min-h-screen">
      <Nav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Header */}
        <div className="mb-12">
          <p className="mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>Légal</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Conditions Générales de Vente
          </h1>
          <p className="mono text-sm" style={{ color: 'var(--ink-500)' }}>
            Dernière mise à jour : {LAST_UPDATED}
          </p>
        </div>

        {/* Sommaire */}
        <div className="rounded-2xl p-6 mb-12" style={{ border: '1px solid var(--ink-200)', background: 'var(--bg-elev)' }}>
          <p className="mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--ink-500)' }}>Sommaire</p>
          <nav className="grid sm:grid-cols-2 gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="mono text-sm legal-toc-link">
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold mb-4 pb-3" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--ink-200)', letterSpacing: '-0.01em' }}>
                {s.title}
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--ink-700)' }}>
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Back */}
        <div className="mt-16 pt-8 flex items-center justify-between" style={{ borderTop: '1px solid var(--ink-200)' }}>
          <Link href="/" className="mono text-xs transition-colors" style={{ color: 'var(--ink-500)' }}>
            ← Retour à l&apos;accueil
          </Link>
          <a href="#" className="mono text-xs transition-colors" style={{ color: 'var(--ink-500)' }}>
            Haut de page ↑
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
