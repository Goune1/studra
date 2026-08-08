import type {Locale} from 'next-intl'
import {setRequestLocale} from 'next-intl/server'
import Nav from '@/components/landing/nav/Nav'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'Changelog',
  description: 'Historique des mises à jour et nouvelles fonctionnalités de Studra.',
  alternates: { canonical: 'https://studra.fr/changelog' },
}

type Entry = {
  date: string
  tag: 'Nouvelle fonctionnalité' | 'Amélioration' | 'Correction' | 'Sécurité'
  title: string
  items: string[]
}

const TAG_COLORS: Record<Entry['tag'], string> = {
  'Nouvelle fonctionnalité': 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25',
  'Amélioration': 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25',
  'Correction': 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25',
  'Sécurité': 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25',
}

const entries: Entry[] = [
  {
    date: '20 mai 2026',
    tag: 'Sécurité',
    title: 'Correctifs de sécurité critiques',
    items: [
      'Blocage de l\'escalade de privilèges sur les profils utilisateur et les abonnements Pro',
      'Limite dure de 200 appels IA par jour et par utilisateur, avec protection anti-burst par endpoint',
      'Mise à jour de Next.js vers 16.2.6 pour corriger les vulnérabilités critiques connues',
      'Chiffrement applicatif AES-256-GCM des identifiants et données Pronote stockés en base',
    ],
  },
  {
    date: '20 mai 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Page Bac avec intégration Pronote',
    items: [
      'Connexion à Pronote via identifiants ou QR code pour récupérer automatiquement tes notes',
      'Affichage des notes par période et par matière',
      'Simulateur de moyenne bac avec calcul des coefficients',
      'Accès bêta protégé par mot de passe (hash SHA-256 en cookie, jamais de mot de passe en clair)',
    ],
  },
  {
    date: '20 mai 2026',
    tag: 'Amélioration',
    title: 'Refonte de la landing page',
    items: [
      'Mise à jour du hero, des tarifs, de la FAQ et du footer',
      'Nouvelles pages légales (CGU, CGV, politique de confidentialité) redessinées',
      'Améliorations des pages de connexion et d\'inscription',
    ],
  },
  {
    date: '17 mai 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Profil utilisateur dans la sidebar et campagnes email',
    items: [
      'Profil utilisateur en bas de la barre latérale : avatar Google OAuth ou initiale du nom pour les connexions email',
      'Menu déroulant au clic avec accès rapide aux Paramètres et à la Déconnexion',
      'Interface d\'envoi de campagnes email marketing dans le panneau admin (composition, sélection de destinataires, génération IA, prévisualisation)',
      'Page de désinscription aux emails marketing (/unsubscribe)',
      'Toggle de consentement marketing dans les paramètres utilisateur',
      'Pages d\'erreur dédiées : error.tsx, global-error.tsx, not-found.tsx et loading.tsx pour le dashboard',
    ],
  },
  {
    date: '14 mai 2026',
    tag: 'Amélioration',
    title: 'Nouveau logo Studra',
    items: [
      'Nouveau logo dans le favicon, la navbar de la landing page, la sidebar du dashboard et le footer',
    ],
  },
  {
    date: '13 mai 2026',
    tag: 'Amélioration',
    title: 'Analytics et performances de la landing page',
    items: [
      'Intégration de PostHog via reverse proxy Next.js pour le suivi des événements produit (inscription, connexion, génération, paiement…)',
      'Identification automatique des utilisateurs Supabase au boot PostHog',
      'Optimisations TTFB et FCP : déduplication des appels Supabase avec React cache(), streaming <Suspense> sur le bloc Pricing',
      'Réduction du blur et de la taille des arrière-plans hero pour accélérer le premier rendu',
    ],
  },
  {
    date: '25 avril 2026',
    tag: 'Amélioration',
    title: 'SEO, blog et mises à jour de la landing page',
    items: [
      'Nouvelles pages SEO dédiées (flashcards, fiches de révision, répétition espacée, examen blanc)',
      'Middleware de protection des routes dashboard',
      'Mises à jour du contenu de la landing page (Hero, Tarifs, Témoignages)',
    ],
  },
  {
    date: '21 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Canvas de schémas natif, génération croisée et import photo',
    items: [
      'Nouveau canvas SVG natif pour les schémas mentaux : pan, zoom, drag, multi-sélection, édition inline des labels et création de connexions',
      'Mise en page automatique (BFS hiérarchique + fallback radial) et minimap',
      'Sur chaque page de création, tu peux maintenant générer plusieurs types en même temps (ex. flashcards + fiche + schéma en un clic)',
      'Import de photos et images sur tous les outils de génération : compression automatique côté client, reconnaissance de texte via GPT-5 nano Vision',
    ],
  },
  {
    date: '19 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Page d\'upgrade, abonnement Pro et Socrate en accès payant',
    items: [
      'Nouvelle page /upgrade avec grille tarifaire et paiement Stripe intégré',
      'Socrate et Lacunes sont désormais réservés aux abonnés Pro',
      'Bouton "Passer Pro" dans la barre latérale pour les utilisateurs gratuits',
      'Section Tarifs de la landing page dynamique selon l\'état de connexion',
    ],
  },
  {
    date: '19 avril 2026',
    tag: 'Sécurité',
    title: 'Sécurisation de l\'application et limites de débit',
    items: [
      'Limite de tentatives d\'inscription (5/h par IP) pour éviter les abus',
      'Limite de 30 générations/h par utilisateur sur les endpoints coûteux',
      'Cap à 100 000 caractères sur les textes envoyés à l\'IA',
      'En-têtes de sécurité HTTP ajoutés (HSTS, X-Frame-Options, anti-sniffing…)',
    ],
  },
  {
    date: '19 avril 2026',
    tag: 'Amélioration',
    title: 'Refonte du tableau de bord',
    items: [
      'Nouveaux blocs : Focus du jour, Objectifs de la semaine, Examens à venir, Activité récente',
      'Correction du calcul de score moyen aux examens',
      'La série de révisions compte désormais les sessions d\'examens en plus des flashcards',
      'Thème couleur cohérent : violet pour la heatmap, badges colorés par type de contenu',
    ],
  },
  {
    date: '18 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Socrate remplace Feynman',
    items: [
      'Le mode "Feynman avec Léo" devient Socrate, basé sur la méthode maïeutique',
      'Nouvelles pages et routes API dédiées à /socrate',
      'Réorganisation de la barre latérale : ordre optimisé pour le flux d\'étude',
      'Planificateur de révisions v2 : sessions, régénération et auto-complétion',
    ],
  },
  {
    date: '18 avril 2026',
    tag: 'Correction',
    title: 'Transcription YouTube stable en production',
    items: [
      'Passage à l\'API Supadata pour contourner le blocage de YouTube sur les serveurs cloud',
      'Fallback automatique vers Innertube en développement local',
    ],
  },
  {
    date: '16 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Répétition espacée FSRS, Rappel libre, Annales et Planning',
    items: [
      'Algorithme FSRS (v5) : notes Again/Hard/Good/Easy avec aperçu des intervalles',
      'Rappel libre chronométré avec évaluation IA et score de clarté',
      'Génération d\'annales : l\'IA détecte le style d\'un examen et génère de nouveaux sujets',
      'Planificateur de révisions avec vue calendrier et suivi des tâches',
      'Panneau d\'administration enrichi pour suivre l\'usage des fonctionnalités IA',
    ],
  },
  {
    date: '15 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Emails transactionnels avec Resend',
    items: [
      'Email de bienvenue envoyé automatiquement à l\'inscription',
      'Email de confirmation d\'abonnement Pro à la souscription Stripe',
      'Email de confirmation à la résiliation de l\'abonnement',
    ],
  },
  {
    date: '13 avril 2026',
    tag: 'Amélioration',
    title: 'Limite de contenu portée à 100 000 caractères',
    items: [
      'Les PDF et textes jusqu\'à 100 000 caractères sont désormais acceptés',
      'Correction de l\'extraction de transcriptions YouTube (API Innertube Android)',
    ],
  },
  {
    date: '13 avril 2026',
    tag: 'Amélioration',
    title: 'SEO et accessibilité',
    items: [
      'Ajout du sitemap.xml et du fichier robots.txt',
      'Logo Studra défini comme favicon et icône de l\'application',
    ],
  },
  {
    date: '10 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Connexion Google et pages légales',
    items: [
      'Connexion via Google OAuth en un clic',
      'Pages CGU et CGV accessibles depuis le pied de page',
      'Pages d\'administration : paiements, générations IA, paramètres',
      'Données réelles dans la page Lacunes (fini les données fictives)',
    ],
  },
  {
    date: '7 avril 2026',
    tag: 'Amélioration',
    title: 'Refonte complète de l\'interface',
    items: [
      'Nouveau design du tableau de bord, des flashcards et de toutes les zones de contenu',
      'Thème clair / sombre disponible depuis la barre supérieure',
      'Police Inter dans tout le dashboard pour plus de lisibilité',
    ],
  },
  {
    date: '5 avril 2026',
    tag: 'Amélioration',
    title: 'Migration du paiement vers Stripe',
    items: [
      'Remplacement de LemonSqueezy par Stripe pour les abonnements Pro',
      'Gestion des webhooks Stripe (souscription, résiliation)',
    ],
  },
  {
    date: '4 avril 2026',
    tag: 'Nouvelle fonctionnalité',
    title: 'Lancement des grandes fonctionnalités',
    items: [
      'Mode examen : génération de QCM et questions ouvertes sur n\'importe quel contenu',
      'Socrate (ancien Feynman) : l\'IA joue un élève naïf pour tester ta compréhension',
      'Import PDF et transcription de vidéos YouTube',
      'Schémas mentaux (mind maps) interactifs',
      'Suivi des lacunes par matière',
      'Interface responsive mobile',
      'Éditeur de fiches de révision',
    ],
  },
]

export default async function ChangelogPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale as Locale)
  return (
    <div className="landing-v2 min-h-screen">
      <Nav />
      <main>
        <div className="max-w-2xl mx-auto px-6 py-20">
          <h1 className="text-3xl font-bold text-fg mb-2">Changelog</h1>
          <p className="text-fg-dim mb-14">Les mises à jour concrètes de Studra, dans l&apos;ordre.</p>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-line" />

            <div className="space-y-12">
              {entries.map((entry, i) => (
                <div key={i} className="pl-8 relative">
                  <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 rounded-full bg-fg-dim" />

                  <p className="text-xs text-fg-dim mb-2 font-medium">{entry.date}</p>

                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${TAG_COLORS[entry.tag]}`}>
                    {entry.tag}
                  </span>

                  <h2 className="text-base font-semibold text-fg mb-3">{entry.title}</h2>

                  <ul className="space-y-1.5">
                    {entry.items.map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm text-fg-dim">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-fg-dim flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
