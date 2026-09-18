# Brouillon éditorial — Sous-test Logique

> **Statut :** brouillon interne, non publiable avant relecture et validation humaine.
> **Principe éditorial :** les situations et formulations ci-dessous sont originales ; elles ne reproduisent ni ne reformulent de contenu officiel.

---

## LOG-01 — Ordonnancement élémentaire

- **Niveau :** 1 — accessible
- **Temps cible :** 35 s
- **Compétence :** ordonnancement linéaire

Quatre dossiers, A, B, C et D, sont classés de gauche à droite. A est avant B, B est avant C et D est après C. Quel classement est nécessairement correct ?

A. B – A – C – D
B. A – C – B – D
C. A – B – C – D
D. D – A – B – C
E. A – B – D – C

- **Bonne réponse :** C
- **Explication :** Les trois contraintes donnent directement A avant B avant C avant D. Seule la proposition C respecte cette chaîne complète.
- **Méthode :** transformer les contraintes en chaîne : `A < B < C < D`.
- **Piège :** ne pas ne vérifier qu’une partie de la chaîne (par exemple A avant B) en oubliant que D doit être après C.
- **Justification des distracteurs :** A inverse A et B ; B inverse B et C ; D place D avant C ; E place D avant C.

---

## LOG-02 — Attribution avec voisinage imposé

- **Niveau :** 2 — intermédiaire
- **Temps cible :** 70 s
- **Compétence :** contraintes de position et voisinage

Quatre intervenants, Lila, Marc, Noé et Omar, prennent la parole une fois chacun, du mardi au vendredi. Noé intervient mardi. Marc intervient après Lila. Omar intervient immédiatement après Marc. Quelle affirmation est nécessairement vraie ?

A. Lila intervient mardi.
B. Marc intervient mercredi.
C. Marc intervient vendredi.
D. Omar intervient jeudi.
E. Omar intervient vendredi.

- **Bonne réponse :** E
- **Explication :** Le bloc consécutif Marc–Omar ne peut pas occuper mardi-mercredi, car Noé est mardi. S’il était mercredi-jeudi, Lila devrait être avant Marc, donc mardi, déjà occupé. Le bloc est donc jeudi-vendredi ; Omar intervient nécessairement vendredi. Lila et Marc sont alors mercredi et jeudi.
- **Méthode :** traiter Marc–Omar comme un bloc, éliminer ses positions impossibles, puis contrôler la place nécessaire pour Lila.
- **Piège :** placer le bloc mercredi-jeudi sans vérifier qu’il ne reste alors aucun créneau antérieur pour Lila.
- **Justification des distracteurs :** A est faux car Noé intervient mardi ; B est faux car Marc est jeudi ; C est faux car Marc est jeudi, non vendredi ; D est faux car Omar est vendredi.

---

## LOG-03 — Séquence compatible

- **Niveau :** 2 — intermédiaire
- **Temps cible :** 75 s
- **Compétence :** contrôle simultané de contraintes d’ordre

Cinq notes, A, B, C, D et E, sont affichées dans un ordre de 1 à 5. A est avant C. B est immédiatement avant D. E est après C. C n’est pas en cinquième position. Quel ordre **pourrait** être l’ordre d’affichage ?

A. B – D – C – A – E
B. A – C – E – B – D
C. A – B – D – E – C
D. E – A – C – B – D
E. B – A – D – C – E

- **Bonne réponse :** B
- **Explication :** B respecte A avant C, le bloc consécutif B–D, E après C et C en position 2. Les autres propositions violent au moins une règle.
- **Méthode :** isoler le bloc rigide `B–D`, puis contrôler les relations A/C/E.
- **Piège :** confondre « B immédiatement avant D » avec « B simplement avant D ».
- **Justification des distracteurs :** A met C avant A ; C place E avant C et C en 5 ; D place E avant C ; E sépare B et D.

---

## LOG-04 — Jour imposé par une chaîne

- **Niveau :** 1 — accessible
- **Temps cible :** 45 s
- **Compétence :** déduction par places restantes

Quatre projets R, S, T et U sont prévus, un par jour, du jour 1 au jour 4. T est prévu le jour 2. R est avant S, et S est avant U. Quel projet est nécessairement prévu le jour 1 ?

A. R
B. S
C. T
D. U
E. Cela ne peut pas être déterminé.

- **Bonne réponse :** A
- **Explication :** Il faut placer la chaîne R–S–U dans trois jours distincts. Comme le jour 2 est déjà pris par T, la seule possibilité est R au jour 1, S au jour 3 et U au jour 4.
- **Méthode :** réserver la position fixe, puis faire entrer la chaîne de trois éléments dans les trois emplacements disponibles.
- **Piège :** croire que R pourrait être au jour 3 sans vérifier qu’il faudrait encore placer S puis U après lui.
- **Justification des distracteurs :** B et D ne peuvent pas précéder toute la chaîne ; C est fixé au jour 2 ; E est faux car la position de R découle des contraintes.

---

## LOG-05 — Comité sous conditionnelles croisées

- **Niveau :** 2 — intermédiaire
- **Temps cible :** 75 s
- **Compétence :** implications et équivalences

Un comité de trois personnes est formé parmi A, B, C, D et E. A est sélectionné si et seulement si B est sélectionné. C est sélectionné si et seulement si D est sélectionné. E ne peut pas être sélectionné avec B. Quelle composition est possible ?

A. A, B et E
B. A, B et C
C. B, C et D
D. C, D et E
E. A, D et E

- **Bonne réponse :** D
- **Explication :** C et D doivent être ensemble ; avec E, on obtient exactement trois personnes sans B. Les autres choix brisent une équivalence ou associent E à B.
- **Méthode :** regrouper les paires indissociables `A–B` et `C–D` avant de compléter le comité.
- **Piège :** lire « si et seulement si » comme une implication à sens unique.
- **Justification des distracteurs :** A associe E et B ; B contient C sans D ; C contient B sans A ; E contient A sans B et D sans C.

---

## LOG-06 — Couleurs et conditionnelle

- **Niveau :** 2 — intermédiaire
- **Temps cible :** 95 s
- **Compétence :** raisonnement par cas et contraposée

Cinq jetons J, K, L, M et N sont rouges ou bleus ; exactement deux sont rouges. J est rouge si et seulement si K est bleu. Si L est rouge, alors M est bleu. N a la même couleur que J. Si L est rouge, quel jeton doit être rouge ?

A. J
B. K
C. M
D. N
E. Aucun : plusieurs réponses restent possibles.

- **Bonne réponse :** B
- **Explication :** Si L est rouge, J ne peut pas être rouge, car J et N seraient alors tous deux rouges en plus de L. J est donc bleu ; l’équivalence impose K rouge. M est bleu par la condition sur L.
- **Méthode :** commencer par le quota « exactement deux rouges », puis propager les équivalences.
- **Piège :** oublier que N prend automatiquement la couleur de J, ce qui fait compter deux jetons à la fois.
- **Justification des distracteurs :** A et D rendraient J et N rouges en plus de L ; C est explicitement bleu si L est rouge ; E est faux : K est forcé.

---

## LOG-07 — Sélection avec exclusion induite

- **Niveau :** 2 — intermédiaire
- **Temps cible :** 85 s
- **Compétence :** implications en cascade

Parmi **P, Q et R uniquement**, exactement deux propositions sont retenues. **S est examinée séparément et ne compte pas dans ce quota.** Si S est retenue, alors P est retenue. Si Q est retenue, S ne l’est pas. Si R est retenue, S est retenue. Si R est retenue, quelle affirmation est nécessairement vraie ?

A. P est retenue et Q ne l’est pas.
B. Q est retenue et S ne l’est pas.
C. S est retenue, mais P peut ne pas l’être.
D. P, Q et R sont les trois retenues du quota.
E. Seule S est retenue.

- **Bonne réponse :** A
- **Explication :** R entraîne S, puis S entraîne P. Q ne peut pas être retenue, car Q exclurait S déjà imposée. Le quota porte seulement sur P, Q et R : il est donc rempli par P et R, tandis que S est retenue séparément. L’affirmation A est la seule qui réunit ces conséquences.
- **Méthode :** distinguer d’abord le quota `P/Q/R` de S, puis chaîner `R → S → P` et appliquer l’exclusion de Q.
- **Piège :** faire compter S dans le quota de deux, ou s’arrêter à `R → S` sans propager vers P.
- **Justification des distracteurs :** B contredit R → S et S → P ; C nie S → P ; D dépasse le quota de deux parmi P, Q et R et contredit Q → non-S ; E omet P et R, qui sont retenues.

---

## LOG-08 — Comptage de configurations

- **Niveau :** 3 — discriminant
- **Temps cible :** 120 s
- **Compétence :** dénombrement sous contraintes croisées

Cinq présentations A, B, C, D et E occupent les créneaux 1 à 5, une par créneau. C a lieu exactement deux créneaux après A. B a lieu avant A. D a lieu exactement deux créneaux après E. Combien d’ordres différents sont possibles ?

A. 1
B. 2
C. 3
D. 4
E. 5

- **Bonne réponse :** B
- **Explication :**
  - Si A est au créneau 2, alors B est au 1 et C au 4 ; il reste E au 3 et D au 5 : 1 ordre.
  - Si A est au créneau 3, C est au 5. B doit être au 1, afin de laisser E au 2 et D au 4 : 1 ordre.
  - A ne peut pas être au créneau 1 puisque B doit le précéder ; A ne peut pas être au créneau 4 ou 5 puisque C doit être deux créneaux après.

  Il y a donc **2** ordres possibles.
- **Méthode :** borner d’abord les positions possibles de A, puis compléter systématiquement les paires distantes de deux créneaux.
- **Piège :** compter un arrangement où D tombe sur un créneau déjà occupé.
- **Justification des distracteurs :** A sous-compte l’un des deux cas valides ; C, D et E ajoutent au moins une configuration impossible.

---

## LOG-09 — Contraposée et quotas croisés

- **Niveau :** 3 — discriminant
- **Temps cible :** 120 s
- **Compétence :** contraposée, conditionnelles et quota

Six billets A, B, C, D, E et F sont répartis entre le matin et l’après-midi, avec exactement trois billets dans chaque créneau. A et B sont dans le même créneau. C et D sont dans des créneaux opposés. E est le matin. Si F est l’après-midi, alors A est le matin. Si C est le matin, alors F est l’après-midi. Si A est l’après-midi, quelle est nécessairement la répartition du matin ?

A. C, D et E
B. D, E et F
C. B, D et E
D. B, E et F
E. C, E et F

- **Bonne réponse :** B
- **Explication :** Si A est l’après-midi, B l’est aussi. Par contraposée de « F l’après-midi → A le matin », F est donc le matin. C ne peut pas être le matin, sinon la règle « C le matin → F l’après-midi » contredirait F le matin ; C est donc l’après-midi et D le matin. Avec E déjà le matin, le quota de trois impose le matin D–E–F.
- **Méthode :** appliquer d’abord la contraposée pour fixer F, utiliser ensuite la seconde conditionnelle pour fixer C et D, puis compléter par le quota.
- **Piège :** utiliser la réciproque non donnée « A le matin → F l’après-midi » au lieu de la contraposée valide lorsque A est l’après-midi.
- **Justification des distracteurs :** A et E placent C le matin, ce qui imposerait F l’après-midi ; C et D placent B le matin alors que B est dans le même créneau que A, fixé l’après-midi.

---

## LOG-10 — Équipes et doubles bascules

- **Niveau :** 3 — discriminant
- **Temps cible :** 150 s
- **Compétence :** raisonnement par partition, quotas et biconditionnelles

Huit participants A, B, C, D, E, F, G et H sont répartis dans deux équipes, Rouge et Bleue, de quatre personnes chacune. A et B sont dans la même équipe. C et D sont dans des équipes différentes. E est dans l’équipe Rouge si et seulement si A est dans l’équipe Bleue. F est dans la même équipe que C. G est dans la même équipe que E. H est dans la même équipe que A. Si D est dans l’équipe Rouge, quelle est la composition de l’équipe Rouge ?

A. A, B, D et H
B. A, B, D et E
C. C, D, F et G
D. C, E, F et G
E. B, D, F et H

- **Bonne réponse :** A
- **Explication :** D Rouge impose C Bleue, donc F Bleue. Supposons A Bleue : B et H seraient aussi Bleus ; avec C et F, l’équipe Bleue compterait déjà cinq personnes. Cette hypothèse est donc impossible. A est nécessairement Rouge, ainsi que B et H. L’équivalence donne E Bleue, puis G Bleue. L’équipe Rouge est donc A–B–D–H.
- **Méthode :** fixer C et F à partir de D, tester la bascule de A en tenant compte des groupes A–B–H et E–G, puis compléter les deux équipes de quatre.
- **Piège :** tester A seul au lieu de déplacer aussi B et H, ou oublier que l’équivalence fixe E dans les deux sens.
- **Justification des distracteurs :** B place E Rouge alors que A Rouge impose E Bleue ; C place C et D ensemble et F avec D ; D exclut D de Rouge ; E place F Rouge alors que F est avec C en Bleu.

---

## Contrôle éditorial avant soumission à validation humaine

- **Volume :** 10 items ; **répartition :** 2 accessibles (niveau 1), 5 intermédiaires (niveau 2), 3 discriminants (niveau 3).
- **Format :** chaque item comporte cinq choix, une réponse annoncée, une explication, une méthode, un piège et l’analyse des distracteurs.
- **Statut de validation :** chaque item reste soumis à une relecture humaine de fond, de forme et d’adéquation au référentiel avant toute publication.
