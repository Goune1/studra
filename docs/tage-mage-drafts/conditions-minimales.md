# Conditions minimales — brouillon éditorial

> **Statut : brouillon interne, non publiable sans validation humaine.**
>
> Les situations et valeurs ci-dessous sont originales et conçues exclusivement comme matériel de travail éditorial.

## Réponses standard

Pour chaque item, choisir **une seule** réponse :

- **A — Information 1 seule suffisante** : l'information 1 permet de répondre avec certitude ; l'information 2 ne le permet pas seule.
- **B — Information 2 seule suffisante** : l'information 2 permet de répondre avec certitude ; l'information 1 ne le permet pas seule.
- **C — Informations 1 et 2 nécessaires ensemble** : aucune information ne suffit isolément, mais leur combinaison permet de répondre avec certitude.
- **D — Chaque information suffisante seule** : chacune des deux informations permet, prise isolément, de répondre avec certitude.
- **E — Informations insuffisantes même ensemble** : même combinées, les deux informations ne permettent pas de répondre avec certitude.

---

## CM-01

- **Niveau :** Accessible
- **Temps indicatif :** 45 secondes
- **Énoncé :** L'entier positif `n` est-il divisible par 15 ?
- **Information 1 :** `n` est divisible par 3.
- **Information 2 :** `n` est divisible par 5.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** C — Informations 1 et 2 nécessaires ensemble.
- **Explication :** Être divisible par 3 ne garantit pas la divisibilité par 15, pas plus qu'être divisible par 5. En revanche, comme 3 et 5 sont premiers entre eux, un entier divisible par 3 et par 5 est divisible par 15.
- **Méthode :** Identifier les facteurs premiers de 15, puis vérifier si les informations les couvrent tous.
- **Piège :** Confondre « divisible par 3 ou par 5 » avec « divisible par 15 ».
- **Distracteurs :** A et B attirent si l'on retient un seul facteur ; E attire si l'on oublie que 3 et 5 sont premiers entre eux.

## CM-02

- **Niveau :** Accessible
- **Temps indicatif :** 50 secondes
- **Énoncé :** Le nombre réel `m` est-il strictement positif ?
- **Information 1 :** `m² = 49`.
- **Information 2 :** `m + 7 > 0`.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** C — Informations 1 et 2 nécessaires ensemble.
- **Explication :** L'information 1 donne `m = 7` ou `m = −7`. L'information 2 donne `m > −7`, sans exclure à elle seule une valeur négative. Ensemble, elles écartent `−7` : donc `m = 7`, qui est positif.
- **Méthode :** Énumérer les solutions de l'égalité, puis les filtrer à l'aide de l'inégalité.
- **Piège :** Déduire à tort de `m² = 49` que `m = 7` uniquement.
- **Distracteurs :** A attire si le signe moins est oublié ; B attire si l'inégalité est interprétée comme `m > 0` ; E attire si l'on ne combine pas les deux contraintes.

## CM-03

- **Niveau :** Intermédiaire
- **Temps indicatif :** 70 secondes
- **Énoncé :** Pour deux nombres réels `x` et `y`, peut-on déterminer la valeur du produit `xy` ?
- **Information 1 :** `x + y = 10`.
- **Information 2 :** `x − y = 4`.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** C — Informations 1 et 2 nécessaires ensemble.
- **Explication :** L'information 1 seule autorise de nombreux couples, par exemple `(6 ; 4)` et `(8 ; 2)`, dont les produits diffèrent. L'information 2 seule aussi. Ensemble, les deux équations donnent `x = 7` et `y = 3`, donc `xy = 21`.
- **Méthode :** Additionner les deux équations pour isoler `x`, puis retrouver `y` et calculer le produit.
- **Piège :** Croire que la somme fixe le produit.
- **Distracteurs :** A ou B attirent si l'on confond une relation linéaire avec une détermination complète du couple ; E attire si l'on n'exploite pas le système de deux équations.

## CM-04

- **Niveau :** Intermédiaire
- **Temps indicatif :** 75 secondes
- **Énoncé :** Un triangle a pour longueurs de côtés `a`, `b` et `c`. Peut-on affirmer qu'il est aigu ?
- **Information 1 :** `a = 7` et `b = 10`.
- **Information 2 :** `c = 12`.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** C — Informations 1 et 2 nécessaires ensemble.
- **Explication :** Avec les trois côtés, le plus grand vaut 12. Or `12² = 144 < 7² + 10² = 149` : le triangle est aigu. L'information 1 seule laisse varier `c` et permet des triangles de natures différentes ; l'information 2 seule ne fixe pas les deux autres côtés.
- **Méthode :** Identifier le plus grand côté et comparer son carré à la somme des carrés des deux autres.
- **Piège :** Se contenter de vérifier l'existence du triangle sans tester la nature de ses angles.
- **Distracteurs :** A attire si l'on suppose implicitement une troisième longueur « ordinaire » ; B attire si l'on traite 12 comme une information sur l'angle ; E attire si l'on ne connaît pas le critère métrique des triangles aigus.

## CM-05

- **Niveau :** Intermédiaire
- **Temps indicatif :** 70 secondes
- **Énoncé :** Peut-on déterminer l'âge actuel de Lina ?
- **Information 1 :** Dans quatre ans, Lina aura le double de l'âge qu'elle avait il y a cinq ans.
- **Information 2 :** Lina est aujourd'hui plus âgée que 10 ans.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** A — Information 1 seule suffisante.
- **Explication :** Si `l` est l'âge actuel de Lina, l'information 1 donne `l + 4 = 2(l − 5)`, donc `l = 14`. L'information 2 est compatible avec cette valeur, mais elle ne fournit pas seule un âge unique.
- **Méthode :** Traduire les repères temporels par une équation, puis la résoudre avant d'évaluer l'utilité de l'autre information.
- **Piège :** Ajouter les neuf années d'écart temporel au lieu de construire l'équation avec les deux âges.
- **Distracteurs :** C attire si l'on pense qu'une condition d'âge minimale est indispensable ; B attire si l'on confond « plus de 10 ans » avec un âge précis ; E attire en cas d'erreur algébrique.

## CM-06

- **Niveau :** Intermédiaire
- **Temps indicatif :** 80 secondes
- **Énoncé :** Un rectangle a une longueur strictement supérieure à sa largeur de 5 cm. Son aire est-elle supérieure à 100 cm² ?
- **Information 1 :** Sa largeur est un nombre entier pair.
- **Information 2 :** Son périmètre est de 34 cm.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** B — Information 2 seule suffisante.
- **Explication :** Avec une largeur `l` et une longueur `l + 5`, le périmètre donne `2l + 2(l + 5) = 34`, soit `l = 6` et une longueur de 11. L'aire vaut donc 66 cm² : la réponse est non. Savoir seulement que la largeur est un entier pair ne fixe pas l'aire.
- **Méthode :** Utiliser la différence de 5 cm dans la formule du périmètre, puis calculer l'aire.
- **Piège :** Employer `l(l + 5) = 34`, qui confond aire et périmètre.
- **Distracteurs :** A attire si l'on surinterprète la parité ; C attire si l'on ajoute une information qui ne réduit pas l'incertitude ; E attire si l'on ne traduit pas la relation longueur-largeur.

## CM-07

- **Niveau :** Intermédiaire
- **Temps indicatif :** 65 secondes
- **Énoncé :** Une association répartit exactement 72 badges dans des sachets ayant tous le même nombre de badges. Chaque sachet contient-il plus de 8 badges ?
- **Information 1 :** L'association prépare 6 sachets.
- **Information 2 :** Le nombre de sachets est pair.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** A — Information 1 seule suffisante.
- **Explication :** Avec 6 sachets, chaque sachet contient `72 ÷ 6 = 12` badges, donc plus de 8. Un nombre pair de sachets peut être 2, 4, 6, 8, 12, etc. ; il ne permet pas de conclure de façon unique.
- **Méthode :** Calculer le quotient lorsque le nombre de sachets est connu ; pour l'autre information, tester des nombres pairs compatibles produisant des réponses opposées.
- **Piège :** Supposer que « pair » signifie nécessairement 6 ou qu'il suffit de connaître la parité pour fixer le quotient.
- **Distracteurs :** C attire si l'on croit que la parité apporte une précision utile ; B attire si l'on oublie les nombreux nombres pairs possibles ; E attire si l'on ne fait pas la division avec l'information 1.

## CM-08

- **Niveau :** Discriminant
- **Temps indicatif :** 100 secondes
- **Énoncé :** Un rectangle a une longueur strictement supérieure à sa largeur. Son aire est-elle supérieure à 96 cm² ?
- **Information 1 :** Son périmètre est de 42 cm et la longueur dépasse la largeur de 2 cm.
- **Information 2 :** Sa largeur est de 10 cm et sa diagonale mesure `√221` cm.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** D — Chaque information suffisante seule.
- **Explication :** Avec l'information 1, si la largeur vaut `l`, alors `2l + 2(l + 2) = 42`, donc `l = 10` et la longueur vaut 12 ; l'aire est 120 cm². Avec l'information 2, le théorème de Pythagore donne `L² + 10² = 221`, donc `L = 11` (la longueur est positive) ; l'aire est 110 cm². Dans les deux cas, elle dépasse 96 cm².
- **Méthode :** Résoudre séparément chaque jeu de contraintes ; ne jamais combiner les informations avant d'avoir évalué leur suffisance isolée.
- **Piège :** Croire que les deux informations doivent conduire à la même aire ; elles doivent seulement permettre de répondre à la question posée.
- **Distracteurs :** C attire si l'on combine automatiquement les données ; A ou B attirent si l'on ne mène pas le calcul jusqu'à l'aire dans l'autre information ; E attire si l'on cherche une valeur unique commune aux deux scénarios.

## CM-09

- **Niveau :** Discriminant
- **Temps indicatif :** 95 secondes
- **Énoncé :** `u` et `v` sont des entiers strictement positifs tels que `u + v = 20`. Peut-on affirmer que `u` est un multiple de `v` ?
- **Information 1 :** `u` est pair.
- **Information 2 :** `v` est divisible par 4.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** E — Informations insuffisantes même ensemble.
- **Explication :** Ensemble, les informations autorisent par exemple `(u, v) = (16, 4)`, pour lequel 16 est un multiple de 4, et `(12, 8)`, pour lequel 12 n'est pas un multiple de 8. Les deux réponses sont donc possibles.
- **Méthode :** Pour tester l'insuffisance, construire deux cas qui respectent toutes les conditions mais donnent des réponses opposées.
- **Piège :** Confondre le fait que les deux nombres soient multiples de 4 avec une relation de divisibilité entre eux.
- **Distracteurs :** C attire si l'on s'arrête au premier exemple compatible ; A ou B attirent si l'on donne une portée excessive à une condition de divisibilité ; D attire si l'on ne vérifie pas l'autonomie des informations.

## CM-10

- **Niveau :** Discriminant
- **Temps indicatif :** 100 secondes
- **Énoncé :** `a` et `b` sont deux nombres réels non nuls tels que `ab = 16`. Peut-on affirmer que `a + b > 10` ?
- **Information 1 :** `a > b`.
- **Information 2 :** `a` et `b` sont positifs.
- **Choix :** A, B, C, D, E
- **Bonne réponse :** E — Informations insuffisantes même ensemble.
- **Explication :** Les deux informations réunies permettent notamment `a = 8`, `b = 2`, donnant une somme de 10, qui ne vérifie pas l'inégalité stricte. Elles permettent aussi `a = 12`, `b = 4/3`, donnant une somme supérieure à 10. Il est donc impossible de conclure.
- **Méthode :** Exploiter le produit imposé pour fabriquer deux couples positifs ordonnés, puis comparer leurs sommes au seuil.
- **Piège :** Appliquer sans nuance l'idée que la somme de deux nombres positifs de produit 16 dépasserait toujours 10.
- **Distracteurs :** C attire si l'on suppose que la positivité et l'ordre fixent les valeurs ; B attire si l'on invoque mal l'inégalité arithmético-géométrique ; A attire si l'on pense que l'ordre suffit à imposer une grande somme.
