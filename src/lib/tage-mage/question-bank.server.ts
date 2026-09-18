import 'server-only'

import type {
  TageMageDiagnosticQuestion,
  TageMagePublicDiagnosticQuestion,
  TageMageSection,
} from './types'

type Options = TageMageDiagnosticQuestion['options']

const question = (
  id: string,
  section: TageMageSection,
  prompt: string,
  options: Options,
  correctIndex: number,
  explanation: string,
  method: string,
  difficulty: 1 | 2 | 3,
  estimatedSeconds: number,
): TageMageDiagnosticQuestion => ({
  id,
  section,
  prompt,
  options,
  correctIndex,
  explanation,
  method,
  difficulty,
  estimatedSeconds,
  contentVersion: 1,
})

/** Banque originale Studra : à faire relire par un expert avant publication. */
export const tageMageDiagnosticQuestionBank: TageMageDiagnosticQuestion[] = [
  question('tm-comprehension-01', 'comprehension', 'Lisez : « Une ville qui réduit la place de la voiture ne supprime pas nécessairement la mobilité ; elle peut la redistribuer entre marche, vélo et transports collectifs. » Quelle idée est la mieux soutenue ?', ['Réduire la voiture interdit tout déplacement.', 'La mobilité dépend exclusivement des transports collectifs.', 'La diminution de la voiture peut s’accompagner d’autres moyens de déplacement.', 'La marche et le vélo sont toujours plus rapides que la voiture.', 'Toutes les villes doivent interdire la voiture.'], 2, 'Le texte oppose la place de la voiture à la mobilité et précise que celle-ci peut être redistribuée.', 'Repérez la thèse exacte et écartez les réponses absolues ou ajoutant une recommandation.', 1, 45),
  question('tm-comprehension-02', 'comprehension', 'Lisez : « Le télétravail peut réduire certains trajets, mais son bilan énergétique dépend aussi du chauffage des logements et de l’organisation des bureaux. » Quelle conclusion est justifiée ?', ['Le télétravail diminue toujours la consommation d’énergie.', 'Le bilan énergétique du télétravail ne se limite pas aux trajets évités.', 'Les bureaux doivent être fermés.', 'Le chauffage des logements est négligeable.', 'Le télétravail augmente nécessairement les trajets.'], 1, 'Le texte introduit deux autres facteurs énergétiques que les déplacements.', 'Conservez les nuances : “peut” et “dépend aussi” excluent les conclusions catégoriques.', 2, 50),
  question('tm-comprehension-03', 'comprehension', 'Lisez : « Un indicateur chiffré facilite la comparaison, sans pour autant épuiser la réalité qu’il mesure. » Que signifie “sans pour autant” ?', ['L’indicateur rend toute comparaison impossible.', 'La comparaison est plus importante que la réalité.', 'L’indicateur décrit parfaitement la réalité.', 'L’utilité de comparaison n’implique pas une description complète.', 'La réalité ne peut jamais être mesurée.'], 3, 'L’expression marque une concession : l’indicateur est utile, mais limité.', 'Identifiez le lien logique entre les deux propositions plutôt que de surinterpréter le sujet.', 1, 40),
  question('tm-comprehension-04', 'comprehension', 'Lisez : « La bibliothèque a étendu ses horaires le soir. La fréquentation a progressé, surtout chez les étudiants ; toutefois, cette hausse ne permet pas encore d’isoler l’effet propre des nouveaux horaires. » Pourquoi ?', ['Les étudiants n’utilisent pas la bibliothèque le soir.', 'D’autres facteurs ont pu contribuer à la hausse.', 'Les horaires ont certainement causé toute la hausse.', 'La fréquentation a diminué chez les étudiants.', 'La bibliothèque ne collecte aucune donnée.'], 1, 'Le mot “toutefois” signale qu’une corrélation observée ne prouve pas seule une causalité.', 'Distinguez observation et explication causale ; cherchez l’option qui préserve cette prudence.', 3, 55),

  question('tm-calcul-01', 'calcul', 'Un article coûte 80 €. Il bénéficie d’une remise de 15 %. Quel est son prix après remise ?', ['62 €', '65 €', '68 €', '72 €', '74 €'], 2, '15 % de 80 € vaut 12 €, donc le prix est 80 − 12 = 68 €.', 'Calculez la remise puis soustrayez-la au prix initial.', 1, 35),
  question('tm-calcul-02', 'calcul', 'Une équipe réalise 3/5 d’un dossier le lundi puis 1/4 du dossier total le mardi. Quelle fraction du dossier reste à réaliser ?', ['1/10', '3/20', '1/5', '1/4', '7/20'], 1, 'La part réalisée est 3/5 + 1/4 = 12/20 + 5/20 = 17/20. Il reste 3/20.', 'Mettez les fractions au même dénominateur avant de compléter à 1.', 2, 50),
  question('tm-calcul-03', 'calcul', 'Un train parcourt 210 km en 2 h 30 min à vitesse constante. Quelle est sa vitesse moyenne ?', ['72 km/h', '80 km/h', '84 km/h', '90 km/h', '105 km/h'], 2, '2 h 30 min = 2,5 h, donc 210 ÷ 2,5 = 84 km/h.', 'Convertissez d’abord les minutes en fraction d’heure, puis appliquez distance ÷ temps.', 2, 45),
  question('tm-calcul-04', 'calcul', 'Le prix d’un abonnement augmente de 20 %, puis baisse de 20 % sur son nouveau prix. Par rapport au prix initial, il est :', ['identique', 'en baisse de 4 %', 'en baisse de 2 %', 'en hausse de 4 %', 'en hausse de 2 %'], 1, 'En partant de 100, on obtient 120 puis 96 : le prix final est inférieur de 4 %.', 'Testez avec une base de 100 : des pourcentages successifs ne s’annulent pas forcément.', 3, 55),

  question('tm-conditions-minimales-01', 'conditions_minimales', 'x est-il positif ? (1) x² = 9. (2) x + 3 > 0.', ['(1) seule suffit', '(2) seule suffit', '(1) et (2) ensemble suffisent, aucune seule ne suffit', 'Chaque affirmation seule suffit', 'Les deux affirmations ensemble ne suffisent pas'], 2, '(1) donne x = −3 ou 3. (2) donne x > −3. Ensemble, x = 3 seulement.', 'Testez chaque affirmation séparément, puis combinez-les sans résoudre plus que nécessaire.', 2, 55),
  question('tm-conditions-minimales-02', 'conditions_minimales', 'Le nombre entier n est-il pair ? (1) n est divisible par 6. (2) n est divisible par 3.', ['(1) seule suffit', '(2) seule suffit', '(1) et (2) ensemble suffisent, aucune seule ne suffit', 'Chaque affirmation seule suffit', 'Les deux affirmations ensemble ne suffisent pas'], 0, 'Tout multiple de 6 est pair, donc (1) répond oui. Un multiple de 3 peut être impair.', 'Cherchez si une condition force une réponse unique, pas si elle apporte beaucoup d’informations.', 1, 40),
  question('tm-conditions-minimales-03', 'conditions_minimales', 'Le rectangle a-t-il une aire supérieure à 30 cm² ? (1) Sa longueur est 8 cm. (2) Sa largeur est 4 cm.', ['(1) seule suffit', '(2) seule suffit', '(1) et (2) ensemble suffisent, aucune seule ne suffit', 'Chaque affirmation seule suffit', 'Les deux affirmations ensemble ne suffisent pas'], 2, 'Chaque dimension isolée laisse l’autre inconnue. Ensemble, l’aire vaut 8 × 4 = 32 cm².', 'Une aire exige les deux dimensions : vérifiez ensuite directement le seuil demandé.', 1, 40),
  question('tm-conditions-minimales-04', 'conditions_minimales', 'La moyenne de a et b est-elle égale à 10 ? (1) a + b = 20. (2) a = b.', ['(1) seule suffit', '(2) seule suffit', '(1) et (2) ensemble suffisent, aucune seule ne suffit', 'Chaque affirmation seule suffit', 'Les deux affirmations ensemble ne suffisent pas'], 0, 'La moyenne vaut (a + b) / 2 ; avec (1), elle vaut 20 / 2 = 10. (2) seul ne fixe aucune valeur.', 'Traduisez la question en formule, puis voyez quelle donnée détermine cette formule.', 2, 45),

  question('tm-expression-01', 'expression', 'Choisissez la phrase correctement rédigée.', ['Les résultats qu’elle a obtenu sont encourageants.', 'Les résultats qu’elle a obtenus sont encourageants.', 'Les résultats qu’elle à obtenus sont encourageants.', 'Les résultat qu’elle a obtenus sont encourageant.', 'Les résultats qu’elle a obtenue sont encourageants.'], 1, 'Le participe passé “obtenus” s’accorde avec le COD “résultats”, placé avant le verbe.', 'Repérez le COD placé avant l’auxiliaire avoir, puis contrôlez pluriel et accents.', 1, 40),
  question('tm-expression-02', 'expression', 'Quelle phrase exprime la relation logique la plus cohérente ?', ['Le délai était court, pourtant nous avons remis le dossier à temps.', 'Le délai était court, donc nous avons remis le dossier à temps.', 'Le délai était court, car nous avons remis le dossier à temps.', 'Le délai était court, afin que nous avons remis le dossier à temps.', 'Le délai était court, néanmoins parce que nous avons remis le dossier à temps.'], 0, '“Pourtant” introduit correctement le contraste entre un délai court et une remise à temps.', 'Identifiez d’abord le rapport : ici, le fait final contraste avec la difficulté annoncée.', 2, 45),
  question('tm-expression-03', 'expression', 'Choisissez la formulation la plus précise et la moins redondante.', ['Cette décision est une décision qui a été prise collectivement.', 'La décision collective a été prise par tous les membres collectivement.', 'Tous les membres ont pris collectivement la décision ensemble.', 'La décision a été prise collectivement.', 'La décision a été prise d’une manière collective par les membres.'], 3, 'La quatrième proposition conserve l’information utile sans répéter “décision” ni “collectivement”.', 'Supprimez les répétitions sans effacer le sens principal.', 1, 35),
  question('tm-expression-04', 'expression', 'Complétez : « Ni le directeur ni les responsables ne ___ disponibles ce matin. »', ['sera', 'seront', 'était', 'seraient', 'soit'], 1, 'Avec “ni… ni…” et un second sujet pluriel, le verbe se met ici au pluriel : “seront”.', 'Repérez le noyau des sujets coordonnés et accordez le verbe au nombre approprié.', 2, 45),

  question('tm-raisonnement-argumentation-01', 'raisonnement_argumentation', 'Argument : « Depuis que le campus a installé davantage d’arceaux, le nombre de vélos stationnés a augmenté. Les arceaux expliquent donc cette hausse. » Quelle information affaiblit le plus cette conclusion ?', ['Les arceaux sont bleus.', 'Le campus a ouvert simultanément une nouvelle piste cyclable très fréquentée.', 'Certains étudiants préfèrent marcher.', 'Les arceaux sont situés près de la bibliothèque.', 'Le nombre de places de voiture est resté stable.'], 1, 'La nouvelle piste constitue une cause alternative de l’augmentation observée.', 'Pour affaiblir une causalité, cherchez un facteur concurrent apparu au même moment.', 2, 55),
  question('tm-raisonnement-argumentation-02', 'raisonnement_argumentation', '« Tous les stagiaires qui ont suivi la formation ont réussi le test final. Léa a réussi le test final. Donc Léa a suivi la formation. » Quel est le défaut ?', ['La conclusion est nécessairement vraie.', 'Le raisonnement confond une condition suffisante avec une condition nécessaire.', 'La formation empêche de réussir.', 'Le test final n’a aucune utilité.', 'Léa ne peut pas être stagiaire.'], 1, 'Réussir peut avoir d’autres causes ; “formation” implique “réussite”, non l’inverse.', 'Schématisez A → B : observer B ne permet pas de conclure A.', 2, 50),
  question('tm-raisonnement-argumentation-03', 'raisonnement_argumentation', 'Quelle donnée renforcerait le mieux l’affirmation « le nouveau tutorat améliore la réussite » ?', ['Les tuteurs apprécient leur salle.', 'Après contrôle du niveau initial, les étudiants tutorés réussissent plus souvent que des étudiants comparables non tutorés.', 'Le tutorat coûte moins cher que prévu.', 'Les étudiants tutorés se connectent plus souvent à la plateforme.', 'Le programme porte un nouveau nom.'], 1, 'La comparaison avec un groupe similaire, après contrôle du niveau initial, soutient directement un effet du tutorat.', 'Privilégiez une preuve qui compare le résultat pertinent en limitant les facteurs de confusion.', 3, 60),
  question('tm-raisonnement-argumentation-04', 'raisonnement_argumentation', '« Cette application est fiable car elle a reçu cinq étoiles d’un utilisateur. » Quelle objection est la plus pertinente ?', ['Les étoiles sont jaunes.', 'Un seul avis ne suffit pas à établir la fiabilité générale de l’application.', 'Les applications ne reçoivent jamais d’avis.', 'La fiabilité dépend uniquement du prix.', 'L’utilisateur a forcément tort.'], 1, 'Un témoignage isolé est un échantillon trop faible pour une conclusion générale.', 'Évaluez si la quantité et la représentativité des preuves correspondent à l’ampleur de la conclusion.', 1, 40),

  question('tm-logique-01', 'logique', 'Trois dossiers A, B et C sont rangés de gauche à droite. A est à gauche de B et C est à droite de B. Quel est l’ordre ?', ['A, B, C', 'A, C, B', 'B, A, C', 'B, C, A', 'C, A, B'], 0, 'Les deux contraintes imposent directement A avant B avant C.', 'Placez d’abord l’élément central B, puis positionnez les deux autres par rapport à lui.', 1, 35),
  question('tm-logique-02', 'logique', 'Dans un code de trois lettres, la lettre M est avant P et la lettre R est après P. Quelle proposition est forcément vraie ?', ['R est avant M.', 'M est la dernière lettre.', 'P est avant R.', 'R est au milieu.', 'M et R sont adjacentes.'], 2, 'La relation donnée M avant P avant R implique nécessairement P avant R.', 'Chaînez les contraintes d’ordre et ne concluez que ce qui vaut dans tous les cas.', 1, 40),
  question('tm-logique-03', 'logique', 'Quatre personnes, Ana, Bilal, Chloé et David, présentent chacune une fois. Ana passe avant Bilal. Chloé passe après David. Quelle séquence est possible ?', ['Bilal, Ana, David, Chloé', 'David, Chloé, Bilal, Ana', 'Ana, Bilal, Chloé, David', 'David, Ana, Chloé, Bilal', 'Chloé, David, Ana, Bilal'], 3, 'La séquence D, A, C, B respecte Ana avant Bilal et David avant Chloé.', 'Vérifiez chaque contrainte dans chaque proposition ; éliminez dès la première violation.', 2, 50),
  question('tm-logique-04', 'logique', 'Un atelier a lieu mardi, mercredi ou jeudi. Il ne peut pas avoir lieu mardi si la salle B est réservée. La salle B est réservée mardi. Quel jour est impossible pour l’atelier ?', ['Mardi', 'Mercredi', 'Jeudi', 'Mercredi ou jeudi', 'Aucun jour'], 0, 'Si B est réservée mardi, la condition exclut l’atelier ce jour-là.', 'Appliquez une implication à son cas déclenché : B réservée mardi entraîne “pas mardi”.', 2, 40),
]

export function getPublicTageMageDiagnosticQuestions(): TageMagePublicDiagnosticQuestion[] {
  return tageMageDiagnosticQuestionBank.map((question) => ({
    id: question.id,
    section: question.section,
    prompt: question.prompt,
    options: question.options,
    difficulty: question.difficulty,
    estimatedSeconds: question.estimatedSeconds,
    contentVersion: question.contentVersion,
  }))
}

export function createTageMageQuestionSnapshot(): TageMageDiagnosticQuestion[] {
  return tageMageDiagnosticQuestionBank.map((question) => ({
    ...question,
    options: [...question.options],
  }))
}
