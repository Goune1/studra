import type {Locale} from 'next-intl'
import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import Link from 'next/link'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'
import {localizedMetadata} from '@/lib/seo-i18n'

const LAST_UPDATED = '10 avril 2026'
const CONTACT_EMAIL = 'contact@studra.fr'
const APP_NAME = 'Studra'
const APP_URL = 'https://studra.fr'

const baseMetadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Consultez les Conditions Générales d'Utilisation de Studra, la plateforme de révision intelligente propulsée par l'IA.",
  robots: { index: true, follow: true },
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params
  return localizedMetadata(baseMetadata, '/cgu', locale)
}

const sections = [
  {
    id: 'objet',
    title: '1. Objet',
    content: `Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions dans lesquelles ${APP_NAME} (ci-après « le Service ») est mis à disposition des utilisateurs, ainsi que les droits et obligations respectifs de ${APP_NAME} et de ses utilisateurs.

En accédant au Service ou en créant un compte, l'utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter sans réserve. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.`,
  },
  {
    id: 'service',
    title: '2. Description du Service',
    content: `${APP_NAME} est une plateforme d'aide à la révision scolaire et universitaire accessible via ${APP_URL}. Le Service propose notamment :

• La génération automatique de flashcards, fiches de révision, schémas et frises chronologiques à partir de contenu fourni par l'utilisateur (texte, PDF, vidéo YouTube) ;
• Un mode d'interrogation interactif (mode Socrate) ;
• La création et la passation d'examens blancs ;
• L'analyse des lacunes de l'utilisateur à partir de ses résultats de révision.

Le Service est disponible sous deux formules : une offre gratuite avec un quota mensuel de générations, et une offre Pro sans restriction de quota. Le détail des offres est précisé sur la page Tarifs du site.`,
  },
  {
    id: 'compte',
    title: '3. Création de compte et accès',
    content: `Pour accéder aux fonctionnalités du Service, l'utilisateur doit créer un compte en fournissant une adresse e-mail valide et un mot de passe, ou en utilisant la connexion via Google (OAuth).

L'utilisateur s'engage à :
• Fournir des informations exactes, complètes et à jour lors de l'inscription ;
• Maintenir la confidentialité de ses identifiants de connexion ;
• Notifier immédiatement ${APP_NAME} de toute utilisation non autorisée de son compte.

${APP_NAME} se réserve le droit de suspendre ou supprimer tout compte dont les informations seraient inexactes ou en cas de violation des présentes CGU.

L'inscription est réservée aux personnes physiques majeures ou, pour les mineurs, sous la responsabilité d'un représentant légal.`,
  },
  {
    id: 'utilisation',
    title: '4. Conditions d\'utilisation',
    content: `L'utilisateur s'engage à utiliser le Service conformément aux lois en vigueur et aux présentes CGU. Il est notamment interdit de :

• Utiliser le Service à des fins illicites, frauduleuses ou contraires à l'ordre public ;
• Charger, transmettre ou diffuser des contenus protégés par des droits de propriété intellectuelle sans autorisation ;
• Tenter d'accéder de manière non autorisée aux systèmes informatiques de ${APP_NAME} ;
• Utiliser des robots, scripts ou tout autre moyen automatisé pour accéder au Service en dehors des usages prévus ;
• Revendre, sous-licencier ou commercialiser l'accès au Service sans accord écrit préalable de ${APP_NAME} ;
• Perturber ou interrompre le bon fonctionnement du Service.

Toute violation de ces règles peut entraîner la suspension immédiate et définitive du compte de l'utilisateur, sans préjudice de toute action judiciaire.`,
  },
  {
    id: 'contenu',
    title: '5. Contenu utilisateur',
    content: `L'utilisateur reste seul propriétaire des contenus qu'il charge sur le Service (textes, fichiers PDF, liens vidéo, etc.). En utilisant le Service, l'utilisateur concède à ${APP_NAME} une licence non exclusive, mondiale, gratuite et pour la durée strictement nécessaire au traitement de ses données, afin de permettre la fourniture du Service.

${APP_NAME} ne revendique aucun droit de propriété sur les contenus générés à partir du contenu de l'utilisateur. Ces contenus générés appartiennent à l'utilisateur, sous réserve du respect des droits des tiers.

L'utilisateur garantit que les contenus qu'il charge ne violent aucun droit de tiers (droit d'auteur, droit à l'image, données personnelles de tiers, etc.) et qu'il dispose des autorisations nécessaires pour les utiliser dans le cadre du Service.

${APP_NAME} se réserve le droit de supprimer tout contenu manifestement illicite.`,
  },
  {
    id: 'abonnement',
    title: '6. Abonnement et facturation',
    content: `Le Service est disponible sous deux formules :

Offre Gratuite : accès aux fonctionnalités de base avec un quota de 5 générations par mois calendaire, sans engagement ni paiement requis.

Offre Pro : accès illimité aux générations et à l'ensemble des fonctionnalités, sur abonnement mensuel ou annuel. Le prix est celui affiché sur la page Tarifs au moment de la souscription.

Les paiements sont traités par Stripe, prestataire tiers sécurisé. ${APP_NAME} ne conserve aucune donnée bancaire. L'abonnement Pro se renouvelle automatiquement à chaque échéance, sauf résiliation préalable.

L'utilisateur peut résilier son abonnement Pro à tout moment depuis la page Paramètres de son compte. La résiliation prend effet à la fin de la période de facturation en cours ; aucun remboursement prorata temporis n'est effectué.

Conformément à l'article L. 221-18 du Code de la consommation, l'utilisateur bénéficie d'un droit de rétractation de 14 jours à compter de la souscription, sauf s'il a expressément demandé à bénéficier du Service avant l'expiration de ce délai.`,
  },
  {
    id: 'donnees',
    title: '7. Données personnelles',
    content: `${APP_NAME} collecte et traite les données personnelles suivantes dans le cadre du Service :
• Adresse e-mail et nom (fournis lors de l'inscription) ;
• Données d'utilisation (contenu généré, résultats de révision) ;
• Données techniques (navigateur, système d'exploitation) via Vercel Analytics, sans cookies ni collecte d'adresse IP.

Ces données sont traitées sur le fondement de l'exécution du contrat (article 6.1.b du RGPD) et de l'intérêt légitime de ${APP_NAME} à améliorer son Service.

Les données sont hébergées sur les serveurs de Supabase (infrastructure sécurisée, Union Européenne ou États-Unis avec garanties adéquates). Elles sont conservées pendant la durée de vie du compte, puis supprimées dans un délai de 30 jours après la clôture.

L'utilisateur dispose des droits d'accès, de rectification, d'effacement, de portabilité et d'opposition prévus par le RGPD, exerc¸ables à l'adresse ${CONTACT_EMAIL}. En cas de réclamation non résolue, l'utilisateur peut saisir la CNIL (www.cnil.fr).

${APP_NAME} n'utilise pas de cookies publicitaires ou de tracking tiers. Les seuls cookies déposés sont les cookies de session Supabase, strictement nécessaires au fonctionnement du Service et exemptés de consentement.`,
  },
  {
    id: 'propriete',
    title: '8. Propriété intellectuelle',
    content: `${APP_NAME}, son logo, son interface, ses algorithmes et l'ensemble des éléments composant le Service (à l'exception du contenu de l'utilisateur) sont la propriété exclusive de ${APP_NAME} et protégés par le droit de la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie du Service, par quelque procédé que ce soit, sans l'autorisation écrite préalable de ${APP_NAME}, est strictement interdite.

Le Service utilise des modèles d'intelligence artificielle fournis par OpenAI. Les contenus générés sont produits par ces modèles à partir des données fournies par l'utilisateur ; ${APP_NAME} n'est pas l'auteur de ces contenus au sens du droit d'auteur.`,
  },
  {
    id: 'responsabilite',
    title: '9. Limitation de responsabilité',
    content: `${APP_NAME} s'efforce d'assurer la disponibilité et la qualité du Service, mais ne saurait garantir :
• L'exactitude, l'exhaustivité ou la pertinence des contenus générés par l'IA ;
• L'absence d'interruption ou d'erreur du Service ;
• L'adéquation du Service à un usage pédagogique ou professionnel particulier.

Les contenus générés par le Service sont fournis à titre indicatif et éducatif. L'utilisateur est seul responsable de l'usage qu'il en fait, notamment dans un contexte d'examens ou d'évaluations officielles.

En aucun cas ${APP_NAME} ne pourra être tenu responsable de dommages indirects, pertes de données, manque à gagner ou préjudices consécutifs à l'utilisation ou à l'impossibilité d'utiliser le Service.

La responsabilité de ${APP_NAME} est limitée au montant des sommes versées par l'utilisateur au titre du Service au cours des 12 derniers mois.`,
  },
  {
    id: 'modification',
    title: '10. Modification des CGU',
    content: `${APP_NAME} se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou par notification sur le Service, au moins 15 jours avant l'entrée en vigueur des nouvelles conditions.

La poursuite de l'utilisation du Service après l'entrée en vigueur des nouvelles CGU vaut acceptation de celles-ci. Si l'utilisateur refuse les nouvelles conditions, il doit cesser d'utiliser le Service et peut demander la suppression de son compte.`,
  },
  {
    id: 'resiliation',
    title: '11. Résiliation',
    content: `L'utilisateur peut supprimer son compte à tout moment en contactant ${CONTACT_EMAIL}. La suppression entraîne la perte définitive de l'ensemble des données et contenus associés au compte.

${APP_NAME} peut suspendre ou résilier l'accès d'un utilisateur sans préavis en cas de :
• Violation des présentes CGU ;
• Utilisation frauduleuse ou abusive du Service ;
• Non-paiement de l'abonnement Pro.

En cas de résiliation à l'initiative de ${APP_NAME}, les sommes déjà perçues ne sont pas remboursées, sauf disposition légale contraire.`,
  },
  {
    id: 'droit',
    title: '12. Droit applicable et juridiction',
    content: `Les présentes CGU sont régies par le droit français. En cas de litige relatif à l'interprétation, à la validité ou à l'exécution des présentes CGU, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.

À défaut d'accord amiable, tout litige sera soumis à la compétence exclusive des tribunaux français compétents.

Conformément aux dispositions du Code de la consommation relatives au règlement amiable des litiges, ${APP_NAME} adhère au service de médiation de la consommation. En cas de litige non résolu, l'utilisateur peut recourir gratuitement à la médiation en contactant ${CONTACT_EMAIL}.`,
  },
  {
    id: 'contact',
    title: '13. Contact',
    content: `Pour toute question relative aux présentes CGU ou au Service, vous pouvez contacter ${APP_NAME} à l'adresse suivante : ${CONTACT_EMAIL}.`,
  },
]

export default async function CGUPage({params}: {params: Promise<{locale: string}>}) {
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
            Conditions Générales d&apos;Utilisation
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

        {/* Back to top */}
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
