# Studra

SaaS de révision assistée par IA. Génère automatiquement des outils de révision à partir de n'importe quel contenu (texte libre, PDF, YouTube).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Base de données & Auth | Supabase (PostgreSQL, RLS, SSR) |
| IA | OpenAI GPT-5-nano |
| Répétition espacée | ts-fsrs (algorithme FSRS) |
| Visualisation | @xyflow/react (React Flow) |
| Paiement | Stripe (checkout, portail, webhooks) |
| Email | Resend |
| Extraction | pdf-parse, Supadata (YouTube), youtube-transcript (fallback) |
| Déploiement | Vercel (Analytics + Speed Insights) |
| Langage | TypeScript 5 (strict) |

## Fonctionnalités

### Génération IA

| Outil | Description |
|-------|-------------|
| **Flashcards** | Decks de 10–25 cartes avec mode étude (FSRS) |
| **Fiches** | Fiches de révision en Markdown structuré |
| **Schémas** | Cartes conceptuelles interactives (drag & drop) |
| **Frises chronologiques** | Événements classés par date |
| **Examens** | QCM + questions ouvertes, correction automatique |
| **Annales** | Sujets d'examen générés à partir d'un modèle |
| **Planning** | Plan de révision adapté à une date d'examen |

### Fonctionnalités Pro

| Outil | Description |
|-------|-------------|
| **Socrate** | Dialogue guidé par IA pour tester la compréhension |
| **Rappel libre** | Session de rappel chronométrée avec évaluation IA |
| **Lacunes** | Analyse automatique des points faibles (flashcards + rappels) |

### Sources d'entrée

- Texte libre
- PDF (extraction serveur)
- URL YouTube (transcription automatique)
- Image (OCR)

### Autres

- 9 langues de génération
- Thème clair / sombre
- Paramètres FSRS personnalisables (rétention cible, intervalle max, poids)
- Panel d'administration (générations, paiements)
- Blog + pages SEO

## Plans

| | Gratuit | Pro (4,99 €/mois) |
|---|:---:|:---:|
| Flashcards, Fiches, Schémas, Frises, Examens, Annales, Planning | ✓ | ✓ |
| 9 langues | ✓ | ✓ |
| Générations / mois | 5 | Illimitées |
| Socrate, Rappel libre, Lacunes | — | ✓ |
| Paramètres FSRS avancés | — | ✓ |

## Installation

### Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com)
- Clé API [OpenAI](https://platform.openai.com)
- Compte [Stripe](https://stripe.com) (optionnel en développement)
- Compte [Resend](https://resend.com) (optionnel en développement)

### 1. Cloner et installer

```bash
git clone <repo-url>
cd studra
npm install
```

### 2. Variables d'environnement

```bash
cp .env.exemple .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supadata
SUPADATA_API_KEY=...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@studra.fr

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=ton-email@example.com
```

### 3. Base de données

```bash
npx supabase db push
```

Ou exécuter manuellement les fichiers dans `supabase/migrations/` depuis l'interface Supabase.

### 4. Lancer en développement

```bash
npm run dev
```

Disponible sur [http://localhost:3000](http://localhost:3000).

### Webhooks Stripe en local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.

## Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Login / Register
│   ├── (dashboard)/         # Routes protégées
│   │   ├── dashboard/       # Accueil (stats, activité)
│   │   ├── flashcards/      # Decks et mode étude
│   │   ├── fiches/          # Fiches Markdown
│   │   ├── schemas/         # Schémas React Flow
│   │   ├── timelines/       # Frises chronologiques
│   │   ├── exams/           # Examens et résultats
│   │   ├── annales/         # Sujets d'annales
│   │   ├── socrate/         # Dialogue socratique (Pro)
│   │   ├── recall/          # Rappel libre (Pro)
│   │   ├── lacunes/         # Analyse des lacunes (Pro)
│   │   ├── planning/        # Plan de révision
│   │   ├── billing/         # Abonnement Stripe
│   │   └── settings/        # Paramètres + FSRS
│   ├── (seo)/               # Pages SEO publiques
│   ├── admin/               # Panel administrateur
│   ├── blog/                # Articles de blog
│   ├── api/
│   │   ├── generate/        # Génération IA
│   │   ├── extract/         # PDF et YouTube
│   │   ├── billing/         # Stripe checkout / portail
│   │   ├── webhooks/        # Webhooks Stripe
│   │   └── ...              # CRUD flashcards, fiches, etc.
│   └── page.tsx             # Landing page
├── components/              # Composants React
├── lib/
│   ├── supabase/            # Clients server / client / middleware
│   ├── fsrs/                # Logique de répétition espacée
│   ├── openai.ts            # Fonctions de génération IA
│   ├── stripe.ts            # Intégration Stripe
│   └── resend.ts            # Envoi d'emails
└── types/                   # Interfaces TypeScript
```
