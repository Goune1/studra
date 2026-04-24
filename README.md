# Studra

Application SaaS de révision assistée par IA. Génère automatiquement des flashcards, fiches de révision, schémas conceptuels, frises chronologiques et examens à partir de n'importe quel contenu (texte, PDF, YouTube).

## Stack

- **Framework** — Next.js 16 (App Router, Turbopack)
- **Base de données & Auth** — Supabase (PostgreSQL + Row Level Security)
- **IA** — OpenAI GPT-4o mini
- **Paiement** — Stripe (abonnement mensuel)
- **Style** — Tailwind CSS v4
- **Déploiement** — Vercel

## Fonctionnalités

| Fonctionnalité | Gratuit | Pro |
|---|:---:|:---:|
| Flashcards (10–25 cartes) | ✓ | ✓ |
| Fiche de révision Markdown | ✓ | ✓ |
| Schéma conceptuel interactif | ✓ | ✓ |
| Frise chronologique | ✓ | ✓ |
| Examen (QCM + questions ouvertes) | ✓ | ✓ |
| Mode étude interactif | ✓ | ✓ |
| 9 langues de génération | ✓ | ✓ |
| Générations par mois | 5 | Illimitées |
| Mode Socrate (dialogue IA) | — | ✓ |
| Analyse des lacunes | — | ✓ |

**Sources d'entrée acceptées** : texte libre, PDF (extraction automatique), URL YouTube (transcription automatique).

## Installation

### Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com)
- Clé API [OpenAI](https://platform.openai.com)
- Compte [Stripe](https://stripe.com) (optionnel pour le développement)

### 1. Cloner et installer

```bash
git clone https://github.com/Goune1/revision-ai.git
cd revision-ai
npm install
```

### 2. Variables d'environnement

Copier le fichier d'exemple et remplir les valeurs :

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

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=ton-email@example.com
```

### 3. Base de données

Appliquer les migrations Supabase :

```bash
npx supabase db push
```

Ou exécuter manuellement les fichiers SQL dans `supabase/migrations/` depuis l'interface Supabase.

### 4. Lancer en développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Pages login / register
│   ├── (dashboard)/         # Interface utilisateur protégée
│   │   ├── dashboard/       # Accueil avec stats et activité récente
│   │   ├── flashcards/      # Decks, mode étude, mode Socrate
│   │   ├── fiches/          # Fiches de révision Markdown
│   │   ├── schemas/         # Schémas conceptuels (React Flow)
│   │   ├── timelines/       # Frises chronologiques
│   │   ├── exams/           # Examens et résultats
│   │   ├── lacunes/         # Analyse des lacunes (Pro)
│   │   ├── billing/         # Gestion abonnement Stripe
│   │   └── settings/        # Paramètres du compte
│   ├── api/
│   │   ├── generate/        # Routes de génération IA (flashcards, fiche, schéma, etc.)
│   │   ├── extract/         # Extraction PDF et YouTube
│   │   ├── billing/         # Checkout et portail Stripe
│   │   └── webhooks/        # Webhooks Stripe
│   └── page.tsx             # Landing page
├── components/
│   ├── dashboard/           # Composants du tableau de bord
│   ├── lacunes/             # Composants analyse des lacunes
│   ├── landing/             # Sections de la landing page
│   └── flashcards/          # Composant de carte flashcard
└── lib/
    └── supabase/            # Clients Supabase (server / client)
```

## Plans et limites

- **Gratuit** — 5 générations par mois, toutes les fonctionnalités de base
- **Pro (4,99 €/mois)** — Générations illimitées, Mode Socrate, Analyse des lacunes

Le compteur de générations se réinitialise automatiquement chaque début de mois via un webhook Stripe ou une fonction Supabase.

## Stripe Webhook (développement local)

Pour tester les webhooks Stripe en local :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.
