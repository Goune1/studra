export type ContentBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  readingTime: string
  category: string
  content: ContentBlock[]
  faq: { q: string; a: string }[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'studra-vs-anki-vs-quizlet-comparatif',
    title: 'Studra vs Anki vs Quizlet : comparatif complet 2025',
    description:
      "Anki, Quizlet ou Studra ? On compare les trois outils de révision par flashcards sur la génération automatique, l'algorithme de répétition espacée, l'IA intégrée et le prix.",
    publishedAt: '2026-04-10',
    readingTime: '7 min',
    category: 'Comparatifs',
    content: [
      {
        type: 'p',
        text: "Pour réviser efficacement, les flashcards restent l'un des outils les plus puissants validés par la science cognitive. Mais tous les outils de flashcards ne se valent pas. Anki, Quizlet et Studra incarnent trois philosophies très différentes. Voici un comparatif objectif pour t'aider à choisir.",
      },
      {
        type: 'h2',
        text: 'Anki : le vétéran de la répétition espacée',
      },
      {
        type: 'p',
        text: "Anki existe depuis 2006 et reste la référence mondiale pour la révision par flashcards. Son principal avantage : un algorithme de répétition espacée éprouvé (SM-2, puis FSRS en option) qui planifie les révisions au moment optimal. Anki est utilisé par des milliers d'étudiants en médecine, en droit et en langues.",
      },
      {
        type: 'p',
        text: "Ses limites sont connues : créer des cartes manuellement prend énormément de temps. Pour 50 pages de cours, compter 2 à 5 heures de saisie. L'interface est datée, la courbe d'apprentissage est longue, et la synchronisation entre appareils est payante sur iOS. Les decks partagés existent mais la qualité est très variable.",
      },
      {
        type: 'h2',
        text: 'Quizlet : populaire mais superficiel',
      },
      {
        type: 'p',
        text: "Quizlet est l'outil le plus utilisé dans les lycées et universités, principalement pour sa facilité de prise en main et ses nombreux decks partagés. Il propose plusieurs modes d'apprentissage (cartes, tests, matching) et une application mobile soignée.",
      },
      {
        type: 'p',
        text: "Cependant, Quizlet n'utilise pas un vrai algorithme de répétition espacée (FSRS ou SM-2). Son mode \"Apprentissage\" est basé sur des heuristiques simples, pas sur la modélisation de la mémoire. L'IA intégrée (Q-Chat) génère des flashcards basiques depuis un texte collé, mais sans import PDF natif performant ni transcription YouTube. Le plan gratuit est de plus en plus limité.",
      },
      {
        type: 'h2',
        text: "Studra : l'IA au cœur de la révision",
      },
      {
        type: 'p',
        text: "Studra part d'un constat simple : créer des flashcards manuellement est la partie la plus fastidieuse — et la moins efficace — du processus de révision. Studra automatise entièrement la création depuis ton cours, ton PDF ou une vidéo YouTube, grâce à l'IA (GPT-5 nano).",
      },
      {
        type: 'p',
        text: "Les cartes générées par Studra utilisent l'algorithme FSRS 5 — la version la plus récente et la plus précise disponible — pour planifier les révisions. Chaque carte dispose d'un modèle individuel de ta mémoire : stabilité et difficulté sont recalculées après chaque réponse. Tu réponds sur 4 niveaux (Encore, Difficile, Bien, Facile) pour un calibrage précis.",
      },
      {
        type: 'p',
        text: "Studra ne se limite pas aux flashcards : le même cours génère aussi des fiches de révision structurées, des examens blancs (7 QCM + 3 questions ouvertes), des schémas conceptuels, des frises chronologiques et un planning de révision personnalisé. C'est un écosystème complet de révision active, pas juste un outil de flashcards.",
      },
      {
        type: 'h2',
        text: 'Tableau comparatif',
      },
      {
        type: 'table',
        headers: ['Critère', 'Studra', 'Anki', 'Quizlet'],
        rows: [
          ['Génération automatique IA', '✓ (PDF, texte, YouTube)', '✗ (manuel)', '~ (texte uniquement, basique)'],
          ['Algorithme de répétition espacée', 'FSRS 5', 'SM-2 / FSRS (option)', 'Heuristiques simples'],
          ['Import PDF', '✓ (OCR inclus)', '✗', '~ (limité)'],
          ['Transcription YouTube', '✓', '✗', '✗'],
          ['Multi-formats (fiches, examens, schémas)', '✓', '✗', '✗'],
          ['Gratuit (offre de base)', '✓', '✓', '~ (de plus en plus limité)'],
          ['Open source', '✗', '✓', '✗'],
          ['Application mobile dédiée', 'Web (responsive)', '✓ (iOS payant)', '✓'],
        ],
      },
      {
        type: 'h2',
        text: 'Quel outil choisir ?',
      },
      {
        type: 'p',
        text: "Si tu veux créer tes propres decks manuellement avec un contrôle total et une application mobile hors ligne : Anki. Si tu cherches des decks partagés prêts à l'emploi et une interface simple : Quizlet. Si tu veux transformer ton cours en flashcards (et bien plus) en quelques secondes, sans effort de création : Studra.",
      },
      {
        type: 'p',
        text: "Ces outils ne sont pas mutuellement exclusifs. Beaucoup d'étudiants utilisent Studra pour générer des cartes rapidement, puis importent dans Anki les plus importantes pour profiter de la synchronisation mobile hors ligne. L'essentiel est de pratiquer la révision active régulièrement — quel que soit l'outil.",
      },
    ],
    faq: [
      {
        q: 'Peut-on importer les flashcards Studra dans Anki ?',
        a: "Pas encore nativement, mais tu peux copier-coller le contenu des cartes. Une export Anki (.apkg) est sur notre roadmap.",
      },
      {
        q: 'Studra est-il vraiment gratuit ?',
        a: "Oui, le plan gratuit donne accès à toutes les fonctionnalités avec 5 générations par mois. Le plan Pro (4,99 €/mois) offre des générations illimitées et des fonctionnalités avancées.",
      },
      {
        q: "Quizlet a une IA, en quoi Studra est-il différent ?",
        a: "L'IA de Quizlet génère des cartes basiques depuis du texte collé. Studra génère depuis des PDFs (avec OCR), des vidéos YouTube (transcription auto) et structure les cartes avec un niveau de qualité bien supérieur. Studra utilise aussi le vrai FSRS 5, pas des heuristiques.",
      },
      {
        q: 'Anki ou Studra pour le concours de médecine ?',
        a: "Pour le concours de médecine, la combinaison idéale est souvent Studra pour générer des cartes depuis les cours magistraux et des fiches de révision structurées, puis Anki pour les révisions quotidiennes sur mobile. Studra réduit le temps de création de 80 à 90 %.",
      },
    ],
  },
  {
    slug: 'comment-creer-flashcards-pdf',
    title: "Comment créer des flashcards depuis un PDF (méthode rapide avec l'IA)",
    description:
      "Transformer un cours PDF en flashcards prend des heures manuellement. Découvre comment l'IA permet de générer des cartes question/réponse de qualité en quelques secondes.",
    publishedAt: '2026-04-12',
    readingTime: '5 min',
    category: 'Tutoriels',
    content: [
      {
        type: 'p',
        text: "Créer des flashcards depuis un PDF est l'une des tâches les plus chronophages de la révision estudiantine. Pour un cours de 40 pages, compter 3 à 6 heures de travail en méthode manuelle. L'IA change complètement la donne : ce qui prenait des heures se fait désormais en secondes.",
      },
      {
        type: 'h2',
        text: 'Pourquoi les flashcards sont-elles efficaces pour mémoriser ?',
      },
      {
        type: 'p',
        text: "Les flashcards activent la pratique de récupération (retrieval practice), l'une des techniques d'apprentissage les mieux documentées par la recherche cognitive. Contrairement à relire ses notes passivement, se tester sur des questions force le cerveau à reconstruire l'information — ce qui consolide la trace mémorielle.",
      },
      {
        type: 'p',
        text: "Combinées à la répétition espacée (réviser chaque carte au moment précis où tu vas l'oublier), les flashcards permettent de mémoriser durablement n'importe quel contenu avec un minimum d'effort. C'est la méthode utilisée par les étudiants en médecine pour maîtriser des milliers de faits cliniques.",
      },
      {
        type: 'h2',
        text: 'Méthode 1 : créer les flashcards manuellement',
      },
      {
        type: 'p',
        text: "La méthode classique consiste à lire son cours, identifier les concepts clés, formuler des questions et saisir les paires question/réponse dans Anki ou Quizlet. C'est laborieux mais efficace si bien fait — notamment parce que le processus de reformulation aide à comprendre le contenu.",
      },
      {
        type: 'p',
        text: "Le problème : pour un étudiant en droit, médecine ou sciences humaines qui doit couvrir des centaines de pages par semaine, cette méthode n'est pas scalable. Les cartes créées sous pression de temps sont souvent trop larges, mal formulées ou incomplètes.",
      },
      {
        type: 'h2',
        text: "Méthode 2 : générer des flashcards depuis un PDF avec l'IA",
      },
      {
        type: 'p',
        text: "Studra utilise GPT-5 nano pour analyser ton cours et générer automatiquement des paires question/réponse de qualité. L'IA identifie les concepts clés, les définitions, les distinctions importantes et formule des cartes ciblées. Le processus prend 10 à 30 secondes pour un cours standard.",
      },
      {
        type: 'h3',
        text: 'Étape 1 : importer ton PDF',
      },
      {
        type: 'p',
        text: "Dans Studra, clique sur « Nouveau contenu » et sélectionne ton fichier PDF (jusqu'à 10 Mo). Studra supporte les PDFs natifs comme les PDFs scannés grâce à l'OCR intégré. Tu peux aussi coller directement le texte de ton cours, ou coller un lien YouTube pour une transcription automatique.",
      },
      {
        type: 'h3',
        text: 'Étape 2 : générer les flashcards',
      },
      {
        type: 'p',
        text: "Sélectionne le format « Flashcards » et clique sur Générer. En 10 à 30 secondes, Studra produit entre 10 et 25 flashcards question/réponse couvrant les points essentiels de ton cours. Tu peux modifier les cartes, en supprimer, ou en ajouter manuellement.",
      },
      {
        type: 'h3',
        text: "Étape 3 : réviser avec l'algorithme FSRS 5",
      },
      {
        type: 'p',
        text: "Lance une session de révision et Studra te présente les cartes dans l'ordre optimal selon l'algorithme FSRS 5. Pour chaque carte, tu évalues ta réponse sur 4 niveaux : Encore (à revoir immédiatement), Difficile, Bien, Facile. L'algorithme calcule la prochaine date de révision de chaque carte individuellement, en modélisant ta mémoire.",
      },
      {
        type: 'h2',
        text: 'Conseils pour de meilleures flashcards IA',
      },
      {
        type: 'ul',
        items: [
          "Découpe ton cours en chapitres avant d'importer : des cartes thématiques sont plus faciles à réviser que des cartes encyclopédiques.",
          "Génère plusieurs fois depuis un même cours pour obtenir des angles différents. L'IA varie les formulations.",
          "Supprime les cartes trop larges ou trop faciles après génération. La qualité compte plus que la quantité.",
          "Combine flashcards et fiche de révision Studra : la fiche donne la vue d'ensemble, les cartes ancrent les détails.",
          'Révise régulièrement : FSRS est conçu pour des révisions quotidiennes de 10 à 20 minutes.',
        ],
      },
      {
        type: 'h2',
        text: 'PDFs scannés et photos de cours',
      },
      {
        type: 'p',
        text: "Studra intègre un OCR (reconnaissance optique de caractères) qui extrait le texte des PDFs scannés et des images. Tu peux donc importer des photocopies de cours, des photos de tableau, ou des scans de notes manuscrites (si l'écriture est lisible). La qualité des cartes générées dépend directement de la qualité de l'extraction.",
      },
    ],
    faq: [
      {
        q: 'Combien de flashcards Studra génère-t-il depuis un PDF ?',
        a: 'Entre 10 et 25 cartes selon la longueur et la densité du cours. Pour un cours de 20 pages, attends-toi à 15-20 cartes couvrant les concepts clés.',
      },
      {
        q: "L'IA génère-t-elle de vraies questions ou des résumés ?",
        a: "Studra génère des paires question/réponse réelles, pas de simples résumés. Les questions ciblent les définitions, les distinctions conceptuelles, les mécanismes, les dates importantes — selon le type de contenu détecté.",
      },
      {
        q: 'Puis-je modifier les flashcards générées ?',
        a: 'Oui, chaque carte est entièrement modifiable après génération. Tu peux aussi en ajouter manuellement ou en supprimer.',
      },
      {
        q: "Studra fonctionne-t-il avec des PDFs en langue étrangère ?",
        a: "Oui, Studra génère des flashcards dans la langue du cours importé. L'outil supporte le français, l'anglais, l'espagnol, l'allemand, l'italien et 4 autres langues.",
      },
    ],
  },
  {
    slug: 'fsrs-vs-sm2-algorithme-repetition-espacee',
    title: 'FSRS 5 vs SM-2 : quel algorithme de répétition espacée est le plus efficace ?',
    description:
      "SM-2 est l'algorithme historique d'Anki. FSRS 5 est son successeur open-source. On compare les deux sur la précision, la personnalisation et les résultats expérimentaux.",
    publishedAt: '2026-04-15',
    readingTime: '8 min',
    category: 'Science de la mémoire',
    content: [
      {
        type: 'p',
        text: "La répétition espacée est l'une des techniques d'apprentissage les plus validées scientifiquement. Son efficacité repose entièrement sur la qualité de l'algorithme qui planifie les révisions. Deux algorithmes dominent le paysage : SM-2, historiquement utilisé par Anki, et FSRS, son successeur open-source. Voici une comparaison technique objective.",
      },
      {
        type: 'h2',
        text: "C'est quoi la répétition espacée ?",
      },
      {
        type: 'p',
        text: "La répétition espacée consiste à revoir un élément (une flashcard, un concept) exactement au moment où tu es sur le point de l'oublier. Cette technique exploite la courbe de l'oubli d'Ebbinghaus : chaque révision juste avant l'oubli renforce la trace mémorielle et allonge l'intervalle avant la prochaine révision nécessaire.",
      },
      {
        type: 'p',
        text: "L'enjeu algorithmique est de prédire précisément quand tu vas oublier chaque élément — et de planifier la révision au bon moment. Trop tôt : révision inutile. Trop tard : tu as oublié, le réapprentissage prend plus de temps.",
      },
      {
        type: 'h2',
        text: "SM-2 : l'algorithme historique",
      },
      {
        type: 'p',
        text: "SM-2 a été développé par Piotr Woźniak en 1987 dans le cadre du logiciel SuperMemo. Il a été adopté par Anki en 2006 et est resté l'algorithme dominant pendant près de 30 ans. SM-2 calcule l'intervalle de la prochaine révision à partir de deux variables : l'intervalle précédent et un facteur de facilité (easiness factor) qui évolue en fonction de tes performances.",
      },
      {
        type: 'p',
        text: "SM-2 a ses limites bien documentées. Le facteur de facilité tend à diminuer de manière irréversible (le phénomène dit de 'ease hell' : les cartes difficiles obtiennent des intervalles de plus en plus courts, indépendamment de ta progression réelle). L'algorithme ne modélise pas la stabilité de la mémoire de manière précise — il utilise des heuristiques fixes qui ne s'adaptent pas bien aux profils d'apprentissage individuels.",
      },
      {
        type: 'h2',
        text: 'FSRS : la rupture algorithmique',
      },
      {
        type: 'p',
        text: "FSRS (Free Spaced Repetition Scheduler) a été développé par Jarrett Ye (Dae) en 2022 et intégré dans Anki comme option alternative en 2023. FSRS est open-source et optimisé sur des millions de révisions réelles d'utilisateurs Anki.",
      },
      {
        type: 'p',
        text: "FSRS introduit un modèle cognitif explicite basé sur deux variables par carte : la stabilité (durée avant oubli) et la difficulté intrinsèque (propriété de la carte, pas de l'utilisateur). Ces deux paramètres sont calculés et mis à jour individuellement pour chaque carte après chaque révision.",
      },
      {
        type: 'h2',
        text: 'Les différences clés',
      },
      {
        type: 'table',
        headers: ['Critère', 'SM-2', 'FSRS 5'],
        rows: [
          ['Base théorique', 'Heuristiques empiriques', 'Modèle cognitif explicite (stabilité + difficulté)'],
          ['Personnalisation par carte', 'Partielle (easiness factor)', 'Complète (stabilité + difficulté individuelles)'],
          ['Phénomène ease hell', 'Oui', 'Non'],
          ['Précision de prédiction', 'Bonne', 'Supérieure (validée sur données réelles)'],
          ['Niveaux de réponse', '3 (Oublié, Correct, Facile)', '4 (Encore, Difficile, Bien, Facile)'],
          ['Optimisation sur données', 'Non', 'Oui (millions de révisions Anki)'],
          ['Open source', '✓ (Anki)', '✓'],
        ],
      },
      {
        type: 'h2',
        text: 'Les résultats expérimentaux',
      },
      {
        type: 'p',
        text: "Des études comparatives sur des données réelles d'utilisateurs Anki montrent que FSRS réduit le nombre de révisions nécessaires pour maintenir un taux de rétention cible de 10 à 20 % par rapport à SM-2. Pour un étudiant révisant 100 cartes par jour, cela représente une économie de temps significative sur une semaine.",
      },
      {
        type: 'p',
        text: "L'amélioration est particulièrement visible sur les cartes difficiles : FSRS gère mieux les cartes chroniquement difficiles en leur attribuant des intervalles plus courts mais stables, sans tomber dans l'ease hell de SM-2.",
      },
      {
        type: 'h2',
        text: 'Pourquoi Studra utilise FSRS 5',
      },
      {
        type: 'p',
        text: "Studra utilise la version 5 de FSRS, la plus récente, optimisée sur un jeu de données encore plus large. Chaque carte générée depuis ton cours démarre avec des paramètres par défaut, puis se calibre sur tes révisions. Après 10 à 20 révisions d'une carte, le modèle est suffisamment précis pour prédire quasi exactement quand tu vas l'oublier.",
      },
      {
        type: 'p',
        text: "Combiné à la génération automatique par IA, FSRS 5 permet d'optimiser non seulement le moment des révisions, mais aussi leur contenu. Studra peut ainsi construire un planning de révision complet adapté à la date de ton examen, en tenant compte de l'état actuel de ta mémoire pour chaque concept.",
      },
    ],
    faq: [
      {
        q: 'FSRS est-il disponible dans Anki ?',
        a: "Oui, FSRS est disponible dans Anki depuis la version 23.10 comme option dans les paramètres du deck. Il remplace SM-2 par défaut dans les versions récentes.",
      },
      {
        q: 'Doit-on réapprendre toutes ses cartes quand on passe de SM-2 à FSRS ?',
        a: "Non, Anki propose une migration automatique. FSRS recalcule les intervalles en utilisant l'historique de tes révisions existantes. Studra démarre directement avec FSRS sans historique à migrer.",
      },
      {
        q: 'FSRS 5 fonctionne mieux que FSRS 4 ?',
        a: "FSRS 5 est optimisé sur un jeu de données plus large et introduit des améliorations dans la modélisation de la difficulté des cartes. Les gains sont marginaux mais réels, surtout sur les cartes complexes.",
      },
      {
        q: 'Peut-on personnaliser les paramètres FSRS dans Studra ?',
        a: "Studra utilise les paramètres FSRS 5 optimaux par défaut. Une personnalisation avancée des paramètres est prévue pour le plan Pro.",
      },
    ],
  },
  {
    slug: 'comment-reviser-efficacement-ia',
    title: "Comment réviser efficacement avec l'IA en 2025",
    description:
      'La révision passive (surligner, relire) ne fonctionne pas. Découvre comment combiner les techniques actives éprouvées avec les outils IA pour mémoriser 3x plus vite.',
    publishedAt: '2026-04-18',
    readingTime: '6 min',
    category: 'Méthodes de révision',
    content: [
      {
        type: 'p',
        text: "Chaque semaine, des millions d'étudiants passent des heures à relire leurs notes, surligner des paragraphes et recopier des résumés — sans que cela se traduise par une mémorisation durable. La recherche cognitive est formelle : ces techniques passives sont parmi les moins efficaces pour apprendre. Voici comment l'IA permet d'adopter les méthodes réellement prouvées, sans effort supplémentaire.",
      },
      {
        type: 'h2',
        text: 'Pourquoi la révision passive ne fonctionne pas',
      },
      {
        type: 'p',
        text: "Relire ses cours crée une illusion de maîtrise : le contenu semble familier parce qu'on l'a déjà vu, pas parce qu'on est capable de le restituer. Ce phénomène s'appelle la fluence de traitement (processing fluency) — notre cerveau confond facilité de lecture et compréhension réelle.",
      },
      {
        type: 'p',
        text: "Des méta-analyses sur des centaines d'études (Dunlosky et al., 2013) classent les techniques de révision selon leur efficacité. Surligner et relire obtiennent une efficacité 'faible'. La pratique de récupération (se tester) et la répétition espacée obtiennent une efficacité 'élevée' — les deux seules dans cette catégorie.",
      },
      {
        type: 'h2',
        text: 'Les techniques actives prouvées',
      },
      {
        type: 'h3',
        text: 'La pratique de récupération (retrieval practice)',
      },
      {
        type: 'p',
        text: "Se tester est plus efficace que relire. Chaque fois que ton cerveau reconstruit une information depuis la mémoire (plutôt que de la lire passivement), la trace mémorielle est renforcée. C'est le principe des flashcards, des QCM et du rappel libre.",
      },
      {
        type: 'h3',
        text: 'La répétition espacée',
      },
      {
        type: 'p',
        text: "Réviser au bon moment — juste avant l'oubli — maximise l'efficacité de chaque révision. L'algorithme FSRS 5 calcule automatiquement ces intervalles optimaux pour chaque élément à mémoriser.",
      },
      {
        type: 'h3',
        text: "L'apprentissage par entrelacement (interleaving)",
      },
      {
        type: 'p',
        text: "Mélanger les sujets et les types de questions pendant les révisions est plus efficace que de réviser un seul sujet à la fois (blocked practice). C'est contre-intuitif mais validé par la recherche : l'effort de discrimination entre les concepts renforce leur encodage.",
      },
      {
        type: 'h2',
        text: "Comment l'IA décuple les techniques actives",
      },
      {
        type: 'p',
        text: "Le principal obstacle à l'adoption des techniques actives n'est pas la motivation — c'est le coût de mise en place. Créer des flashcards manuellement prend 2 à 5 heures par cours. Écrire des questions d'examen blanc demande de l'expertise pédagogique. Concevoir un planning de révision optimal requiert de modéliser sa propre mémoire.",
      },
      {
        type: 'p',
        text: "L'IA supprime ces barrières. Studra génère en quelques secondes les supports de révision active depuis n'importe quel cours : flashcards FSRS 5, examens blancs (7 QCM + 3 questions ouvertes), fiches structurées, mode Socrate. Le temps libéré est entièrement consacré à la révision réelle.",
      },
      {
        type: 'h2',
        text: 'Protocole de révision optimal avec Studra',
      },
      {
        type: 'ol',
        items: [
          "Importe ton cours (PDF, texte, YouTube) dans Studra. En 30 secondes, tu as une fiche de révision structurée et 15-20 flashcards.",
          "Lis la fiche une fois pour avoir la vue d'ensemble et comprendre les relations entre concepts.",
          "Lance une session de flashcards. Révise toutes les nouvelles cartes une première fois.",
          "Refais le point sur les cartes évaluées 'Encore' ou 'Difficile' — ce sont tes lacunes.",
          "Génère un examen blanc depuis le cours pour t'auto-évaluer sur les questions ouvertes.",
          "Utilise le mode Socrate pour les concepts que tu n'arrives pas à expliquer clairement.",
          "Laisse Studra planifier la prochaine session de révision (il te rappellera quand revoir chaque carte).",
        ],
      },
      {
        type: 'h2',
        text: 'Les erreurs à éviter',
      },
      {
        type: 'ul',
        items: [
          "Réviser toutes les cartes chaque jour : FSRS planifie pour toi, fais confiance à l'algorithme.",
          "Générer trop de cartes à la fois : 15-25 cartes par cours sont suffisantes. La qualité prime sur la quantité.",
          "Sauter les sessions de flashcards quand tu 'te sens prêt' : la sensation de maîtrise est trompeuse.",
          "Ne réviser qu'avec des flashcards : combine avec des examens blancs pour la pratique de récupération sur des questions longues.",
          "Importer tout le manuel d'un coup : découpe par chapitre pour des cartes ciblées.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien de temps par jour faut-il réviser avec Studra ?',
        a: "15 à 30 minutes par jour de révision FSRS sont plus efficaces qu'une session de 3 heures le week-end. La régularité est la clé de la répétition espacée.",
      },
      {
        q: "L'IA peut-elle remplacer la compréhension ?",
        a: "Non. Studra génère des supports de révision, pas de la compréhension. Pour les matières conceptuelles complexes (maths, physique), il faut d'abord comprendre avant de mémoriser. Le mode Socrate de Studra aide justement à tester et approfondir la compréhension.",
      },
      {
        q: 'Quelle est la différence entre le rappel libre et les flashcards ?',
        a: "Le rappel libre consiste à se souvenir de tout ce qu'on sait sur un sujet sans aide (papier blanc, puis vérification). Les flashcards testent des éléments précis avec une question. Les deux sont complémentaires : le rappel libre révèle les lacunes structurelles, les flashcards ancrent les détails.",
      },
      {
        q: 'Studra fonctionne-t-il pour les révisions de dernière minute ?',
        a: "Pour les révisions de dernière minute (J-3 ou moins), génère une fiche de révision et un examen blanc depuis les chapitres les plus importants. La répétition espacée est moins utile sur un si court terme, mais la pratique de récupération via l'examen blanc reste très efficace.",
      },
    ],
  },
  {
    slug: 'methode-repetition-espacee-guide',
    title: 'Guide complet de la répétition espacée pour étudiants',
    description:
      "La répétition espacée est la technique de mémorisation la plus efficace validée par la science. Ce guide explique le principe, la courbe de l'oubli, les algorithmes et comment commencer.",
    publishedAt: '2026-04-20',
    readingTime: '9 min',
    category: 'Science de la mémoire',
    content: [
      {
        type: 'p',
        text: "La répétition espacée est la technique de mémorisation la plus efficace validée par la science cognitive. Utilisée par les champions de mémoire, les étudiants en médecine et les polyglotes du monde entier, elle permet de mémoriser durablement des milliers d'informations avec un minimum de temps investi. Ce guide complet t'explique tout ce que tu dois savoir pour commencer.",
      },
      {
        type: 'h2',
        text: "Qu'est-ce que la répétition espacée ?",
      },
      {
        type: 'p',
        text: "La répétition espacée (spaced repetition en anglais) consiste à revoir une information à intervalles croissants, calculés pour coïncider avec le moment où tu vas l'oublier. Première révision après 1 jour, puis après 3 jours, puis après 7 jours, puis après 21 jours, etc. Chaque révision réussie renforce la trace mémorielle et allonge l'intervalle suivant.",
      },
      {
        type: 'p',
        text: "C'est l'opposé exact du bachotage : au lieu de tout réviser la veille de l'examen (et oublier 80 % en une semaine), tu répartis les révisions dans le temps pour construire une mémoire durable. La même quantité de temps de révision produit des résultats radicalement différents selon si elle est concentrée ou espacée.",
      },
      {
        type: 'h2',
        text: "La courbe de l'oubli d'Ebbinghaus",
      },
      {
        type: 'p',
        text: "Hermann Ebbinghaus a établi en 1885 le premier modèle mathématique de l'oubli. Sa courbe montre qu'on oublie environ 50 % d'une information nouvelle en une heure, 70 % en un jour, et 90 % en une semaine — sans révision.",
      },
      {
        type: 'p',
        text: "La révision au bon moment interrompt cette courbe d'oubli. Après la première révision, la nouvelle courbe d'oubli est plus lente. Après la deuxième, encore plus lente. Après cinq ou six révisions espacées, l'information est en mémoire à long terme — accessible des mois, voire des années plus tard sans révision supplémentaire.",
      },
      {
        type: 'h2',
        text: 'Comment fonctionne la répétition espacée en pratique',
      },
      {
        type: 'p',
        text: "En pratique, la répétition espacée s'implémente avec des flashcards. Chaque carte représente un élément à mémoriser (un mot de vocabulaire, une définition, une formule). Un algorithme calcule quand présenter chaque carte selon l'historique de tes révisions.",
      },
      {
        type: 'p',
        text: "Les deux systèmes de flashcards physiques traditionnels (boîte de Leitner) permettaient de simuler la répétition espacée manuellement. Les logiciels modernes (Anki, Studra) automatisent entièrement ce processus grâce à des algorithmes précis.",
      },
      {
        type: 'h2',
        text: "Les algorithmes : SM-2 et FSRS",
      },
      {
        type: 'p',
        text: "L'algorithme SM-2, développé en 1987 par Piotr Woźniak, est l'algorithme historique d'Anki. Il calcule les intervalles à partir d'un facteur de facilité qui évolue avec tes performances. SM-2 est efficace mais imparfait : il tend à sous-planifier les cartes difficiles (phénomène dit d'ease hell).",
      },
      {
        type: 'p',
        text: "FSRS (Free Spaced Repetition Scheduler), développé en 2022, modélise explicitement deux paramètres pour chaque carte : la stabilité (durée estimée avant oubli) et la difficulté intrinsèque. Optimisé sur des millions de révisions réelles, FSRS prédit l'oubli avec une précision supérieure à SM-2. Studra utilise FSRS 5, la version la plus récente.",
      },
      {
        type: 'h2',
        text: "Pour quelles matières la répétition espacée est-elle utile ?",
      },
      {
        type: 'p',
        text: "La répétition espacée est particulièrement puissante pour les matières à fort volume factuel : médecine (mécanismes, traitements, diagnostics), droit (définitions, jurisprudence, articles), langues (vocabulaire, grammaire), histoire (dates, acteurs, événements), économie (concepts, formules, modèles).",
      },
      {
        type: 'p',
        text: "Elle est moins adaptée aux matières purement procédurales (maths avancées, physique) où la compréhension et la pratique des résolutions de problèmes prime sur la mémorisation. Cependant, même en maths, la mémorisation des définitions, théorèmes et formules via FSRS accélère la résolution de problèmes.",
      },
      {
        type: 'h2',
        text: 'Comment commencer avec la répétition espacée',
      },
      {
        type: 'ol',
        items: [
          "Choisis un outil : Anki (gratuit, puissant, application mobile) ou Studra (génération automatique depuis tes cours, FSRS 5 intégré).",
          "Commence par un seul cours ou chapitre. Ne cherche pas à tout importer d'un coup.",
          "Crée ou génère 15-20 flashcards sur le contenu prioritaire.",
          "Révise toutes les nouvelles cartes une première fois (session d'initiation).",
          "Fais ta session FSRS chaque jour, même courte (10-15 minutes). La régularité est essentielle.",
          "Au fil des semaines, ajoute de nouveaux cours. Le volume de révisions quotidiennes augmente progressivement.",
          "Adapte les paramètres (taux de rétention cible) selon la criticité de l'examen.",
        ],
      },
      {
        type: 'h2',
        text: "Répétition espacée et génération IA : la combinaison idéale",
      },
      {
        type: 'p',
        text: "La répétition espacée résout le problème de quand réviser. L'IA résout le problème de quoi réviser et comment le formuler. Studra combine les deux : tu importes ton cours, l'IA génère des flashcards de qualité, et FSRS planifie automatiquement tes révisions. Tu n'as plus qu'à réviser.",
      },
      {
        type: 'p',
        text: "Cette combinaison est particulièrement transformatrice pour les étudiants en médecine et en droit, qui doivent maîtriser des milliers de faits sur des dizaines de matières en parallèle. Studra réduit le temps de création des supports de révision de 90 % — le temps libéré est consacré à la révision active réelle.",
      },
    ],
    faq: [
      {
        q: "Combien de temps faut-il pour voir les effets de la répétition espacée ?",
        a: "Les premiers effets sont visibles en 2 à 3 semaines de pratique régulière. La mémorisation durable (plusieurs mois) se construit sur 6 à 8 semaines de révisions espacées sur un même corpus de cartes.",
      },
      {
        q: "La répétition espacée remplace-t-elle la relecture du cours ?",
        a: "La répétition espacée via flashcards suppose que tu as d'abord compris le cours. Pour les sujets nouveaux et complexes, une première lecture attentive reste nécessaire. Studra génère aussi une fiche de révision structurée pour faciliter cette première compréhension.",
      },
      {
        q: "Que faire si on manque plusieurs jours de révisions ?",
        a: "Reprends simplement là où tu t'es arrêté. FSRS s'adapte automatiquement aux révisions manquées en recalculant les intervalles. Il vaut mieux reprendre une session accumulée que de ne pas réviser du tout.",
      },
      {
        q: "La répétition espacée est-elle efficace pour les examens à long terme (concours) ?",
        a: "C'est précisément pour ça qu'elle est conçue. Pour un concours dans 6 mois, la répétition espacée permet de maintenir des centaines de concepts en mémoire active avec 20-30 minutes de révision quotidienne — là où le bachotage nécessiterait des semaines de révision intensive la veille.",
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}
