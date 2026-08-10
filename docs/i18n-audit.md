# Audit i18n de Studra (phase 0)

> Portée : audit en lecture seule de l'état courant du working tree de `/home/debian/studra`.
> Aucun changement applicatif n'a été effectué. Ce document est le seul fichier créé.

## Résumé exécutif

- L'application utilise `src/app`, pas `app` à la racine.
- L'état audité contient **61 pages**, **51 Route Handlers**, **8 layouts** et 264 fichiers source TypeScript/TSX.
- Le dépôt audité est actuellement en **Next.js 16.2.6 / React 19.2.4**, contrairement au contexte annoncé « Next.js 15 ». C'est un point d'architecture bloquant à clarifier avant la phase 1, car Next 16 renomme progressivement le conventionnel `middleware.ts` en `proxy.ts` et les exemples `next-intl` diffèrent selon la version. `next-intl` n'est pas encore installé.
- Le fournisseur IA réel est **OpenAI**, pas Anthropic. Il n'existe ni dépendance Anthropic ni appel Anthropic dans le code audité.
- Une notion distincte de `language` existe déjà pour la **langue du contenu généré**. Elle est sélectionnée dans `ContentInputForm`, puis propagée aux générations de flashcards, fiches, schémas, frises et examens. Elle ne doit pas être confondue automatiquement avec la locale de l'interface.
- Le middleware Supabase est scindé entre `src/middleware.ts` et `src/lib/supabase/middleware.ts`. Une composition naïve avec `next-intl` perdrait les rewrites/headers/cookies de l'une des deux couches.
- Le profil Supabase ne possède actuellement aucune colonne `locale` ou `language` pour la préférence d'interface.
- Un premier scan AST très large a remonté **4 612 candidats dans 237 fichiers**. Après filtrage des chaînes techniques et revue croisée, le plafond utile est d'environ **2 325 occurrences user-facing candidates**, soit **1 800 à 2 100 messages ou occurrences à externaliser** avant déduplication. Les contenus éditoriaux longs représentent une part importante de ce volume.

---

# 1. Inventaire des routes et structure actuelle

## 1.1 Structure de haut niveau

```text
src/app/
├── (auth)/                    # groupe URL-transparent : /login, /register
├── (dashboard)/               # groupe URL-transparent : application authentifiée
├── (seo)/                     # groupe URL-transparent : pages SEO publiques
├── admin/                     # back-office
├── api/                       # 51 Route Handlers
├── auth/callback/route.ts     # callback OAuth Supabase
├── blog/
├── cgu/ cgv/ confidentialite/ changelog/ unsubscribe/
├── layout.tsx                 # layout racine, <html lang="fr">
├── page.tsx                   # /
├── error.tsx
├── global-error.tsx
├── not-found.tsx
├── opengraph-image.tsx
├── robots.ts
├── sitemap.ts
├── icon.png
└── apple-icon.png
```

Les groupes `(auth)`, `(dashboard)` et `(seo)` n'apparaissent pas dans les URLs.

## 1.2 Pages publiques, auth et SEO

| URL actuelle | Fichier |
|---|---|
| `/` | `src/app/page.tsx` |
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/register` | `src/app/(auth)/register/page.tsx` |
| `/blog` | `src/app/blog/page.tsx` |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` |
| `/flashcards-ia` | `src/app/(seo)/flashcards-ia/page.tsx` |
| `/fiches-de-revision-ia` | `src/app/(seo)/fiches-de-revision-ia/page.tsx` |
| `/repetition-espacee` | `src/app/(seo)/repetition-espacee/page.tsx` |
| `/examen-blanc-ia` | `src/app/(seo)/examen-blanc-ia/page.tsx` |
| `/cgu` | `src/app/cgu/page.tsx` |
| `/cgv` | `src/app/cgv/page.tsx` |
| `/confidentialite` | `src/app/confidentialite/page.tsx` |
| `/changelog` | `src/app/changelog/page.tsx` |
| `/unsubscribe` | `src/app/unsubscribe/page.tsx` |

Callback non-page : `GET /auth/callback` dans `src/app/auth/callback/route.ts`.

## 1.3 Pages dashboard

```text
/dashboard
/flashcards
/flashcards/new
/flashcards/[deckId]
/flashcards/[deckId]/study
/fiches
/fiches/new
/fiches/[ficheId]
/schemas
/schemas/new
/schemas/[schemaId]
/timelines
/timelines/new
/timelines/[timelineId]
/exams
/exams/new
/exams/[examId]
/exams/[examId]/results/[sessionId]
/lacunes
/socrate
/socrate/new
/socrate/[sessionId]
/recall
/recall/new
/recall/[sessionId]
/recall/[sessionId]/results
/annales
/annales/new
/annales/[examId]
/planning
/planning/new
/planning/[planId]
/settings
/settings/revision
/billing
/upgrade
/affiliate
/bac
```

Tous sont sous `src/app/(dashboard)/`. Le layout partagé est `src/app/(dashboard)/layout.tsx`; le loading boundary est `src/app/(dashboard)/loading.tsx`. `/flashcards/[deckId]/study` possède aussi son propre `layout.tsx`.

## 1.4 Pages admin

```text
/admin
/admin/paiements
/admin/generations
/admin/settings
/admin/affiliates
/admin/affiliates/[id]
/admin/emails
/admin/emails/new
/admin/emails/[id]
```

Le layout est `src/app/admin/layout.tsx`. Ce fichier est non suivi dans le working tree audité (`??`), donc l'audit inclut bien un changement local non encore commité.

## 1.5 Route Handlers API

```text
/api/admin/affiliates
/api/admin/affiliates/[id]
/api/admin/affiliates/[id]/payout
/api/admin/emails/campaigns
/api/admin/emails/campaigns/[id]
/api/admin/emails/generate
/api/admin/emails/recipients
/api/admin/emails/send

/api/affiliate/register
/api/affiliate/track
/api/affiliate/update-payment
/api/analyze/lacunes
/api/auth/register
/api/bac/identify
/api/billing/checkout
/api/billing/portal
/api/exams/[examId]/submit
/api/extract/pdf
/api/extract/youtube
/api/extract-image-text
/api/fiches/[ficheId]
/api/flashcards/[deckId]/due
/api/flashcards/[deckId]/review
/api/fsrs/settings
/api/fsrs/stats

/api/generate/annales
/api/generate/exam
/api/generate/explain
/api/generate/fiche
/api/generate/flashcards
/api/generate/schema
/api/generate/study-plan
/api/generate/timeline

/api/pronote/connect
/api/pronote/connect-qr
/api/pronote/disconnect
/api/pronote/schools
/api/pronote/sync

/api/recall/sessions
/api/recall/sessions/[sessionId]/evaluate
/api/schemas/[schemaId]
/api/socrate/sessions
/api/socrate/sessions/[sessionId]/message
/api/socrate/sessions/[sessionId]/diagnose
/api/study-plans/auto-complete
/api/study-plans/[planId]
/api/study-plans/[planId]/regenerate
/api/study-plans/[planId]/sessions/[sessionId]
/api/unsubscribe
/api/webhooks/stripe
```

## 1.6 Fichiers spéciaux App Router

| Rôle | Fichier(s) |
|---|---|
| Layout racine | `src/app/layout.tsx` |
| Layouts de groupes | `src/app/(auth)/layout.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(seo)/layout.tsx` |
| Layouts imbriqués | login, register, flashcards study, admin |
| Erreur segment racine | `src/app/error.tsx` |
| Erreur globale | `src/app/global-error.tsx` avec son propre `<html lang="fr">` |
| 404 | `src/app/not-found.tsx` |
| Loading dashboard | `src/app/(dashboard)/loading.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| Robots | `src/app/robots.ts` |
| OG racine | `src/app/opengraph-image.tsx` |
| OG dynamiques | blog `[slug]` et les quatre pages SEO |
| Icônes | `src/app/icon.png`, `src/app/apple-icon.png` |

## 1.7 Conséquences structurelles pour la phase 1

1. Les pages localisées peuvent être placées sous `src/app/[locale]/`, mais `src/app/api`, `src/app/auth/callback/route.ts`, et probablement les fichiers techniques globaux ne doivent pas être déplacés aveuglément.
2. Avec `localePrefix: "as-needed"`, les URLs françaises ci-dessus peuvent rester identiques. Les autres locales deviendraient typiquement `/en/...`, `/es/...`, etc.
3. Les segments français (`/fiches`, `/schemas`, `/confidentialite`, `/repetition-espacee`) resteront identiques dans toutes les langues si seule la locale est préfixée. Traduire aussi les slugs est un autre projet, non demandé et risqué pour le SEO.
4. Plusieurs pages sont des Client Components. Elles ne peuvent pas appeler directement une API serveur comme `setRequestLocale`; respecter littéralement « chaque page » nécessitera des wrappers Server Components ou une interprétation validée de la contrainte.
5. `generateStaticParams` ne peut pas être ajouté uniformément aux pages privées dynamiques dépendant de données utilisateurs. Le bon niveau pour les locales est d'abord le layout `[locale]`; les slugs de blog et données publiques ont leurs propres contraintes.

---

# 2. Recensement des chaînes user-facing hardcodées

## 2.1 Méthode et légende

Le scan couvre `src/app`, `src/components`, `src/lib`, les Route Handlers, metadata, OG images, templates HTML, toasts, erreurs, placeholders, attributs d'accessibilité et constantes rendues.

- `~N` : ordre de grandeur de candidats dans le fichier, pas nombre final de clés JSON.
- Les contenus utilisateurs et données venant de Supabase ne sont pas comptés comme traductions.
- Les exemples de cours, cartes et schémas fournis par Studra dans la landing ou les mocks sont user-facing et sont donc inclus.
- Les articles de blog, textes CGU/CGV/RGPD et changelog sont du contenu éditorial. Techniquement ils sont traduisibles, mais leur migration vers `next-intl` doit être décidée séparément d'une simple traduction d'interface.
- Le scan large a aussi capté quelques tokens CSS, statuts internes et chaînes DB. Ils devront être exclus pendant l'extraction. Le rapport les conserve dans les volumes pour éviter un faux sentiment d'exhaustivité.

Répartition affinée : environ 950 à 1 150 occurrences pour le contenu éditorial/SEO/légal, 600 à 750 pour l'UI produit, 230 à 290 pour les erreurs API, 150 à 220 pour metadata/OG/JSON-LD, 70 à 110 pour les emails, plus 16 blocs majeurs de prompts IA. Les `~N` par fichier ci-dessous proviennent du scan large et sont donc des plafonds locaux, pas des nombres de clés finales.

## 2.2 Points transverses certains

- **22 déclarations de metadata** statiques ou dynamiques contiennent du français.
- **33 fichiers** produisent des toasts hardcodés.
- **48 Route Handlers** retournent au moins une erreur française potentiellement affichée par le client.
- **47 placeholders**, **19 aria-label/aria-description** et **13 attributs alt** ont été repérés.
- **43 appels de formatage** imposent `fr` ou `fr-FR` (`toLocaleDateString`, `toLocaleString`, `Intl.DateTimeFormat`).
- Trois `<html lang="fr">` sont en dur : `src/app/layout.tsx`, `src/app/global-error.tsx`, `src/lib/resend.ts`.

## 2.3 Landing, SEO, blog et pages légales

| Fichier | Volume estimé | Types dominants |
|---|---:|---|
| `src/app/page.tsx` | ~7 | metadata/OG |
| `src/app/layout.tsx` | ~22 | metadata globales, OG, alt, `lang="fr"` |
| `src/app/not-found.tsx` | ~6 | metadata, JSX |
| `src/app/error.tsx` | ~9 | messages d'erreur, CTA |
| `src/app/global-error.tsx` | ~15 | erreur globale, `lang="fr"` |
| `src/app/opengraph-image.tsx` | ~18 | texte de l'image OG |
| `src/components/landing/nav/Nav.tsx` | ~40 | labels, aria, alt, navigation mobile |
| `src/components/landing/hero/Hero.tsx` | ~17 | headline, CTA, preuve sociale |
| `src/components/landing/hero/MockupWindow.tsx` | ~33 | labels et contenu de démo |
| `src/components/landing/hero/scenes/SceneGenerate.tsx` | ~19 | questions de démo |
| `src/components/landing/hero/scenes/SceneImport.tsx` | ~22 | contenu/labels de démo |
| `src/components/landing/hero/scenes/ScenePlanning.tsx` | ~19 | jours, statuts, contenu de démo |
| `src/components/landing/hero/scenes/SceneReview.tsx` | ~51 | labels, feedback, cartes de démo |
| `src/components/landing/features/Features.tsx` | ~33 | titres/descriptions |
| `src/components/landing/features/AnimExam.tsx` | ~14 | exemple d'examen |
| `src/components/landing/features/AnimFiches.tsx` | ~28 | exemple de fiche |
| `src/components/landing/features/AnimFlashcards.tsx` | ~19 | exemples de cartes |
| `src/components/landing/features/AnimPlanning.tsx` | ~8 | jours/événements |
| `src/components/landing/features/AnimRappel.tsx` | ~8 | rappel actif |
| `src/components/landing/features/AnimSchemas.tsx` | ~15 | labels de nœuds |
| `src/components/landing/features/AnimSocrate.tsx` | ~16 | questions de démonstration |
| `src/components/landing/HowItWorks.tsx` | ~13 | étapes et descriptions |
| `src/components/landing/Method.tsx` | ~15 | blocs pédagogiques |
| `src/components/landing/Pricing.tsx` | ~35 | plans, prix, fonctionnalités, CTA |
| `src/components/landing/FAQ.tsx` + `faq-data.ts` | ~25 | questions/réponses |
| `src/components/landing/FinalCTA.tsx` | ~11 | CTA final |
| `src/components/landing/Footer.tsx` | ~23 | groupes/liens, alt |
| `src/components/landing/SeoLinks.tsx` | ~11 | ancres/descriptions SEO |
| `src/components/landing/LandingJsonLd.tsx` | ~19 | JSON-LD user-facing |
| `src/app/(seo)/flashcards-ia/page.tsx` | ~94 | metadata, FAQ, contenu SEO, CTA |
| `src/app/(seo)/fiches-de-revision-ia/page.tsx` | ~69 | metadata et contenu SEO |
| `src/app/(seo)/repetition-espacee/page.tsx` | ~87 | metadata, contenu SEO, messages |
| `src/app/(seo)/examen-blanc-ia/page.tsx` | ~79 | metadata et contenu SEO |
| quatre `opengraph-image.tsx` SEO | ~10 chacun | texte OG |
| `src/app/blog/page.tsx` | ~15 | metadata, labels, alt |
| `src/app/blog/[slug]/page.tsx` | ~22 | labels d'article et navigation |
| `src/app/blog/[slug]/opengraph-image.tsx` | ~8 | texte OG |
| `src/lib/blog-posts.ts` | ~228 | cinq articles complets, titres, descriptions, tableaux/listes |
| `src/app/cgu/page.tsx` | ~41 | metadata + document légal |
| `src/app/cgv/page.tsx` | ~39 | metadata + document légal + prix `4,99 €` |
| `src/app/confidentialite/page.tsx` | ~43 | metadata + document RGPD |
| `src/app/changelog/page.tsx` | ~155 | metadata + historique éditorial |
| `src/app/unsubscribe/page.tsx` | ~13 | metadata et états de désinscription |

## 2.4 Authentification

| Fichier | Volume estimé | Types dominants |
|---|---:|---|
| `src/app/(auth)/login/layout.tsx` | ~2 | title/description |
| `src/app/(auth)/login/page.tsx` | ~19 | JSX, erreurs, toast, placeholders |
| `src/app/(auth)/register/layout.tsx` | ~2 | title/description |
| `src/app/(auth)/register/page.tsx` | ~26 | JSX, trois toasts, placeholders, consentement |
| `src/app/api/auth/register/route.ts` | ~3 | erreurs API visibles |
| `src/app/auth/callback/route.ts` | faible | destinations/flux, pas de copy principale |

## 2.5 Dashboard et outils de révision

| Fichier | Volume estimé | Types dominants |
|---|---:|---|
| `src/components/sidebar.tsx` | ~37 | 13 labels, toast, aria, alt |
| `src/components/dashboard-shell.tsx` | ~6 | aria menu, marque |
| `src/components/dashboard/DashboardActive.tsx` | ~84 | labels, états, pluriels, dates |
| `src/components/dashboard/DashboardEmpty.tsx` | ~55 | onboarding, CTA, cartes outils |
| `src/components/dashboard/UpgradeBanner.tsx` | ~18 | bénéfices Pro, toasts |
| `src/app/(dashboard)/dashboard/page.tsx` | ~19 | jours abrégés et données d'exemple |
| `src/app/(dashboard)/loading.tsx` | ~5 | loading UI |
| `src/components/content-input-form.tsx` | ~61 | langues, onglets source, placeholders, erreurs/toasts, compteurs |
| `src/components/ContentPicker.tsx` | ~25 | filtres, labels, placeholders |
| `src/components/also-generate.tsx` | ~30 | formats associés, descriptions |
| `src/components/image-upload-input.tsx` | ~18 | états d'upload/OCR, erreurs, alt |
| `src/components/DeleteEntityButton.tsx` | ~19 | modal, toast, aria |
| `src/components/checkout-button.tsx` | ~5 | erreurs/redirection |
| `src/components/manage-subscription-button.tsx` | ~5 | erreurs/redirection |
| `src/components/pro-gate.tsx` | ~7 | paywall |
| `src/components/ThemeToggle.tsx` | ~6 | libellés de thème |

### Flashcards

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/flashcards/page.tsx` | 33 |
| `src/app/(dashboard)/flashcards/new/page.tsx` | 12 |
| `src/app/(dashboard)/flashcards/[deckId]/page.tsx` | 12 |
| `src/app/(dashboard)/flashcards/[deckId]/study/page.tsx` | 37 |
| `src/components/flashcard-card.tsx` | 21 |
| `src/components/flashcards/FlashCard.tsx` | 33 |
| `src/lib/fsrs/types.ts` | 4 |
| `src/lib/fsrs/utils.ts` | 11 |

Contenu : filtres, états vides, boutons, qualité de réponse, explications alternatives, dates/durées, pluriels et raccourcis clavier.

### Fiches

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/fiches/page.tsx` | 44 |
| `src/app/(dashboard)/fiches/new/page.tsx` | 12 |
| `src/app/(dashboard)/fiches/[ficheId]/page.tsx` | 20 |
| `src/components/fiche-viewer.tsx` | 22 |

### Schémas

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/schemas/page.tsx` | 50 |
| `src/app/(dashboard)/schemas/new/page.tsx` | 12 |
| `src/app/(dashboard)/schemas/[schemaId]/page.tsx` | 12 |
| `src/app/(dashboard)/schemas/[schemaId]/SchemaEditor.tsx` | 22 |
| `src/app/(dashboard)/schemas/[schemaId]/SchemaEditorClient.tsx` | 2 |
| `src/components/schema/Toolbar.tsx` | 38 candidats, dont ~7 labels certains |
| `src/components/schema/ContextBar.tsx` | 21 candidats, dont labels d'actions |
| `src/components/schema/Node.tsx` | 27 candidats, dont aria |
| `src/components/schema/Canvas.tsx` | 20 candidats, majorité technique à exclure |
| `src/components/schema/Edge.tsx`, `Minimap.tsx`, `utils/*` | surtout technique; quelques valeurs par défaut comme « Concept » |

### Frises

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/timelines/page.tsx` | 52 |
| `src/app/(dashboard)/timelines/new/page.tsx` | 12 |
| `src/app/(dashboard)/timelines/[timelineId]/page.tsx` | 12 |
| `src/components/timeline-viewer.tsx` | 26 |

### Examens et annales

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/exams/page.tsx` | 51 |
| `src/app/(dashboard)/exams/new/page.tsx` | 18 |
| `src/app/(dashboard)/exams/[examId]/page.tsx` | 52 |
| `src/app/(dashboard)/exams/[examId]/results/[sessionId]/page.tsx` | 33 |
| `src/app/(dashboard)/annales/page.tsx` | 13 |
| `src/app/(dashboard)/annales/new/page.tsx` | 39 |
| `src/app/(dashboard)/annales/[examId]/page.tsx` | 20 |

### Planning

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/planning/page.tsx` | 14 |
| `src/app/(dashboard)/planning/new/page.tsx` | 51 |
| `src/app/(dashboard)/planning/[planId]/page.tsx` | 99 |
| `src/lib/scheduler.ts` | au moins 4 textes de sessions, davantage de valeurs structurelles |

`planning/[planId]/page.tsx` concentre aussi 7 toasts, 4 aria-labels, des dates françaises et de nombreux pluriels manuels.

### Rappel libre, lacunes et Socrate

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/recall/page.tsx` | faible à moyen |
| `src/app/(dashboard)/recall/new/page.tsx` | 26 |
| `src/app/(dashboard)/recall/[sessionId]/page.tsx` | 26 |
| `src/app/(dashboard)/recall/[sessionId]/results/page.tsx` | 22 |
| `src/app/(dashboard)/lacunes/page.tsx` | 8 |
| `src/components/lacunes/AnalysisPanel.tsx` | 11 |
| `src/components/lacunes/EmptyState.tsx` | 3 |
| `src/components/lacunes/KpiStrip.tsx` | 8 |
| `src/components/lacunes/ScoreRing.tsx` | 9 |
| `src/components/lacunes/WeaknessCard.tsx` | 19 |
| `src/components/lacunes/WeaknessCardList.tsx` | 14 |
| `src/lib/lacunes/mock.ts` | ~23 textes de démo |
| `src/app/(dashboard)/socrate/new/page.tsx` | 14 |
| `src/app/(dashboard)/socrate/[sessionId]/page.tsx` | 49 |

### Bac / Pronote

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/bac/bac-gate.tsx` | 16 |
| `src/app/(dashboard)/bac/bac-simulator.tsx` | 69 |
| `src/app/(dashboard)/bac/client.tsx` | 96 |
| `src/app/(dashboard)/bac/grades-view.tsx` | 33 |
| `src/lib/bac/calculator.ts` | au moins 19 labels de mentions/matières |
| `src/lib/pronote/parse-grades.ts` | ~5 labels (« Absent », « Non rendu »...) |

### Paramètres, abonnement et affiliation

| Fichier | ~N |
|---|---:|
| `src/app/(dashboard)/settings/page.tsx` | 34 |
| `src/app/(dashboard)/settings/revision/page.tsx` | 53 |
| `src/app/(dashboard)/settings/actions.ts` | 2 erreurs visibles |
| `src/components/settings/MarketingConsentToggle.tsx` | 11 |
| `src/app/(dashboard)/billing/page.tsx` | 19 |
| `src/app/(dashboard)/upgrade/page.tsx` | 29 |
| `src/app/(dashboard)/affiliate/page.tsx` | faible |
| `src/app/(dashboard)/affiliate/affiliate-gate.tsx` | 15 |
| `src/app/(dashboard)/affiliate/actions.ts` | ~16 messages d'erreur/validation |
| `src/components/affiliate/AffiliateDashboard.tsx` | 72 |
| `src/components/affiliate/AffiliateRegistrationForm.tsx` | 26 |

## 2.6 Admin

| Fichier | Volume estimé | Types dominants |
|---|---:|---|
| `src/components/admin/Sidebar.tsx` | ~13 | navigation |
| `src/components/admin/KpiStrip.tsx` | ~9 | labels/nombres |
| `src/components/admin/MembresTable.tsx` | ~44 | filtres, colonnes, placeholders, dates |
| `src/components/admin/MemberPanel.tsx` | ~44 | labels, statuts, dates |
| `src/components/admin/NewUsersChart.tsx` | ~25 | périodes, aria, pluriels |
| `src/app/admin/paiements/page.tsx` | ~26 | colonnes/statuts/dates |
| `src/app/admin/generations/page.tsx` | ~29 | filtres/labels/dates |
| `src/app/admin/settings/page.tsx` | ~26 | labels d'environnement |
| `src/app/admin/affiliates/page.tsx` | ~28 | statuts, tableaux |
| `src/app/admin/affiliates/[id]/page.tsx` | ~75 | actions, validations, toasts, placeholders |
| `src/app/admin/emails/page.tsx` | metadata |
| `src/app/admin/emails/new/page.tsx` | metadata + navigation |
| `src/app/admin/emails/[id]/page.tsx` | ~18 | metadata, statuts, compteurs |
| `src/components/admin/emails/CampaignComposer.tsx` | ~35 | labels, erreurs, preview, placeholders |
| `src/components/admin/emails/CampaignList.tsx` | ~15 | statuts/dates/pluriels |
| `src/components/admin/emails/RecipientPicker.tsx` | ~14 | labels, consentement, compteurs |
| `src/components/admin/emails/SendConfirmDialog.tsx` | ~16 | confirmation, validation, compteurs |
| `src/components/admin/emails/EmailPreview.tsx` | ~4 | labels/title |

Question de périmètre : faut-il traduire le back-office admin ? Il est user-facing pour les administrateurs, donc il est recensé, mais le bénéfice produit est faible par rapport au coût.

## 2.7 Erreurs des Route Handlers

48 handlers ont au moins une erreur française. Les plus chargés sont :

| Zone | Fichiers et volume approximatif d'erreurs |
|---|---|
| Génération | `generate/annales` ~9; `schema` ~8; `timeline` ~8; `study-plan` ~7; `exam`, `fiche`, `flashcards` ~6 chacun; `explain` ~4 |
| Pronote | `connect-qr` ~13; `connect` ~6; `sync` ~5; `schools`, `disconnect` ~2 |
| Admin emails | `send` ~10; `campaigns/[id]` ~7; `generate` ~5; `campaigns` ~4; `recipients` ~3 |
| Admin affiliation | payout ~5; détail ~6; liste ~1 |
| Affiliation | register ~11; update-payment ~7 |
| Socrate/recall | 4 à 6 par handler |
| Study plans | 3 à 7 par handler |
| Extraction | YouTube ~10; image ~7; PDF ~6 |
| Billing | checkout ~2; portal ~3 |
| FSRS/flashcards/fiches/schemas | 1 à 5 par handler |

Ces erreurs sont souvent remontées telles quelles dans les toasts. Il faut donc les traiter comme user-facing, mais éviter de traduire les logs internes ou les identifiants d'erreur machine. Une architecture robuste retournerait un code stable (`errorCode`) et traduirait côté interface; ce serait cependant un refactor au-delà de la plomberie et doit être validé.

## 2.8 Dates, nombres, devises et pluriels en dur

43 formatages `fr`/`fr-FR` ont été repérés, notamment dans :

- `src/lib/utils.ts`
- pages planning, bac, timelines, settings, flashcards study, fiches, exams, schemas, annales
- toutes les pages admin de tableaux
- `DashboardActive`, `WeaknessCard`, `AffiliateDashboard`
- composants admin emails
- `content-input-form.tsx`

Des pluriels manuels sont présents sous des formes comme `page${n > 1 ? 's' : ''}`, `nouveau${... ? 'x' : ''}`, `membre${... ? 's' : ''}`, `destinataire${...}`. Ils devront passer en ICU.

La valeur `4,99 €` est hardcodée dans `src/app/cgv/page.tsx` et les montants restent en EUR conformément au brief. Le format d'affichage devra toutefois utiliser les formatters de `next-intl`.

---

# 3. Middleware Supabase et composition avec next-intl

## 3.1 Localisation exacte

### Point d'entrée

`src/middleware.ts:1-12`

```ts
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

Matcher actuel :

```text
/((?!_next/static|_next/image|favicon.ico|flashcards-ia|fiches-de-revision-ia|
repetition-espacee|examen-blanc-ia|blog(?:/.*)?|og(?:/.*)?|
.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)
```

Le middleware actuel ne s'exécute donc pas sur les quatre pages SEO, le blog, les images et certaines ressources. Il s'exécute en revanche sur `/api/*`, y compris le webhook Stripe, sauf exclusion indirecte.

### Implémentation Supabase

`src/lib/supabase/middleware.ts:4-82`, fonction `updateSession(request)`.

Fonctionnement actuel :

1. Crée une réponse `NextResponse.next({request})`.
2. Crée un client `@supabase/ssr` avec lecture/écriture de cookies.
3. Appelle `supabase.auth.getUser()` pour rafraîchir/valider la session.
4. Protège `/admin` via `ADMIN_EMAIL`.
5. Protège explicitement les préfixes dashboard (`/dashboard`, `/flashcards`, `/fiches`, etc.).
6. Redirige les utilisateurs connectés quittant `/login` ou `/register` vers `/dashboard`.
7. Retourne la réponse contenant les cookies Supabase rafraîchis.

Anomalie existante : `/bac` et `/upgrade` sont sous le groupe `(dashboard)` et sont désindexés comme des routes privées dans `robots.ts`, mais ils sont absents de `isDashboardRoute`. Le layout dashboard ne redirige pas explicitement un visiteur sans session. Ils ne sont donc pas protégés par le middleware actuel.

## 3.2 Pourquoi une composition naïve casserait l'auth ou l'i18n

- `next-intl` peut retourner une **rewrite** interne ou une **redirect** de détection de locale. Si `updateSession` recrée ensuite un `NextResponse.next`, les headers de rewrite et le cookie `NEXT_LOCALE` peuvent être perdus.
- Inversement, si `next-intl` retourne une nouvelle réponse après Supabase, les `Set-Cookie` de refresh Supabase peuvent être perdus.
- Le callback `setAll` de Supabase recrée actuellement `supabaseResponse`. Il doit pouvoir muter ou recopier une réponse fournie par la couche i18n, sans supprimer ses headers.
- Les redirections auth créées aux lignes 50, 72 et 78 ne recopient pas explicitement les cookies du refresh. Ce risque existe déjà aujourd'hui si `getUser()` rafraîchit un token juste avant une redirection.
- Les tests de pathname ne reconnaîtront pas `/en/dashboard`, `/es/login`, etc. Il faut normaliser le pathname en retirant un préfixe de locale reconnu, ou utiliser le résultat de routing `next-intl`.
- Les destinations de redirection doivent conserver la locale : `/en/dashboard` -> `/en/login`, tandis que le français reste `/login`.

## 3.3 Chaînage recommandé pour la phase 1

Architecture cible, à confirmer contre la documentation correspondant à la version Next réellement retenue :

1. Définir un `routing` unique avec `locales: ['fr','en','es','pt','de','it']`, `defaultLocale: 'fr'`, `localePrefix: 'as-needed'`.
2. Dans le point d'entrée middleware/proxy, décider d'abord si la requête est éligible à l'i18n.
3. Pour une page localisée, exécuter `createMiddleware(routing)` afin d'obtenir la réponse i18n (rewrite/redirect/next).
4. Passer cette réponse à une version adaptée de `updateSession(request, response)` qui ajoute les cookies Supabase sans détruire la rewrite ni les headers.
5. Pour une route API, callback, webhook ou ressource statique, **ne pas appeler le middleware next-intl**, mais décider séparément si Supabase doit encore rafraîchir la session.
6. Pour toute redirection auth, créer une URL localisée et recopier tous les cookies/headers nécessaires depuis la réponse composée.

Le point important est qu'il y a deux matchers conceptuels :

- matcher **i18n** : exclut API, `_next`, statiques, callback technique et webhook;
- matcher **Supabase** : doit préserver au minimum le comportement actuel, qui inclut les API.

Un unique `export const config.matcher` qui exclut totalement `/api` empêcherait aussi l'exécution de Supabase sur les API. Pour satisfaire simultanément « API exclues du matcher i18n » et « refresh Supabase sur toutes les routes », il faut soit un matcher Next assez large avec un branchement interne, soit accepter explicitement que les Route Handlers gèrent seuls leur session sans refresh middleware. Cette ambiguïté doit être tranchée avant implémentation.

## 3.4 Matcher i18n à exclure

À minima :

- `/api/*`
- `/api/webhooks/stripe` explicitement
- `/auth/callback` si le callback reste hors `[locale]`
- `/_next/*`
- fichiers contenant une extension (`.*\..*`), dont images, favicon, manifest éventuel
- éventuellement les endpoints PostHog réécrits sous `/api/events/*`

Ne pas conserver les exclusions actuelles des pages SEO/blog : elles doivent être internationalisées et donc repasser dans la couche i18n.

---

# 4. Propagation de la langue côté serveur

## 4.1 Fournisseur IA réel

Le brief parle d'Anthropic, mais le code utilise exclusivement `openai` :

- `src/lib/openai.ts`
- `src/app/api/bac/identify/route.ts`
- `src/app/api/extract-image-text/route.ts`
- `src/lib/email-marketing.ts`

Aucune dépendance `@anthropic-ai/sdk` n'est présente dans `package.json`.

Le dépôt contient **17 appels directs** à `openai.chat.completions.create` : 14 dans `src/lib/openai.ts`, un pour l'OCR, un pour l'identification Bac et un pour la génération marketing. Aucun Server Action ne déclenche actuellement IA, email ou Stripe.

## 4.2 Générations déjà partiellement localisées

`src/components/content-input-form.tsx:18-28` propose actuellement 9 langues de contenu : `fr`, `en`, `es`, `de`, `it`, `pt`, `ar`, `zh`, `ja`. L'état par défaut est `fr` ligne 43.

`src/lib/openai.ts:11-20` contient `LANGUAGE_NAMES` et `langInstruction(language)`. Les fonctions suivantes acceptent déjà `language = 'fr'` :

| Fonction | Définition | Route appelante |
|---|---|---|
| `generateFlashcards` | `src/lib/openai.ts:22` | `api/generate/flashcards:59` |
| `generateFiche` | `src/lib/openai.ts:54` | `api/generate/fiche:58` |
| `generateSchema` | `src/lib/openai.ts:80` | `api/generate/schema:44` |
| `generateTimeline` | `src/lib/openai.ts:116` | `api/generate/timeline:44` |
| `generateExam` | `src/lib/openai.ts:157` | `api/generate/exam:42` |

Les cinq Route Handlers lisent `language = 'fr'` dans le JSON du client. C'est déjà une propagation de la langue du **contenu généré**.

Doutes/risques :

- `langInstruction` ne fait rien pour `fr`, alors que le prompt système est français. Pour les autres langues, il ajoute une instruction anglaise en fin de prompt. Cela fonctionne probablement, mais ce n'est pas lié à la locale d'interface.
- Le sélecteur actuel contient `ar`, `zh`, `ja`, alors que les locales UI cibles n'en contiennent que six. Il ne faut pas supprimer ces langues de génération par accident.
- La préférence UI du profil ne doit pas écraser silencieusement un choix explicite de langue de génération de l'utilisateur.
- Les tables `decks`, `fiches`, `schemas` et `timelines` ne semblent pas toutes stocker la langue de génération; `exams` possède une colonne `language` dans la migration `003_new_features.sql`.

## 4.3 Prompts OpenAI sans paramètre de locale

Toutes les fonctions suivantes produisent du contenu user-facing en français mais n'acceptent pas de locale :

| Fonction | Définition | Appel(s) |
|---|---|---|
| `evaluateOpenAnswer` | `src/lib/openai.ts:205` | `api/exams/[examId]/submit:61` |
| `explainDifferently` | `src/lib/openai.ts:240` | `api/generate/explain:32` |
| `analyzeLacunes` | `src/lib/openai.ts:270` | `api/analyze/lacunes:67` |
| `socrateResponse` | `src/lib/openai.ts:315` | création et messages Socrate |
| `socrateDiagnosis` | `src/lib/openai.ts:348` | diagnostic Socrate |
| `evaluateFreeRecall` | `src/lib/openai.ts:386` | évaluation recall |
| `analyzeExamStyle` | `src/lib/openai.ts:428` | `api/generate/annales:74` |
| `generateFromTemplate` | `src/lib/openai.ts:458` | `api/generate/annales:84` |
| `generateStudyPlanSchedule` | `src/lib/openai.ts:549` | création et régénération de planning |

Appels directs supplémentaires :

- `src/app/api/bac/identify/route.ts:226` génère/normalise des noms de matières et messages via OpenAI.
- `src/app/api/extract-image-text/route.ts:45` utilise OpenAI pour l'OCR. Ici la bonne règle est probablement de préserver la langue du document, pas de traduire l'extraction dans la locale UI.
- `src/lib/email-marketing.ts:81-140` utilise OpenAI pour générer des campagnes en français.

Tous les prompts de `src/lib/openai.ts` sont actuellement rédigés en français. Les sorties structurées contiennent aussi des exemples/valeurs françaises (`entraîne`, `politique`, feedback, conseils, etc.).

## 4.4 Emails transactionnels et marketing

### Templates transactionnels

`src/lib/resend.ts`

- `baseLayout` fixe `<html lang="fr">` ligne 14.
- `sendWelcomeEmail(to)` lignes 57-87, appelé par :
  - `src/app/api/auth/register/route.ts:55`
  - `src/app/auth/callback/route.ts:24`
- `sendWelcomeProEmail(to)` lignes 89-121, appelé par :
  - `src/app/api/webhooks/stripe/route.ts:87`
- `sendSubscriptionCancelledEmail(to)` lignes 123-153, appelé par :
  - `src/app/api/webhooks/stripe/route.ts:158`

Les signatures n'acceptent que `to`; sujets, HTML, CTA et URLs sont français. Pour propager la locale, il faudra faire accepter une locale au renderer/template, puis la fournir depuis le profil. Le webhook Stripe n'a parfois que l'email/customer : il devra récupérer la préférence du profil à partir du `user_id` metadata ou du `stripe_customer_id`.

### Marketing

`src/lib/email-marketing.ts`

- Le prompt système est français.
- `generateEmailHtml(history, userMessage)` n'accepte pas de locale.
- `getRecipients` sélectionne `id, email, full_name`, pas la locale.
- `sendCampaign(campaignId)` envoie un même `subject/html_body` à tous les destinataires.
- L'URL de désinscription est non localisée : `${APP_URL}/unsubscribe?...`.

Une campagne multilingue nécessite soit un template par locale dans une même campagne, soit des campagnes séparées. Ce choix n'est pas défini dans le brief.

### Schéma Supabase

`supabase/migrations/001_initial.sql:2-11` définit `profiles` sans locale. Les migrations suivantes ajoutent Stripe et consentement marketing, mais aucune préférence de langue. Une migration sera nécessaire en phase 3, avec validation/check sur les six locales et un comportement pour les utilisateurs existants.

## 4.5 Stripe Checkout

Définition : `src/lib/stripe.ts:9-41`.

Appel : `src/app/api/billing/checkout/route.ts:17`.

État actuel :

- `createCheckoutSession(userId, email, referralCode?)` n'accepte pas de locale.
- `stripe.checkout.sessions.create` ne passe pas `locale`.
- `success_url` et `cancel_url` pointent toujours vers `${APP_URL}/billing`, donc un utilisateur anglais reviendrait sur la route française par défaut.
- `createPortalSession` retourne aussi vers `/billing` sans locale et ne passe pas le paramètre `locale`, alors que le SDK Stripe installé le supporte pour le Customer Portal.

À prévoir :

1. Résoudre la locale effective selon la priorité définie (profil > cookie > route/Accept-Language).
2. La passer à `createCheckoutSession` et à `stripe.checkout.sessions.create({locale})` avec un mapping typé si Stripe n'accepte pas exactement les mêmes codes.
3. Construire les URLs de retour localisées en conservant l'absence de préfixe pour `fr`.
4. Conserver EUR, comme demandé.
5. Si le portail doit suivre la locale de l'application, passer aussi `locale` directement à `stripe.billingPortal.sessions.create`; `preferred_locales` reste une alternative durable mais non demandée.

---

# 5. Risques identifiés et points de doute

## Risques critiques

1. **Version réelle différente du brief** : dépôt en Next 16.2.6, pas Next 15. Avant phase 1, décider si l'on implémente pour Next 16 (`proxy.ts` selon la recommandation actuelle) ou si le `package.json` local fait partie de changements non finalisés.
2. **Working tree très sale** : de nombreux fichiers sont modifiés et un layout admin est non suivi. Un déplacement massif vers `[locale]` rendra les conflits et le commit difficiles à relire. Il faut préserver strictement les modifications existantes et définir ce que le commit i18n doit inclure.
3. **Anthropic absent** : toute implémentation basée sur le brief sans audit aurait ciblé le mauvais fournisseur. La phase 4 doit parler d'OpenAI dans ce dépôt.
4. **Composition de réponses middleware** : cookies Supabase, rewrites `next-intl` et redirections auth peuvent s'écraser mutuellement.
5. **Pathname auth avec préfixes** : les gardes actuels ne reconnaissent aucune route `/en/*`, `/es/*`, etc.
6. **Matcher contradictoire** : exclure `/api` du matcher Next global empêche le refresh Supabase sur les API, alors que le comportement actuel les inclut.
7. **Client pages** : impossible d'appeler directement `setRequestLocale` dans les nombreux fichiers `'use client'`. Des wrappers serveur augmentent fortement le périmètre de la phase plomberie.
8. **`generateStaticParams` généralisé** : dangereux/impossible pour des routes privées dynamiques Supabase. Le besoin doit être limité au segment locale et aux contenus publics statiques.
9. **URLs de callback et de paiement** : auth OAuth, Stripe success/cancel/portal et désinscription peuvent faire perdre la locale.
10. **SEO** : déplacer aveuglément sitemap, robots et OG sous `[locale]` peut changer leurs URLs ou créer des doublons. Les URLs françaises doivent être testées une par une.
11. **Routes privées incomplètement gardées** : `/bac` et `/upgrade` ne figurent pas dans la garde middleware actuelle. La migration i18n doit corriger ou explicitement conserver ce comportement, pas le masquer.

## Risques fonctionnels

12. **Deux concepts de langue** : langue UI et langue du contenu généré sont distinctes. Le formulaire permet neuf langues de génération, contre six locales UI.
13. **Sorties IA partiellement localisées** : seules cinq fonctions reçoivent `language`; feedback d'examen, explications, lacunes, Socrate, recall, annales et planning restent français.
14. **Préférence profil absente** : migration Supabase, types et RLS/update action nécessaires.
15. **Emails envoyés depuis des webhooks** : le webhook doit retrouver la locale sans dépendre d'un cookie navigateur.
16. **Campagnes marketing** : un template unique ne peut pas servir proprement plusieurs langues sans choix de modèle de données.
17. **Erreurs API** : traduire dans les handlers exige de résoudre une locale sur des routes explicitement exclues du middleware i18n, ou de traduire côté client via codes d'erreur.
18. **Contenu éditorial massif** : blog, CGU/CGV, confidentialité et changelog ne sont pas de simples microcopies. Les placer dans un unique `fr.json` produira un fichier volumineux et difficile à maintenir.
19. **Admin** : traduire le back-office n'est pas explicitement priorisé, mais ses strings sont nombreuses.
20. **Metadata statiques** : 22 déclarations doivent devenir dynamiques avec `getTranslations`, ce qui peut changer la stratégie de rendu/cache.
21. **Formatage français diffus** : 43 occurrences et plusieurs pluriels manuels; les oublier laissera une UI partiellement française.

## Points nécessitant validation avant phase 1

1. Doit-on cibler **Next 16 actuel** ou revenir/raisonner comme si le projet était encore en Next 15 ?
2. Quand le brief dit « déplace `app/` vers `app/[locale]/` », confirme-t-on que `api`, `auth/callback`, webhooks et fichiers techniques restent hors du segment locale ?
3. « `setRequestLocale` dans chaque page » autorise-t-il des wrappers Server Components pour les pages clientes ?
4. « `generateStaticParams` » vise-t-il uniquement `[locale]` et les routes publiques statiques, et non les IDs privés Supabase ?
5. Le middleware Supabase doit-il continuer à s'exécuter sur `/api/*`, comme aujourd'hui, ou les Route Handlers suffisent-ils ?
6. Les pages admin doivent-elles être traduites avec le reste du dashboard ?
7. Blog, changelog et documents légaux doivent-ils entrer dans `fr.json`, ou rester dans une couche de contenu localisée séparée ?
8. La locale UI doit-elle initialiser la langue de génération uniquement au premier affichage, tout en laissant le sélecteur actuel indépendant ?
9. Pour les erreurs API, préfère-t-on des messages traduits côté serveur ou des codes stables traduits côté client ?
10. Pour les emails marketing, faut-il un template par langue dans une campagne ou une campagne par langue ?

---

# Conclusion de phase 0

La migration est faisable sans changer les URLs françaises, mais la phase 1 ne doit pas commencer avant validation des points ci-dessus, surtout la version Next.js, le périmètre exact du segment `[locale]`, la composition middleware et la distinction entre locale UI et langue de génération.
