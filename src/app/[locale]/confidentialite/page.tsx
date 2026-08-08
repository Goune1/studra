import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import Link from 'next/link'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'

const LAST_UPDATED = '19 avril 2026'
const CONTACT_EMAIL = 'contact@studra.fr'
const APP_NAME = 'Studra'
const APP_URL = 'https://studra.fr'

export const metadata = {
  title: 'Politique de confidentialité',
  description: "Politique de confidentialité de Studra : données collectées, finalités, droits RGPD, sous-traitants et durées de conservation.",
  alternates: { canonical: 'https://studra.fr/confidentialite' },
  robots: { index: true, follow: true },
}

const sections = [
  {
    id: 'preambule',
    title: '1. Préambule',
    content: `La présente politique de confidentialité (ci-après « la Politique ») a pour objet d'informer les utilisateurs du Service ${APP_NAME} (ci-après « le Service »), accessible à l'adresse ${APP_URL}, des modalités de traitement de leurs données personnelles.

Elle s'applique à l'ensemble des données collectées dans le cadre de l'utilisation du Service, qu'il s'agisse de la création de compte, de la génération de contenus, de la souscription à une offre payante ou de la simple navigation sur le site.

${APP_NAME} s'engage à respecter la vie privée de ses utilisateurs et à protéger leurs données personnelles conformément au Règlement (UE) 2016/679 du 27 avril 2016 (ci-après « RGPD ») et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.`,
  },
  {
    id: 'responsable',
    title: '2. Responsable du traitement',
    content: `Le responsable du traitement des données personnelles collectées via le Service est l'éditeur de ${APP_NAME}, entrepreneur individuel.

Contact : ${CONTACT_EMAIL}

En l'absence d'un délégué à la protection des données (DPO) désigné, toute demande relative à vos données personnelles doit être adressée à l'adresse e-mail ci-dessus.`,
  },
  {
    id: 'donnees',
    title: '3. Données collectées',
    content: `${APP_NAME} collecte uniquement les données strictement nécessaires à la fourniture du Service. Les catégories de données traitées sont les suivantes :

Données d'identification (lors de l'inscription)
• Adresse e-mail
• Nom ou pseudonyme (facultatif)
• Mot de passe (stocké sous forme chiffrée, jamais en clair)
• Identifiants Google OAuth (si connexion via Google)

Données d'utilisation du Service
• Contenus chargés par l'utilisateur (textes de cours, fichiers PDF, liens YouTube)
• Contenus générés par l'IA (flashcards, fiches, schémas, frises, examens blancs)
• Résultats de révision, historique de performance, progression FSRS
• Sessions de travail (mode Socrate, planning, lacunes identifiées)

Données de facturation (abonnés Pro uniquement)
• Historique des paiements, montants, dates
• Identifiant client Stripe
• Aucune donnée bancaire (carte, IBAN) n'est collectée ni stockée par ${APP_NAME}

Données techniques
• Informations de session (cookies Supabase strictement nécessaires)
• Données agrégées de performance et d'audience via Vercel Analytics et Vercel Speed Insights (sans cookies ni collecte d'adresse IP identifiante)
• Journaux techniques du serveur (logs) conservés à des fins de sécurité et de débogage`,
  },
  {
    id: 'finalites',
    title: '4. Finalités du traitement',
    content: `Les données personnelles sont traitées pour les finalités suivantes :

• Création, gestion et sécurisation du compte utilisateur ;
• Fourniture des fonctionnalités du Service (génération de contenus, révision, suivi pédagogique) ;
• Traitement des paiements et gestion des abonnements Pro ;
• Envoi d'e-mails transactionnels (confirmation, réinitialisation de mot de passe, notifications liées au compte) ;
• Amélioration du Service, correction de bugs et développement de nouvelles fonctionnalités ;
• Respect des obligations légales, comptables et fiscales ;
• Prévention de la fraude et des utilisations abusives du Service.

${APP_NAME} ne procède à aucune prise de décision entièrement automatisée produisant des effets juridiques au sens de l'article 22 du RGPD.`,
  },
  {
    id: 'bases-legales',
    title: '5. Bases légales',
    content: `Chaque traitement repose sur l'une des bases légales prévues par l'article 6 du RGPD :

• Exécution du contrat (art. 6.1.b) : création de compte, fourniture du Service, gestion des abonnements, facturation ;
• Intérêt légitime (art. 6.1.f) : amélioration du Service, sécurité, prévention de la fraude, mesures d'audience anonymes ;
• Obligation légale (art. 6.1.c) : conservation des factures, réponse aux réquisitions des autorités compétentes ;
• Consentement (art. 6.1.a) : uniquement si applicable, par exemple pour des communications commerciales facultatives. L'utilisateur peut retirer son consentement à tout moment.`,
  },
  {
    id: 'sous-traitants',
    title: '6. Destinataires et sous-traitants',
    content: `Les données personnelles ne sont jamais vendues, louées ou cédées à des tiers à des fins commerciales.

Elles peuvent être communiquées aux sous-traitants suivants, strictement dans le cadre de leurs prestations et sous contrat conforme à l'article 28 du RGPD :

Supabase (hébergement, base de données, authentification)
• Stockage des comptes utilisateurs et des contenus
• Serveurs situés en Union Européenne (Francfort, Allemagne) ou aux États-Unis selon la configuration, avec clauses contractuelles types en cas de transfert hors UE

Stripe (traitement des paiements)
• Transmission des données de paiement des abonnés Pro
• Siège aux États-Unis ; transferts encadrés par le Data Privacy Framework et des clauses contractuelles types
• Certifié PCI-DSS

OpenAI (génération de contenus par intelligence artificielle)
• Transmission ponctuelle du contenu fourni par l'utilisateur (texte, extrait de PDF) pour générer flashcards, fiches, etc.
• OpenAI s'engage à ne pas utiliser les données transmises via son API pour entraîner ses modèles
• Siège aux États-Unis ; transferts encadrés par des clauses contractuelles types

Supadata (extraction de transcriptions YouTube)
• Récupération du transcript d'une vidéo YouTube fournie par l'utilisateur

Resend (envoi d'e-mails transactionnels)
• Envoi des e-mails liés au compte (confirmation, réinitialisation, notifications)

Vercel (hébergement du site et analytics)
• Hébergement de l'application, journaux techniques, mesures d'audience anonymes
• Serveurs répartis mondialement ; transferts encadrés par des clauses contractuelles types

Google (authentification OAuth, si utilisée)
• Vérification de l'identité lors de la connexion via Google
• Seules les informations de base strictement nécessaires sont récupérées (e-mail, identifiant Google)

Aucun sous-traitant n'est autorisé à utiliser les données à d'autres fins que l'exécution du Service.`,
  },
  {
    id: 'transferts',
    title: '7. Transferts hors Union Européenne',
    content: `Certains sous-traitants du Service (OpenAI, Stripe, Vercel, Supabase dans certaines configurations) sont établis aux États-Unis ou traitent les données en dehors de l'Union Européenne.

Ces transferts sont encadrés par les garanties prévues par le RGPD :
• Adhésion au Data Privacy Framework (DPF) pour les entités américaines certifiées ;
• Clauses contractuelles types approuvées par la Commission européenne ;
• Mesures techniques et organisationnelles complémentaires (chiffrement en transit et au repos).

L'utilisateur peut obtenir une copie des garanties applicables sur simple demande à ${CONTACT_EMAIL}.`,
  },
  {
    id: 'duree',
    title: '8. Durées de conservation',
    content: `Les données personnelles sont conservées uniquement pour la durée nécessaire aux finalités du traitement :

• Données de compte et contenus : pendant toute la durée d'activité du compte, puis supprimées dans un délai de 30 jours après la clôture (sur demande ou après une longue période d'inactivité) ;
• Données de facturation et factures : 10 ans à compter de la transaction, conformément au Code de commerce et au Code général des impôts ;
• Journaux techniques (logs) : 12 mois maximum, conformément à la recommandation de la CNIL ;
• Données de mesure d'audience (agrégées, anonymes) : 25 mois maximum ;
• E-mails transactionnels et preuves d'envoi : 3 ans.

Au-delà de ces durées, les données sont supprimées de manière sécurisée ou anonymisées.`,
  },
  {
    id: 'droits',
    title: '9. Droits des utilisateurs',
    content: `Conformément au RGPD, l'utilisateur dispose des droits suivants sur ses données personnelles :

• Droit d'accès : obtenir la confirmation que des données le concernant sont traitées et en recevoir une copie ;
• Droit de rectification : demander la correction de données inexactes ou incomplètes ;
• Droit à l'effacement (« droit à l'oubli ») : demander la suppression de ses données, sous réserve des obligations légales de conservation ;
• Droit à la limitation du traitement : demander la suspension temporaire du traitement dans certains cas ;
• Droit à la portabilité : recevoir ses données dans un format structuré, couramment utilisé et lisible par machine, ou demander leur transmission à un autre responsable de traitement ;
• Droit d'opposition : s'opposer, pour des raisons tenant à sa situation particulière, à un traitement fondé sur l'intérêt légitime ;
• Droit de définir des directives post-mortem relatives au sort de ses données.

Ces droits peuvent être exercés à tout moment en écrivant à ${CONTACT_EMAIL}. Une réponse sera apportée dans un délai d'un mois à compter de la réception de la demande, pouvant être prolongé de deux mois en cas de complexité ou de nombre de demandes.

Pour des raisons de sécurité, ${APP_NAME} peut être amené à demander une preuve d'identité avant de donner suite à certaines demandes.

En cas de difficulté ou de réponse jugée insatisfaisante, l'utilisateur peut introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) : www.cnil.fr.`,
  },
  {
    id: 'securite',
    title: '10. Sécurité des données',
    content: `${APP_NAME} met en œuvre des mesures techniques et organisationnelles appropriées pour garantir la confidentialité, l'intégrité et la disponibilité des données personnelles :

• Chiffrement des communications via HTTPS/TLS ;
• Chiffrement des mots de passe (hachage avec sel, algorithme robuste géré par Supabase) ;
• Chiffrement au repos des bases de données par Supabase ;
• Accès restreint aux données, limité aux personnes strictement habilitées ;
• Authentification sécurisée (Supabase Auth, OAuth Google) ;
• Journalisation des accès sensibles et détection des anomalies ;
• Sauvegardes régulières des bases de données ;
• Mises à jour de sécurité appliquées en continu sur les dépendances logicielles.

En cas de violation de données personnelles susceptible d'engendrer un risque pour les droits et libertés des utilisateurs, ${APP_NAME} s'engage à notifier la CNIL dans un délai de 72 heures, conformément à l'article 33 du RGPD, et à informer sans délai les utilisateurs concernés si le risque est élevé (article 34 du RGPD).`,
  },
  {
    id: 'cookies',
    title: '11. Cookies et traceurs',
    content: `${APP_NAME} limite l'usage des cookies et traceurs à ce qui est strictement nécessaire au fonctionnement du Service.

Cookies strictement nécessaires (exemptés de consentement)
• Cookies de session Supabase : permettent de maintenir l'utilisateur connecté à son compte ;
• Cookies de préférences techniques : mémorisation du thème d'affichage, des paramètres d'interface.

Ces cookies sont déposés dès l'arrivée sur le Service, conformément à l'article 82 de la loi Informatique et Libertés, car ils sont indispensables à la fourniture du Service demandé par l'utilisateur.

Mesure d'audience
${APP_NAME} utilise Vercel Analytics et Vercel Speed Insights pour mesurer l'audience et les performances du site. Ces outils fonctionnent sans cookies et sans collecte d'adresse IP identifiante ; les données sont agrégées et anonymes. Ces traitements sont donc exemptés de consentement préalable.

${APP_NAME} n'utilise aucun cookie publicitaire, aucun traceur tiers à des fins marketing, ni aucun outil de profilage.

L'utilisateur peut à tout moment configurer son navigateur pour refuser les cookies ; cette action peut toutefois dégrader le fonctionnement du Service.`,
  },
  {
    id: 'mineurs',
    title: '12. Utilisateurs mineurs',
    content: `Le Service est destiné à un usage scolaire et universitaire. L'inscription est autorisée aux mineurs de 15 ans et plus, conformément à l'article 7-1 de la loi Informatique et Libertés, sous réserve qu'ils disposent de la capacité juridique suffisante.

Pour les utilisateurs âgés de moins de 15 ans, l'inscription et le traitement des données personnelles sont conditionnés au consentement conjoint du mineur et du titulaire de l'autorité parentale.

${APP_NAME} invite les parents à superviser l'utilisation du Service par leurs enfants mineurs et à les accompagner dans la compréhension des présentes règles de protection des données. Toute demande de suppression de compte d'un mineur peut être formulée par son représentant légal à ${CONTACT_EMAIL}.`,
  },
  {
    id: 'modifications',
    title: '13. Modification de la Politique',
    content: `${APP_NAME} se réserve le droit de modifier la présente Politique à tout moment, notamment pour tenir compte d'évolutions législatives, réglementaires ou du Service.

Toute modification substantielle sera notifiée aux utilisateurs par e-mail ou par notification sur le Service, au moins 15 jours avant son entrée en vigueur.

La date de dernière mise à jour indiquée en tête du présent document permet à l'utilisateur de vérifier la version en vigueur. La poursuite de l'utilisation du Service après cette date vaut acceptation de la nouvelle Politique.`,
  },
  {
    id: 'contact',
    title: '14. Contact',
    content: `Pour toute question relative à la présente Politique, à vos données personnelles ou à l'exercice de vos droits, vous pouvez contacter ${APP_NAME} à l'adresse suivante : ${CONTACT_EMAIL}.

Vous pouvez également vous adresser directement à la CNIL :
Commission Nationale de l'Informatique et des Libertés
3 place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07
www.cnil.fr`,
  },
]

export default async function ConfidentialitePage({params}: {params: Promise<{locale: string}>}) {
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
            Politique de confidentialité
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
