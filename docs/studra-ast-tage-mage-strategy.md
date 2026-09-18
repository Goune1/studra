# Studra AST : stratégie TAGE MAGE et TOEIC

> Document de cadrage produit et commercial pour évaluer l'intégration d'outils spécialisés dans la préparation aux admissions sur titre des grandes écoles de commerce.

## Résumé exécutif

L'opportunité est intéressante, mais elle ne doit pas être traitée immédiatement comme un pivot complet de Studra.

La recommandation est de lancer **Studra TAGE MAGE** comme une verticale spécialisée et un canal d'acquisition, puis d'étendre le produit vers un copilote complet des admissions AST si la demande est validée.

La promesse centrale ne doit pas être « une banque de QCM supplémentaire », mais :

> Identifie précisément les points que tu perds, entraîne-toi sur tes faiblesses et suis un plan quotidien jusqu'au jour du test.

Le bon ordre de lancement serait :

1. TAGE MAGE ;
2. dossiers AST et préparation aux oraux ;
3. TOEIC ;
4. éventuellement TAGE 2, Score IAE Message et autres concours.

## Pourquoi cette verticale est pertinente

Studra est aujourd'hui un outil de révision généraliste. Cette proposition peut être difficile à vendre car le problème et le résultat attendu restent larges.

Pour un candidat au TAGE MAGE, la proposition devient beaucoup plus concrète :

> Passe de ton niveau actuel à ton score cible avant ta date d'examen.

Le TAGE MAGE possède plusieurs caractéristiques favorables à un produit logiciel :

- le format est structuré en 90 QCM, 6 sous-tests et 2 heures ;
- le résultat est mesurable sur 600 points ;
- le candidat possède une échéance claire ;
- l'inscription représente déjà une dépense réelle ;
- le meilleur score peut être conservé en cas de plusieurs passages autorisés ;
- le test est utilisé par de nombreux établissements et formations ;
- les candidats paient déjà pour des examens blancs, des plateformes ou des préparations complètes.

La cible est plus étroite que celle des étudiants en général, mais son intention d'achat est nettement plus forte.

## Limites et risques

### 1. Un marché déjà concurrentiel

Plusieurs acteurs sont installés :

- AST+ propose gratuitement des cours, exercices et examens blancs ;
- PrepMyFuture commercialise une préparation officielle FNEGE ;
- ASTPrep met en avant une importante banque d'exercices, des examens blancs, des cours en direct et du suivi ;
- Admissions Parallèles vend des préparations AST plus complètes comprenant notamment TAGE MAGE, TOEIC, dossier et oraux.

Ajouter simplement des QCM dans Studra ne sera donc pas différenciant.

La différence doit être le diagnostic, la personnalisation et l'efficacité du parcours :

> Le chemin le plus court entre le niveau actuel du candidat et son objectif.

### 2. Le contenu est plus difficile à produire que la technologie

Le moteur logiciel peut être construit relativement rapidement. En revanche, produire plusieurs centaines de questions fiables exige :

- des énoncés originaux ;
- des distracteurs crédibles ;
- une difficulté cohérente ;
- des corrections pédagogiques ;
- une validation humaine ;
- un suivi des versions et des erreurs.

Une banque de questions générée automatiquement par IA sans validation humaine est déconseillée. Une seule correction manifestement fausse peut détériorer fortement la confiance dans le produit.

Répartition recommandée :

- **questions et corrigés** : écrits ou validés par des humains compétents ;
- **explications personnalisées** : générées éventuellement par IA à partir d'un corrigé validé ;
- **diagnostic et planification** : automatisés ;
- **estimation du score** : proposée uniquement après calibration sur suffisamment de résultats réels.

### 3. Propriété intellectuelle et utilisation de la marque

TAGE MAGE® est une marque déposée par la FNEGE. Les cahiers d'épreuves et leur contenu sont également protégés.

Studra ne doit donc pas :

- recopier ou reformuler de vraies questions obtenues sans autorisation ;
- récupérer des annales ou sujets protégés pour entraîner un modèle ;
- laisser entendre que la préparation est officielle ;
- utiliser la marque comme si elle appartenait à Studra.

Les exercices doivent être originaux et porter sur les mêmes compétences sans reproduire les sujets officiels.

Un avertissement de ce type devra être validé juridiquement avant commercialisation :

> Préparation indépendante au test TAGE MAGE®. Studra n'est ni affilié ni approuvé par la FNEGE.

## Pourquoi commencer par le TAGE MAGE

Il est déconseillé de lancer simultanément le TAGE MAGE et le TOEIC.

Le TOEIC Listening & Reading ajoute immédiatement :

- 200 questions par examen complet ;
- une importante production audio ;
- plusieurs accents et locuteurs ;
- des documents visuels ;
- une concurrence internationale ;
- un coût éditorial et technique supérieur.

Le TAGE MAGE est plus petit, plus localisé sur le marché français, cohérent avec le positionnement AST et plus simple à mettre en production.

Le TOEIC pourra devenir un deuxième module lorsque le moteur d'examens et l'acquisition AST auront été validés.

## Proposition de MVP

### 1. Diagnostic initial gratuit

Le premier contact ne doit pas être un examen blanc complet de deux heures.

Format conseillé :

- 24 à 30 questions ;
- quelques questions par sous-test ;
- chronométrage par question ;
- difficulté progressive ;
- rapport immédiatement exploitable.

Exemple de restitution :

```text
Objectif : 420
Niveau actuel : zone estimée 310-350

Forces :
- Compréhension
- Raisonnement

Faiblesses :
- Calcul
- Conditions minimales
- Gestion du temps

Priorités :
1. Calcul mental
2. Problèmes de vitesse
3. Questions à élimination
```

Tant que le modèle n'est pas correctement calibré, Studra doit afficher une zone ou un niveau de maîtrise plutôt qu'un faux score précis.

### 2. Onboarding orienté objectif

Informations à recueillir :

- date de l'examen ;
- score visé ;
- score déjà obtenu, le cas échéant ;
- temps disponible par semaine ;
- écoles ciblées ;
- sous-tests considérés comme difficiles.

### 3. Plan jusqu'au jour J

Exemple de progression :

```text
J-42 à J-28 : méthodes fondamentales
J-27 à J-14 : entraînement ciblé
J-13 à J-7  : vitesse et stratégie
J-6 à J-1   : examens blancs et correction
```

Chaque session quotidienne pourrait comprendre :

- 10 questions ciblées ;
- une leçon de méthode ;
- une révision des erreurs passées ;
- une indication du temps nécessaire ;
- une recommandation pour la prochaine session.

### 4. Mode entraînement

Filtres nécessaires :

- sous-test ;
- notion ;
- difficulté ;
- temps disponible ;
- questions jamais vues ;
- erreurs précédentes.

Après chaque réponse :

- bonne réponse ;
- solution courte ;
- solution détaillée ;
- méthode la plus rapide ;
- piège principal ;
- temps utilisateur comparé au temps cible ;
- bouton « Je n'ai pas compris » ;
- bouton « Refaire plus tard ».

### 5. Carnet d'erreurs automatique

Cette fonctionnalité peut devenir la principale différence de Studra.

Chaque erreur devrait être classée :

- connaissance manquante ;
- méthode incorrecte ;
- mauvaise lecture ;
- erreur de calcul ;
- hésitation entre deux réponses ;
- manque de temps ;
- réponse au hasard.

Studra pourra alors produire des diagnostics réellement utiles, par exemple :

> Tu ne perds pas principalement des points en calcul. Tu les perds sur les énoncés contenant plusieurs conditions et lorsque tu dépasses 90 secondes.

### 6. Examens blancs

Fonctionnalités :

- format complet de 90 questions ;
- six séquences chronométrées ;
- option empêchant de revenir en arrière ;
- interface sobre et proche des conditions réelles ;
- rapport par sous-test ;
- comparaison entre précision et vitesse ;
- génération automatique d'une liste d'exercices à refaire.

Contenu raisonnable pour une première version :

- 1 diagnostic court ;
- 250 à 400 questions validées ;
- 2 examens blancs complets ;
- les principales fiches de méthode ;
- environ 20 catégories de compétences ou d'erreurs.

L'objectif initial n'est pas de concurrencer les acteurs établis sur le volume, mais sur la qualité du diagnostic et de la personnalisation.

## Architecture produit suggérée

Le moteur devrait rester générique afin d'accueillir ensuite le TOEIC ou d'autres examens.

```text
exam_catalog
- id
- slug
- name
- provider
- disclaimer
- scoring_mode

exam_sections
- id
- exam_id
- name
- order
- time_limit
- question_count

question_bank
- id
- section_id
- statement
- choices
- correct_answer
- explanation
- shortcut_method
- difficulty
- review_status
- author_id
- version

question_skills
- question_id
- skill
- error_category

practice_sessions
- id
- user_id
- exam_id
- mode
- started_at
- completed_at

practice_answers
- session_id
- question_id
- answer
- correct
- response_time
- confidence
- error_type

exam_goals
- user_id
- exam_id
- target_score
- exam_date
- weekly_minutes
```

Cycle éditorial recommandé :

```text
draft -> reviewed -> approved -> published -> retired
```

L'IA ne doit jamais publier directement une question dans la banque active.

## Positionnement et monétisation

### Option A : pass concours

- diagnostic gratuit ;
- quelques exercices gratuits ;
- pass TAGE MAGE entre 39 et 59 € à tester ;
- accès limité à trois ou quatre mois.

Ce modèle correspond au caractère ponctuel et saisonnier du besoin.

### Option B : abonnement Studra avec module spécialisé

- abonnement Studra classique ;
- module TAGE MAGE en supplément ;
- futur bundle AST comprenant TAGE MAGE, TOEIC, dossier et oraux.

Le pass à durée limitée semble être le meilleur point de départ. Le tarif définitif ne doit cependant pas être fixé avant validation.

Une page de vente peut tester plusieurs niveaux :

- version gratuite ;
- offre à 39 € ;
- offre à 69 € avec davantage d'examens blancs et d'analyses.

## Funnel d'acquisition

La porte d'entrée ne doit pas être « Essayez Studra », mais :

> Passe un diagnostic TAGE MAGE gratuit et découvre où tu perds tes points.

Funnel recommandé :

1. page SEO « Test TAGE MAGE gratuit » ;
2. diagnostic accessible sans paiement ;
3. résultat immédiat ;
4. collecte de l'adresse email pour recevoir le plan ;
5. première session gratuite ;
6. paiement pour débloquer le programme complet.

Canaux potentiels :

- TikTok et Instagram Reels avec une question quotidienne ;
- pages SEO par sous-test et par notion ;
- simulateur de score ;
- contenus sur les scores et les écoles, avec données vérifiées ;
- associations étudiantes en université, IAE, BUT et bachelor ;
- ambassadeurs rémunérés à la vente ;
- témoignages avec scores avant et après.

## Validation avant développement lourd

Avant de construire la plateforme complète, réaliser uniquement :

- une landing page ;
- une maquette du dashboard ;
- un diagnostic de 18 à 24 questions ;
- un aperçu du plan personnalisé ;
- une précommande ou une liste d'attente qualifiée.

Envoyer ensuite 200 à 500 visiteurs ciblés depuis les réseaux sociaux, les groupes étudiants et quelques partenariats.

Signaux encourageants :

- plus de 20 % des visiteurs commencent le diagnostic ;
- plus de 50 % de ceux qui le commencent le terminent ;
- plus de 15 % laissent leur adresse email ;
- au moins 5 à 10 personnes acceptent de précommander ;
- les candidats réclament spontanément le carnet d'erreurs ou le plan personnalisé.

Des inscriptions gratuites sans volonté de payer ne valident pas une activité commerciale.

## Roadmap recommandée

### Phase 0 : validation

- landing page ;
- diagnostic court ;
- mesure des conversions ;
- entretiens avec des candidats ;
- test de précommande.

### Phase 1 : MVP TAGE MAGE

- onboarding ;
- plan personnalisé ;
- entraînement ciblé ;
- carnet d'erreurs ;
- premier examen blanc ;
- paiement par pass.

### Phase 2 : amélioration du moteur

- second examen blanc ;
- calibration des difficultés ;
- estimation du niveau ;
- recommandations plus précises ;
- analytics de progression ;
- boucle de contrôle qualité du contenu.

### Phase 3 : Studra AST

- préparation des dossiers ;
- aide au CV et aux lettres ;
- simulations d'entretiens ;
- contenus propres aux écoles ;
- communauté et accompagnement éventuel.

### Phase 4 : TOEIC

- moteur audio ;
- exercices Listening et Reading ;
- examens complets ;
- analyse par partie ;
- bundle TAGE MAGE + TOEIC + admissions.

## Décision recommandée

### À faire

- traiter le TAGE MAGE comme une verticale d'acquisition ;
- construire un moteur d'examens réutilisable ;
- différencier Studra par le diagnostic et le carnet d'erreurs ;
- faire valider humainement chaque question ;
- valider la demande avec un diagnostic et des précommandes ;
- commencer par le TAGE MAGE avant le TOEIC.

### À éviter

- pivoter immédiatement tout Studra vers les concours AST ;
- lancer TAGE MAGE et TOEIC en même temps ;
- essayer de battre les concurrents sur le nombre de questions ;
- générer et publier les questions automatiquement avec l'IA ;
- promettre un score précis avant calibration ;
- utiliser des annales ou questions protégées sans autorisation ;
- présenter Studra comme une préparation officielle.

## Vision à terme

Si la verticale obtient une traction réelle, Studra pourra évoluer d'un outil de révision généraliste vers un produit beaucoup plus identifiable :

> Un copilote d'admission en grande école, de la préparation des tests jusqu'aux entretiens.

Le TAGE MAGE constitue alors le point d'entrée. Le bundle AST complet devient l'extension naturelle.

## Sources

1. [Présentation du TAGE MAGE - FNEGE](https://www.tagemage.fr/page/presentation-generale)
2. [FAQ TAGE MAGE - FNEGE](https://www.tagemage.fr/page/foire-aux-questions)
3. [Conditions générales de vente et propriété intellectuelle - FNEGE](https://www.tagemage.fr/page/conditions-generales-de-vente/)
4. [Préparation TAGE MAGE - PrepMyFuture](https://www.prepmyfuture.com/products/tage-mage)
5. [Admissions Parallèles](https://www.admissionsparalleles.com/)
6. [AST+ - Préparation gratuite aux concours AST](https://www.concours-ast.fr/)
7. [Préparation TAGE MAGE - ASTPrep](https://astprep.com/accompagnement/tage-mage)
8. [TOEIC Listening and Reading - ETS Global](https://www.etsglobal.org/fr/en/test-type-family/toeic-listening-and-reading-test)
