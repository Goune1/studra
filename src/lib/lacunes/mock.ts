export interface LacunesAnalysis {
  diagnostic: {
    summary: string
    bullets: string[]
  }
  conseils: Array<{
    icon: string
    title: string
    description: string
  }>
  encouragement: string
}

export interface MockCard {
  id: string
  question: string
  answer: string
  failRate: number
  attempts: boolean[]
  lastSeen: string
  deckId: string
}

export interface MockStats {
  sessions: number
  weakPoints: number
  successRate: number
}

export const mockStats: MockStats = {
  sessions: 5,
  weakPoints: 3,
  successRate: 68,
}

export const mockCards: MockCard[] = [
  {
    id: '1',
    question: "Qu'est-ce qu'une politique budgétaire\u00A0?",
    answer:
      'La politique budgétaire concerne les décisions sur les dépenses publiques et la fiscalité par le gouvernement.',
    failRate: 82,
    attempts: [false, false, true, false, false],
    lastSeen: '2026-04-01',
    deckId: 'deck_1',
  },
  {
    id: '2',
    question: "Définir l'élasticité-prix de la demande",
    answer: 'Mesure la sensibilité de la demande à une variation du prix.',
    failRate: 67,
    attempts: [false, true, false, true, false],
    lastSeen: '2026-04-02',
    deckId: 'deck_1',
  },
  {
    id: '3',
    question: "Qu'est-ce que le multiplicateur keynésien\u00A0?",
    answer:
      'Effet par lequel une variation de la dépense autonome entraîne une variation plus que proportionnelle du revenu.',
    failRate: 50,
    attempts: [false, true, true, false, true],
    lastSeen: '2026-04-02',
    deckId: 'deck_2',
  },
  {
    id: '4',
    question: 'Distinguer chômage frictionnel et structurel',
    answer:
      "Le chômage frictionnel est temporaire entre deux emplois\u00A0; le structurel résulte d'un décalage durable entre offre et demande.",
    failRate: 45,
    attempts: [true, false, true, true, false],
    lastSeen: '2026-03-30',
    deckId: 'deck_2',
  },
  {
    id: '5',
    question: "Qu'est-ce que l'effet d'éviction\u00A0?",
    answer:
      "Phénomène par lequel la hausse des dépenses publiques réduit l'investissement privé via la hausse des taux d'intérêt.",
    failRate: 30,
    attempts: [true, true, false, true, true],
    lastSeen: '2026-03-28',
    deckId: 'deck_1',
  },
]

export const mockAnalysis: LacunesAnalysis = {
  diagnostic: {
    summary:
      'Les difficultés se concentrent sur les mécanismes de politique économique et leurs effets macroéconomiques.',
    bullets: [
      'Confusion fréquente entre effets à court et long terme des politiques budgétaires',
      "Les concepts liés à l'investissement et aux taux d'intérêt sont systématiquement ratés",
      'Les définitions de base sont acquises mais leur application concrète pose problème',
    ],
  },
  conseils: [
    {
      icon: 'BookOpen',
      title: 'Lire des synthèses courtes',
      description:
        'Trouve des articles ou vidéos qui expliquent chaque mécanisme avec un exemple concret récent.',
    },
    {
      icon: 'Link',
      title: 'Relier théorie et pratique',
      description:
        'Pour chaque concept raté, trouve un exemple réel de politique économique appliquée dans un pays.',
    },
    {
      icon: 'Repeat',
      title: 'Refaire les cartes critiques',
      description:
        'Concentre la prochaine session uniquement sur les 3 cartes à taux d\'échec > 60\u00A0%.',
    },
    {
      icon: 'Users',
      title: 'Expliquer à voix haute',
      description:
        "La technique Feynman\u00A0: explique le concept comme si tu l'enseignais à quelqu'un d'autre.",
    },
  ],
  encouragement:
    'Chaque erreur est une information — tu sais maintenant exactement où concentrer ton effort.',
}
