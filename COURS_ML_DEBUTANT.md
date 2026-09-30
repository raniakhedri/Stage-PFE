# Le Machine Learning de Sellio expliqué à un débutant

> Ce document part de zéro. Chaque notion est expliquée avec des mots simples, puis appliquée à Sellio.
> À la fin : **les questions que le jury peut poser, avec des réponses prêtes**.
> Pour les chiffres détaillés et les aspects techniques, voir [`README_ML.md`](README_ML.md).

---

## Sommaire

**Partie 1 — Les bases**
1. [C’est quoi le Machine Learning ?](#1-cest-quoi-le-machine-learning-)
2. [Les trois grandes familles d’apprentissage](#2-les-trois-grandes-familles-dapprentissage)
3. [Le vocabulaire indispensable](#3-le-vocabulaire-indispensable)
4. [Les données : nettoyage et préparation](#4-les-données--nettoyage-et-préparation)
5. [Entraînement, validation, test : ne jamais tricher](#5-entraînement-validation-test--ne-jamais-tricher)
6. [Sur-apprentissage et sous-apprentissage](#6-sur-apprentissage-et-sous-apprentissage)

**Partie 2 — Les modèles**
7. [La régression logistique](#7-la-régression-logistique)
8. [L’arbre de décision](#8-larbre-de-décision)
9. [La forêt aléatoire (Random Forest)](#9-la-forêt-aléatoire-random-forest)
10. [Le Gradient Boosting](#10-le-gradient-boosting)
11. [Les autres modèles et pourquoi on ne les a pas pris](#11-les-autres-modèles-et-pourquoi-on-ne-les-a-pas-pris)
12. [Le clustering et K-Means](#12-le-clustering-et-k-means)
13. [Les systèmes de recommandation](#13-les-systèmes-de-recommandation)

**Partie 3 — Mesurer si un modèle est bon**
14. [La matrice de confusion](#14-la-matrice-de-confusion)
15. [Accuracy, précision, rappel, F1](#15-accuracy-précision-rappel-f1)
16. [L’AUC expliquée simplement](#16-lauc-expliquée-simplement)
17. [Les métriques de recommandation : HitRate, NDCG, couverture](#17-les-métriques-de-recommandation--hitrate-ndcg-couverture)
18. [Les métriques de segmentation : silhouette, Davies-Bouldin, stabilité](#18-les-métriques-de-segmentation--silhouette-davies-bouldin-stabilité)
19. [Baseline : toujours se comparer à quelque chose de simple](#19-baseline--toujours-se-comparer-à-quelque-chose-de-simple)

**Partie 4 — Ce que j’ai fait dans Sellio**
20. [Vue d’ensemble du projet ML](#20-vue-densemble-du-projet-ml)
21. [Le tracking comportemental](#21-le-tracking-comportemental)
22. [La prédiction du churn](#22-la-prédiction-du-churn)
23. [Le moteur de recommandation](#23-le-moteur-de-recommandation)
24. [La segmentation des visiteurs](#24-la-segmentation-des-visiteurs)
25. [Comment tout ça tourne en production](#25-comment-tout-ça-tourne-en-production)

**Partie 5 — Préparer la soutenance**
26. [Questions du jury et réponses](#26-questions-du-jury-et-réponses)
27. [Les pièges à éviter à l’oral](#27-les-pièges-à-éviter-à-loral)
28. [Glossaire](#28-glossaire)

---

# Partie 1 — Les bases

## 1. C’est quoi le Machine Learning ?

### La programmation classique

D’habitude, un développeur écrit des **règles** :

```
SI le client n’a rien acheté depuis 90 jours ALORS il est « à risque »
```

Le problème : qui a décidé « 90 jours » ? Et si un client achète peu mais régulièrement ? Et si un autre achetait beaucoup puis a brusquement arrêté ? Les règles écrites à la main deviennent vite fausses ou trop compliquées.

### Le Machine Learning

Avec le Machine Learning (**apprentissage automatique**), on ne donne pas les règles : on donne **des exemples**, et l’ordinateur **trouve les règles tout seul**.

```
Programmation classique :   règles + données  →  réponses
Machine Learning        :   données + réponses →  règles (le « modèle »)
```

**Exemple Sellio** : on montre à l’ordinateur des milliers de clients du passé, avec pour chacun :
- ce qu’on savait de lui à un moment donné (nombre de commandes, montant dépensé, date de dernière commande…) ;
- ce qui s’est passé ensuite (**il est revenu acheter** ou **il n’est jamais revenu**).

L’ordinateur cherche les points communs des clients qui sont partis. Ensuite, pour un nouveau client, il peut dire : « celui-là ressemble aux clients qui partent, probabilité 78 % ».

### Une analogie

Un enfant apprend à reconnaître un chat **sans qu’on lui donne une définition** (« mammifère à 4 pattes, moustaches… »). On lui montre des chats et des chiens, en lui disant lequel est lequel, et il finit par savoir les distinguer — même devant un chat qu’il n’a jamais vu. C’est exactement ça, apprendre à partir d’exemples.

### Un modèle, c’est quoi ?

Le **modèle**, c’est le résultat de l’apprentissage : une « formule » ou un ensemble de règles que l’ordinateur a trouvés. Une fois entraîné, on l’enregistre dans un fichier (chez nous : `churn_model.pkl`) et on l’utilise pour faire des **prédictions** sur de nouveaux cas.

---

## 2. Les trois grandes familles d’apprentissage

| Famille | Idée | On a la réponse dans les exemples ? | Dans Sellio |
|---|---|---|---|
| **Supervisé** | apprendre à prédire une réponse connue | ✅ oui | **Churn** : on sait quels clients sont partis |
| **Non supervisé** | trouver des groupes ou des structures cachés | ❌ non | **Segmentation** : personne ne nous dit à quel groupe appartient chaque visiteur |
| **Par renforcement** | apprendre par essais-erreurs avec des récompenses | — | pas utilisé (c’est ce qu’on utilise pour les jeux, les robots) |

### Supervisé : deux types de questions

- **Classification** : la réponse est une **catégorie**. « Ce client va-t-il partir : oui ou non ? » → c’est notre churn.
- **Régression** : la réponse est un **nombre**. « Combien ce client va-t-il dépenser le mois prochain ? » → pas utilisé chez nous.

⚠️ Piège de vocabulaire : la **régression logistique** est… un modèle de **classification** (voir §7). Le nom est historique.

### Et la recommandation ?

Elle est un peu à part : on ne connaît pas « la bonne réponse » pour chaque visiteur, mais on apprend à partir de ce que les gens ont fait (vus, achetés). On parle d’apprentissage à partir de **feedback implicite** (voir §13).

---

## 3. Le vocabulaire indispensable

| Mot | Signification | Exemple Sellio |
|---|---|---|
| **Jeu de données** (dataset) | un tableau d’exemples | 5 239 clients d’Online Retail II |
| **Ligne / observation** | un exemple | un client |
| **Variable / feature / caractéristique** | une colonne qui décrit l’exemple | nombre de commandes, jours depuis la dernière commande |
| **Cible / label / étiquette** | la réponse à prédire | `churn` = 1 (parti) ou 0 (resté) |
| **Entraîner** (fit) | faire apprendre le modèle sur des exemples | `model.fit(X, y)` |
| **Prédire** (predict) | utiliser le modèle sur un nouveau cas | probabilité de départ d’un client |
| **Probabilité** | un nombre entre 0 et 1 | 0,78 = 78 % de chances de partir |
| **Seuil** | la limite pour transformer une probabilité en décision | au-dessus de 0,76 → risque « ÉLEVÉ » |
| **Hyper-paramètre** | un réglage du modèle choisi **par nous**, pas appris | la profondeur maximale des arbres, le nombre de groupes K |
| **Paramètre** | ce que le modèle apprend tout seul | les règles internes des arbres |

---

## 4. Les données : nettoyage et préparation

> « Garbage in, garbage out » : si on donne des données sales, le modèle apprend des bêtises.

En pratique, **70 à 80 % du travail** d’un projet ML, c’est préparer les données. Le modèle lui-même tient en quelques lignes.

### Les défauts classiques (et ceux qu’on a vraiment trouvés)

| Défaut | Exemple réel dans nos jeux | Ce qu’on a fait |
|---|---|---|
| **Doublons** | 34 335 lignes en double dans Online Retail II, 183 860 dans Cosmetics | supprimés |
| **Valeurs manquantes** | 243 007 achats sans identifiant client | supprimés (impossible de relier un achat anonyme à un client) |
| **Valeurs impossibles** | prix négatifs, quantités négatives | supprimés |
| **Valeurs aberrantes** | une ligne de 80 995 unités (erreur de saisie annulée ensuite) | coupées au-delà du 99,9ᵉ centile |
| **Faux utilisateurs** | 78 998 événements de **robots** (plus de 500 actions/jour) | supprimés |
| **Incohérences** | « None » et « NONE » pour la même chose chez H&M | harmonisés |
| **Lignes qui ne sont pas des produits** | frais de port « POST », remises « D » | supprimées |

### Pourquoi c’est important pour le jury

Montrer le nettoyage prouve que tu **comprends tes données**. Chaque script écrit un rapport qui dit combien de lignes ont été retirées à chaque étape et pourquoi : c’est ta preuve.

### Normaliser, standardiser

Certains modèles sont perturbés si une variable est en « milliers de dinars » et une autre en « nombre de commandes » (entre 1 et 20). On **standardise** : on ramène chaque variable à une moyenne de 0 et un écart-type de 1, pour qu’elles pèsent pareil.

- La **régression logistique** et **K-Means** en ont besoin.
- Les **arbres** n’en ont pas besoin (ils comparent juste « plus grand / plus petit que », l’échelle ne change rien).

### Log et winsorisation

- **log(1 + x)** : écrase les grandes valeurs. Un client à 200 commandes n’est pas « 100 fois plus fidèle » qu’un client à 2 commandes. Le log rapproche les extrêmes.
- **Winsorisation** : on « plafonne » les valeurs extrêmes (chez nous à ±3 écarts-types) pour qu’un visiteur hors normes ne déforme pas tout.

---

## 5. Entraînement, validation, test : ne jamais tricher

C’est **la notion la plus importante** pour le jury.

### L’analogie de l’examen

- Tu révises avec des exercices (**entraînement**).
- Tu fais un examen blanc pour choisir ta méthode de révision (**validation**).
- Tu passes le vrai examen, avec des sujets **jamais vus** (**test**).

Si le professeur te donne le sujet du vrai examen pendant les révisions, ta note ne prouve rien. En ML, c’est pareil : **un modèle doit être noté sur des données qu’il n’a jamais vues**.

### Les trois ensembles

| Ensemble | Sert à | Peut-on le regarder pendant qu’on règle le modèle ? |
|---|---|---|
| **Entraînement** | apprendre | oui |
| **Validation** | choisir entre plusieurs modèles / réglages | oui |
| **Test** | donner la note finale | **non, une seule fois à la fin** |

### Pourquoi une validation *temporelle* ?

Pour prédire **le futur**, on ne mélange pas les dates au hasard. Sinon, le modèle pourrait apprendre avec des données de décembre pour « prédire » novembre : c’est de la triche, appelée **fuite de données** (*data leakage*).

Ce qu’on a fait pour le churn :

```
T1 (mars 2011)  → on entraîne les modèles
T2 (juin 2011)  → on choisit le meilleur modèle
T3 (sept. 2011) → on le note une seule fois
```

À chaque date, le modèle ne voit **que le passé** du client, et on vérifie s’il a acheté dans les **90 jours suivants**.

### La validation croisée (cross-validation)

On découpe les données en 5 morceaux ; on entraîne 5 fois en gardant à chaque fois un morceau différent pour tester ; on fait la moyenne. C’est plus fiable qu’un seul découpage. On l’utilise quand l’ordre du temps n’a pas d’importance. Pour le churn, on a préféré la validation **temporelle**, plus proche de la réalité.

---

## 6. Sur-apprentissage et sous-apprentissage

### Sur-apprentissage (*overfitting*)

Le modèle **apprend par cœur** les exemples au lieu de comprendre la logique. Il a 100 % aux exercices mais rate l’examen.

> Un élève qui apprend par cœur les corrigés sans comprendre : face à un nouvel exercice, il est perdu.

**Signes** : très bon score sur l’entraînement, mauvais sur le test.

**Chez nous** : les forêts très profondes (profondeur 16) ont fait **moins bien** en validation que les forêts peu profondes (profondeur 6). Elles apprenaient trop de détails propres aux clients d’entraînement.

### Sous-apprentissage (*underfitting*)

Le modèle est **trop simple** pour capter la réalité. Il est mauvais partout.

> Un élève qui répond toujours « C » au QCM.

### Le juste milieu

C’est tout l’art du ML : un modèle assez riche pour apprendre, assez simple pour généraliser. On le trouve **en testant plusieurs réglages sur la validation** — c’est ce qu’on a fait avec la « recherche sur grille » (tester toutes les combinaisons de réglages).

---

# Partie 2 — Les modèles

## 7. La régression logistique

### L’idée

Chaque variable reçoit un **poids** (positif = pousse vers le départ, négatif = pousse vers la fidélité). On additionne, puis on transforme le total en probabilité entre 0 et 1 grâce à une courbe en « S » (la fonction sigmoïde).

```
score = 0,8 × (jours depuis dernière commande) − 0,5 × (nombre de commandes) + …
probabilité = sigmoïde(score)   → entre 0 et 1
```

### Avantages / inconvénients

| ✅ | ❌ |
|---|---|
| Très simple, rapide | Ne voit que des effets « en ligne droite » |
| Facile à expliquer (chaque poids a un sens) | Rate les interactions (« peu de commandes **ET** longtemps sans acheter ») |
| Peu de risque de sur-apprentissage | Demande des variables standardisées |

**Dans Sellio** : c’est notre **modèle de référence**. AUC 0,791 sur Online Retail II : bien, mais battu par la forêt (0,801).

---

## 8. L’arbre de décision

### L’idée

Un arbre de décision, c’est une suite de **questions oui/non**, comme le jeu « Qui est-ce ? ».

```
                 Dernière commande il y a plus de 60 jours ?
                  /                                      \
                OUI                                      NON
                 |                                        |
     Moins de 3 commandes au total ?               → reste (risque 20 %)
          /              \
        OUI              NON
         |                |
  → part (risque 85 %)   → risque 55 %
```

L’ordinateur choisit **tout seul** les questions et les seuils (60 jours, 3 commandes…) qui séparent le mieux les clients qui partent de ceux qui restent.

### Avantages / inconvénients

| ✅ | ❌ |
|---|---|
| Très lisible : on peut dessiner l’arbre | **Instable** : un petit changement de données peut changer tout l’arbre |
| Capte les interactions entre variables | **Sur-apprend** facilement s’il est trop profond |
| Pas besoin de standardiser | Un seul arbre est rarement le plus précis |

C’est pour corriger ces défauts qu’on utilise **plusieurs arbres** : la forêt et le boosting.

---

## 9. La forêt aléatoire (Random Forest)

### L’idée : la sagesse des foules

On construit **300 arbres différents**, chacun sur un échantillon un peu différent des clients et avec un sous-ensemble des variables. Pour un nouveau client, **chaque arbre vote**, et on fait la moyenne.

> Si tu demandes l’avis d’un seul ami, il peut se tromper. Si tu demandes à 300 personnes différentes et que tu fais la moyenne, les erreurs individuelles se compensent.

### Pourquoi « aléatoire » ?

Si les 300 arbres voyaient exactement les mêmes données, ils seraient identiques et voteraient pareil. Le hasard (des clients tirés au sort, des variables tirées au sort) les rend **différents**, et c’est leur diversité qui rend le vote fiable.

### Avantages / inconvénients

| ✅ | ❌ |
|---|---|
| Très robuste, peu de sur-apprentissage | Moins lisible qu’un seul arbre |
| Marche bien « sans trop régler » | Plus lent qu’un seul arbre (mais quelques secondes chez nous) |
| Capte les interactions | Fichier modèle plus gros |
| Donne l’importance de chaque variable | |

**Dans Sellio** : modèle retenu pour le **churn général** (Online Retail II), 300 arbres de profondeur 6. AUC **0,801**.

---

## 10. Le Gradient Boosting

### L’idée : apprendre de ses erreurs

Au lieu de construire les arbres **en parallèle** (forêt), on les construit **l’un après l’autre** : chaque nouvel arbre se concentre sur **les erreurs** des arbres précédents.

> Un élève qui fait un examen blanc, regarde ses erreurs, révise exactement ces points-là, refait un examen, regarde ses nouvelles erreurs… et ainsi de suite.

### Forêt vs Boosting

| | Random Forest | Gradient Boosting |
|---|---|---|
| Construction | arbres **indépendants**, en parallèle | arbres **successifs**, chacun corrige le précédent |
| Idée | moyenne de beaucoup d’avis | amélioration progressive |
| Risque de sur-apprentissage | faible | plus élevé si mal réglé |
| Réglages | peu sensibles | plus sensibles (taux d’apprentissage…) |
| Performance | très bonne | souvent la meilleure sur des tableaux de données |

**Dans Sellio** : modèle retenu pour le **churn vêtements** (H&M). AUC **0,799**. Mais honnêtement, tous les modèles étaient très proches sur H&M (0,767 à 0,775 en validation) : ici, ce sont les variables qui limitent la performance, pas l’algorithme.

### Pourquoi des arbres et pas autre chose pour le churn ?

1. **Nos données sont un tableau** (clients × variables numériques). Sur ce type de données, les méthodes à base d’arbres (forêts, boosting) sont **l’état de l’art** : elles battent généralement les réseaux de neurones.
2. Elles **captent les interactions** (« peu de commandes ET longtemps sans acheter ») que la régression logistique rate.
3. Pas besoin de standardiser, résistantes aux valeurs extrêmes.
4. On peut **expliquer** le résultat (importance des variables).
5. Elles s’entraînent en quelques secondes sur un PC, sans carte graphique.

**Et on ne l’a pas supposé : on l’a vérifié.** On a mis en compétition régression logistique, 6 forêts et 2 boostings, et on a gardé le meilleur sur la validation.

---

## 11. Les autres modèles et pourquoi on ne les a pas pris

| Modèle | Principe en une phrase | Pourquoi pas chez nous |
|---|---|---|
| **k plus proches voisins (kNN)** | un client ressemble aux k clients les plus proches | lent sur beaucoup de clients, sensible à l’échelle des variables, moins précis |
| **SVM** (machine à vecteurs de support) | trace la « meilleure frontière » entre deux classes | lent sur des dizaines de milliers de lignes, probabilités peu fiables, difficile à expliquer |
| **Naive Bayes** | probabilités en supposant les variables indépendantes | nos variables sont très liées entre elles (nb de commandes ↔ montant) |
| **Réseaux de neurones / deep learning** | des couches de « neurones » qui apprennent des représentations | brillants pour images, texte, son ; sur un **petit tableau de 6 variables**, pas meilleurs que les arbres, besoin de beaucoup plus de données, boîte noire, souvent un GPU |
| **XGBoost / LightGBM** | versions optimisées du boosting | très bons, mais le `HistGradientBoosting` de scikit-learn fait la même chose sans dépendance en plus |

👉 Phrase à retenir pour le jury : **« On choisit le modèle le plus simple qui fait le travail, et on le prouve en le comparant aux autres sur des données jamais vues. »**

---

## 12. Le clustering et K-Means

### Le clustering (regroupement)

C’est de l’apprentissage **non supervisé** : on ne donne pas de réponse, on demande à l’ordinateur de **former des groupes** d’individus qui se ressemblent.

> Tu vides ton armoire et tu fais des piles « sans consigne » : les pantalons ensemble, les t-shirts ensemble… Personne ne t’a dit quelles piles faire, tu as regroupé ce qui se ressemble.

### K-Means, pas à pas

1. On choisit **K**, le nombre de groupes (par exemple 3).
2. On place K « centres » au hasard.
3. Chaque visiteur rejoint **le centre le plus proche**.
4. Chaque centre se déplace au **milieu** de ses visiteurs.
5. On répète 3 et 4 jusqu’à ce que plus rien ne bouge.

Le **centre** (centroïde) d’un groupe, c’est le « visiteur moyen » du groupe. C’est lui qui permet de donner un nom au groupe : « 5,6 visites, 22 produits vus → **Explorateurs** ».

### Comment choisir K ?

On essaie K = 3, 4, 5, 6 et on garde celui qui a le meilleur **score de silhouette** (§18). Chez nous : K = 3.

### Pourquoi K-Means et pas autre chose ?

| Méthode | Principe | Pourquoi pas |
|---|---|---|
| **RFM** (Récence, Fréquence, Montant) | règles manuelles sur 3 critères | ne voit que les acheteurs, pas la navigation ni les paniers abandonnés |
| **DBSCAN** | groupes = zones denses de points | on ne contrôle pas le nombre de groupes, beaucoup de visiteurs classés « bruit » |
| **Mélange gaussien (GMM)** | groupes en forme de nuages, appartenance probabiliste | plus instable, et un marchand veut des groupes nets |
| **Classification hiérarchique** | on fusionne progressivement les plus proches | trop gourmand en mémoire pour des dizaines de milliers de visiteurs |

K-Means est **simple, rapide, stable** et ses groupes sont **faciles à expliquer** avec leurs centres.

---

## 13. Les systèmes de recommandation

### Le problème

Choisir, parmi des milliers de produits, les 10 qu’un visiteur a le plus de chances d’aimer.

### Feedback explicite vs implicite

- **Explicite** : le client donne une note (★★★★☆). Rare et peu fiable.
- **Implicite** : on observe ce qu’il **fait** (vues, paniers, achats). Abondant, c’est ce qu’on utilise. On donne plus de poids aux actions fortes : vue = 1, panier = 4, achat = 8.

### Les trois grandes approches

#### 1. Popularité
« Voici les best-sellers. » Même liste pour tout le monde. Simple et souvent étonnamment efficace, mais aucune personnalisation.

#### 2. Filtrage basé sur le contenu
« Tu as aimé une robe en lin beige → voici d’autres robes en lin beige. »
On compare les **descriptions** des produits. Avantage : marche pour un produit **tout neuf** que personne n’a encore acheté.

Pour comparer des textes, on utilise **TF-IDF** : chaque mot reçoit un poids élevé s’il est fréquent dans **ce** produit mais rare dans **les autres**. « Lin » dit beaucoup sur un produit ; « le » ne dit rien.

#### 3. Filtrage collaboratif
« Les clients qui ont acheté A ont aussi acheté B. »
On ne regarde pas les produits, on regarde **les comportements**. Ça découvre des liens invisibles dans les descriptions (un pantalon et une chemise qui vont bien ensemble).

On représente tout dans un grand tableau clients × produits, presque vide (chaque client n’a acheté qu’une toute petite partie du catalogue). La **SVD** (décomposition en valeurs singulières) résume ce tableau en quelques dizaines de « goûts cachés » (**facteurs latents**) : par exemple un facteur « style décontracté », un facteur « couleurs vives »… L’ordinateur les trouve seul, on ne leur donne pas de nom.

### Notre choix : un modèle hybride

On combine les trois :
- **collaboratif** quand un produit a beaucoup d’historique ;
- **contenu** quand il en a peu (un produit neuf est recommandé 100 % sur sa description) ;
- une part de **popularité**, parce que sur des données réelles, les best-sellers comptent énormément.

Les proportions (appelées **λ** et **α**) sont **réglées automatiquement pour chaque boutique**.

### Le démarrage à froid (*cold start*)

Un produit neuf ou une boutique neuve n’a aucun historique : le filtrage collaboratif ne peut rien faire. C’est pour ça que le contenu et la popularité sont indispensables dans l’hybride.

### Les règles d’association (« souvent achetés ensemble »)

On regarde les paniers : « quand A est dans le panier, B y est souvent aussi ». La mesure clé est le **lift** :

```
lift = P(B | A) / P(B)
```

- lift = 1 → A ne change rien à la probabilité d’acheter B ;
- lift = 3 → quand A est acheté, B est 3 fois plus probable que d’habitude.

Le lift évite de proposer simplement les best-sellers (qui sont dans tous les paniers).

---

# Partie 3 — Mesurer si un modèle est bon

## 14. La matrice de confusion

Pour le churn, le modèle dit « part » ou « reste ». La réalité aussi. Quatre cas possibles :

|  | **Le client est vraiment parti** | **Le client est vraiment resté** |
|---|---|---|
| **Le modèle dit « part »** | ✅ **Vrai positif** (VP) — bonne alerte | ❌ **Faux positif** (FP) — fausse alerte |
| **Le modèle dit « reste »** | ❌ **Faux négatif** (FN) — départ raté | ✅ **Vrai négatif** (VN) — bien vu |

Toutes les métriques suivantes sont calculées à partir de ces 4 cases.

---

## 15. Accuracy, précision, rappel, F1

### Accuracy (exactitude)

**Part de bonnes réponses au total.**

```
accuracy = (VP + VN) / tout le monde
```

⚠️ **Piège** : si 90 % des clients restent, un modèle qui dit toujours « reste » a 90 % d’accuracy… et ne sert à rien. C’est pour ça qu’on ne regarde jamais l’accuracy seule.

### Précision

**Quand le modèle crie « il va partir », a-t-il raison ?**

```
précision = VP / (VP + FP)
```

> Précision de 0,88 chez H&M : sur 100 clients signalés « à risque », 88 partent vraiment. Le marchand ne gaspille pas ses coupons.

### Rappel (*recall*, sensibilité)

**Parmi les clients qui partent vraiment, combien le modèle en a-t-il trouvé ?**

```
rappel = VP / (VP + FN)
```

> Rappel de 0,85 pour Online Retail II : le modèle détecte 85 % des départs. La règle simple « récence » n’en trouvait que 38 %.

### Le compromis précision / rappel

- Crier « danger » pour tout le monde → rappel parfait, précision nulle.
- Ne crier que quand on est sûr à 100 % → bonne précision, mais on rate plein de départs.

Le **seuil** (0,5 par défaut) règle ce compromis. Dans Sellio, les bandes de risque (FAIBLE / MOYEN / ÉLEVÉ) utilisent plusieurs seuils pour laisser le marchand choisir ses actions.

### F1

La **moyenne harmonique** de la précision et du rappel : un seul chiffre qui n’est bon que si **les deux** sont bons.

```
F1 = 2 × précision × rappel / (précision + rappel)
```

---

## 16. L’AUC expliquée simplement

C’est la métrique **la plus probable** dans les questions du jury.

### L’explication la plus simple

On prend **au hasard** un client qui est parti et un client qui est resté. On demande au modèle leurs deux probabilités de départ.

> **L’AUC, c’est la probabilité que le modèle donne un score plus élevé au client qui est vraiment parti.**

| AUC | Signification |
|---|---|
| 0,5 | le modèle ne fait pas mieux qu’une pièce de monnaie |
| 0,6 – 0,7 | faible |
| 0,7 – 0,8 | correct |
| **0,8 – 0,9** | **bon** ← nos modèles de churn (0,80) |
| > 0,9 | excellent… ou suspect (vérifier qu’il n’y a pas de fuite de données) |
| 1,0 | parfait → presque toujours une erreur dans la méthode |

### D’où vient le nom ?

AUC = *Area Under the Curve*, **l’aire sous la courbe ROC**. La courbe ROC montre, pour tous les seuils possibles, le taux de départs détectés (rappel) en fonction du taux de fausses alertes. Plus la courbe monte vite, plus l’aire est grande, meilleur est le modèle.

### Pourquoi l’AUC est pratique

- **Elle ne dépend pas du seuil** : elle juge la capacité du modèle à **classer** les clients du plus risqué au moins risqué.
- **Elle n’est pas trompée par les classes déséquilibrées**, contrairement à l’accuracy.

### ROC-AUC vs PR-AUC

La **PR-AUC** (aire sous la courbe précision-rappel) se concentre sur la classe positive (les départs). Elle est utile quand cette classe est rare. On rapporte les deux.

### Pourquoi 0,80 est un bon résultat, pas un mauvais

- Le comportement humain est **imprévisible** : un client peut partir parce qu’il a déménagé, perdu son emploi… Aucune donnée ne le dit.
- On n’a que **6 variables** d’achat.
- La règle de bon sens (récence seule) fait déjà 0,74–0,76 : le modèle ajoute un vrai gain par-dessus.
- Un 0,99 aurait été **suspect** (fuite de données, triche involontaire).

---

## 17. Les métriques de recommandation : HitRate, NDCG, couverture

On cache les **prochains** achats de chaque client, on lui recommande 10 produits, et on regarde si les produits cachés sont dans la liste.

### HitRate@10

**Part des clients pour qui au moins un des 10 produits recommandés a vraiment été acheté ensuite.**

> HitRate@10 = 0,36 sur Online Retail II : pour 36 % des clients, la liste de 10 contenait au moins un produit qu’ils ont réellement acheté dans les 3 mois.

Le « @10 » veut dire « dans les 10 premiers ».

### Precision@10

Parmi les 10 recommandés, combien étaient bons (en moyenne). Toujours faible en recommandation : un client n’achète que quelques produits parmi des milliers.

### NDCG@10

Le HitRate compte pareil un bon produit en 1ʳᵉ position et en 10ᵉ. Le **NDCG** donne **plus de points quand le bon produit est en haut de la liste**, car c’est là que le client regarde.

- 1 = parfait (tous les bons produits en tête)
- 0 = aucun bon produit dans la liste

### Couverture

**Part du catalogue qui est recommandée au moins une fois.**

> La popularité recommande les mêmes produits à tout le monde → couverture de 0,3 à 1,8 %. Notre modèle couvre 22 à 61 % du catalogue : il fait découvrir la « longue traîne » (les produits moins connus).

### Pourquoi nos scores de recommandation semblent « bas »

Deviner **exactement** ce qu’un client va acheter parmi 5 000 produits est très difficile. Sur H&M, les **meilleures équipes mondiales** de la compétition Kaggle atteignaient un MAP@12 d’environ 0,036. Ce qui compte, ce n’est pas le chiffre absolu, c’est de **battre la baseline** — et on la bat sur les trois jeux.

---

## 18. Les métriques de segmentation : silhouette, Davies-Bouldin, stabilité

En non supervisé, il n’y a pas de « bonne réponse » pour vérifier. On mesure donc la **qualité** des groupes.

### Score de silhouette (entre −1 et 1)

Pour chaque visiteur : est-il **proche des membres de son groupe** et **loin des autres groupes** ?

| Silhouette | Lecture |
|---|---|
| proche de 1 | groupes bien séparés |
| autour de 0,25 – 0,5 | structure raisonnable à nette ← **nous : 0,47** |
| proche de 0 | groupes qui se chevauchent |
| négatif | visiteurs mal classés |

### Indice de Davies-Bouldin

Compare la taille des groupes à la distance entre eux. **Plus il est bas, mieux c’est.** Nous : 1,26.

### Stabilité (ARI)

On relance la segmentation sur 5 échantillons différents de visiteurs et on compare les groupes obtenus avec l’**Adjusted Rand Index** (1 = partitions identiques, 0 = aucun rapport).

> Nous : **0,95**. Les groupes réapparaissent presque à l’identique : ce ne sont pas des artefacts du hasard.

C’est un argument fort pour le jury : « Mes segments sont **reproductibles**. »

---

## 19. Baseline : toujours se comparer à quelque chose de simple

Une **baseline**, c’est une méthode simple (souvent une règle de bon sens) à laquelle on compare le modèle.

| Tâche | Baseline utilisée | Pourquoi |
|---|---|---|
| Churn | « plus un client est absent depuis longtemps, plus il risque de partir » (récence seule) | c’est ce qu’un commerçant ferait sans ML |
| Recommandation | les produits les plus populaires | c’est ce que font la plupart des boutiques |

**Si un modèle ne bat pas la baseline, il ne sert à rien**, aussi sophistiqué soit-il.

Chez nous :
- Churn : 0,80 d’AUC contre 0,74–0,76 pour la récence ✅
- Recommandation : on bat la popularité sur les 3 jeux ✅ — mais **seulement après avoir ajouté une part de popularité** au modèle. Sans elle, la popularité gagnait sur 2 jeux sur 3. C’est un vrai résultat, qu’il faut assumer.

---

# Partie 4 — Ce que j’ai fait dans Sellio

## 20. Vue d’ensemble du projet ML

```
   Visiteurs de la boutique
            │ (clics, vues, recherches, paniers, achats)
            ▼
   1. TRACKING  ──►  base de données (optimisée)
            │
            ├──► 2. RECOMMANDATION   « Vous aimerez aussi », « Recommandé pour vous », « Achetés ensemble »
            ├──► 3. SEGMENTATION     groupes de visiteurs (explorateurs, acheteurs décidés…)
            ├──► 4. ANALYSE          entonnoir de conversion, recherches sans résultat, heures d’activité
            └──► 5. CHURN            quels clients risquent de ne plus revenir
```

### Les données utilisées

Une boutique Sellio qui démarre n’a pas d’historique. J’ai donc **conçu et évalué** les modèles sur **trois jeux de données publics réels** :

| Jeu | D’où | Secteur | Sert à |
|---|---|---|---|
| **Online Retail II** | UCI Machine Learning Repository | e-commerce généraliste (UK) | churn, recommandation, « achetés ensemble » |
| **Cosmetics Shop** | Kaggle (projet REES46) | cosmétique | segmentation, recommandation sur navigation |
| **H&M** | Kaggle (compétition H&M 2022) | vêtements | churn vêtements, recommandation mode |

Ensuite, **en production**, chaque boutique Sellio ré-entraîne ses modèles chaque nuit sur ses propres données.

---

## 21. Le tracking comportemental

**Objectif** : enregistrer ce que font les visiteurs (vues, clics, recherches, paniers, favoris, achats).

**Comment** :
- la vitrine envoie les événements **par petits paquets** toutes les 4 secondes (ça ne ralentit pas la page) ;
- chaque visiteur a un identifiant anonyme ; s’il est connecté, le serveur le relie à son compte ;
- le serveur refuse les données suspectes (trop d’événements par minute, types inconnus).

**Stockage optimisé** (question probable du jury) :
- **Partitionnement par mois** : la table est découpée en « tiroirs » mensuels. Pour afficher les 30 derniers jours, la base n’ouvre qu’un ou deux tiroirs. Pour supprimer une vieille année, on jette le tiroir d’un coup.
- **Index** : comme l’index d’un livre, ils permettent de trouver rapidement les événements d’un visiteur ou d’un produit sans tout lire. Un index **BRIN** est un index minuscule, efficace parce que les événements arrivent dans l’ordre du temps.
- **Tables de résumés quotidiens** : le tableau de bord lit « 150 vues aujourd’hui pour ce produit » (1 ligne) au lieu de compter 150 lignes à chaque affichage.

---

## 22. La prédiction du churn

**Question** : ce client, qui a déjà acheté, va-t-il **ne plus rien acheter pendant 90 jours** ?

**Variables** (les mêmes que celles que Sellio calcule pour ses clients) :
1. ancienneté (depuis quand il est client)
2. nombre de commandes
3. montant total dépensé
4. panier moyen
5. fréquence (commandes par mois)
6. jours depuis la dernière commande
7. (+ âge pour les vêtements)

**Méthode** :
1. Photographier les clients à 3 dates (T1, T2, T3), en ne regardant que leur passé.
2. Mettre en compétition 9 modèles sur T1 → T2.
3. Garder le meilleur et le noter **une seule fois** sur T3.

**Résultats** :

| | Modèle | AUC | Détecte… |
|---|---|---|---|
| Boutiques générales / cosmétiques | Random Forest | **0,80** | 85 % des départs |
| Boutiques de vêtements | Gradient Boosting | **0,80** | 72 % des départs, avec 88 % de précision |
| (comparaison) règle « récence » | — | 0,74 – 0,76 | 35 – 38 % des départs |

**Ce qu’on a appris** :
- Les variables les plus utiles : **jours depuis la dernière commande** et **nombre / fréquence de commandes**.
- **L’âge n’apporte presque rien** : le comportement d’achat compte plus que le profil.
- Le modèle général marche déjà bien sur la mode (0,787) : les signes d’un départ se ressemblent d’un secteur à l’autre.

**Dans l’application** : chaque client reçoit un risque **FAIBLE / MOYEN / ÉLEVÉ** dans le backoffice. Le système choisit automatiquement le modèle vêtements ou le modèle général selon la boutique.

---

## 23. Le moteur de recommandation

**Question** : quels produits montrer à ce visiteur ?

**Modèle** : hybride = filtrage collaboratif (SVD) + contenu (TF-IDF) + une part de popularité, avec des proportions **réglées automatiquement pour chaque boutique**.

**Où on le voit** : « Vous aimerez aussi » et « Recommandé pour vous » (fiche produit, accueil), « Souvent achetés ensemble » (panier).

**Résultats** (on cache les achats futurs et on regarde si le modèle les retrouve) :

| Jeu | Popularité (HitRate) | Notre modèle (HitRate) | Gain |
|---|---|---|---|
| Online Retail II | 0,308 | **0,357** | +16 % |
| Cosmetics Shop | 0,159 | **0,178** | +12 % |
| H&M | 0,053 | **0,059** | +10 % (NDCG +41 %) |

**L’histoire à raconter au jury** (elle montre une vraie démarche scientifique) :
1. J’ai d’abord construit un hybride collaboratif + contenu.
2. Sur les données réelles de cosmétique et de mode, **il perdait contre la simple popularité**.
3. J’ai analysé pourquoi : en période de fêtes et pour des produits consommables, les best-sellers pèsent énormément.
4. J’ai ajouté une part de popularité, **réglée sur une période de validation**, jamais sur le test.
5. Résultat : le modèle bat la popularité sur les 3 jeux, tout en recommandant **12 à 200 fois plus de produits différents**.

---

## 24. La segmentation des visiteurs

**Question** : quels types de visiteurs fréquentent la boutique ?

**Modèle** : K-Means sur 9 variables de comportement (nombre de visites, produits vus, taux de panier, taux d’achat, récence…).

**Résultat sur 60 000 visiteurs réels de la boutique de cosmétiques** :

| Segment | Part | Profil | Action conseillée au marchand |
|---|---|---|---|
| Visiteurs occasionnels | 76 % | 1 visite, 1 ou 2 produits vus | capter leur e-mail (newsletter, réduction 1ʳᵉ commande) |
| Acheteurs décidés | 13 % | visites intenses, beaucoup de paniers | mettre en avant nouveautés et réassort |
| Explorateurs | 11 % | 5–6 visites, 22 produits vus | recommandations, contenus inspirants |

Qualité : silhouette **0,47**, stabilité **0,95**.

**Pourquoi « seulement » 3 segments ?** Parce que c’est ce que disent les données : le score de silhouette est meilleur à 3 qu’à 4, 5 ou 6. Et avoir 76 % de visiteurs « de passage », c’est la réalité de l’e-commerce.

---

## 25. Comment tout ça tourne en production

1. Chaque nuit à **3 h 40**, le service `analytics-service` (Java) récupère les données de chaque boutique.
2. Il appelle les scripts **Python** (scikit-learn) qui entraînent les modèles.
3. Les résultats (produits similaires, segments…) sont **enregistrés dans la base**.
4. Quand un visiteur arrive, la vitrine lit ces résultats en quelques millisecondes : **aucun calcul lourd pendant la navigation**.
5. Le marchand peut aussi cliquer sur « Ré-entraîner les modèles » dans le backoffice.

---

# Partie 5 — Préparer la soutenance

## 26. Questions du jury et réponses

### Sur les données

**« D’où viennent vos données ? »**
> De trois jeux de données publics et réels : Online Retail II (UCI Machine Learning Repository), Cosmetics Shop (Kaggle, projet REES46) et H&M (compétition Kaggle 2022). Ils couvrent les deux secteurs de Sellio, la cosmétique et les vêtements. En production, chaque boutique ré-entraîne ses modèles sur ses propres données.

**« Pourquoi ne pas utiliser les données de Sellio directement ? »**
> Une plateforme qui démarre n’a pas encore assez d’historique pour entraîner et surtout **évaluer** un modèle de façon fiable. Les jeux publics permettent de choisir et valider les modèles ; ensuite, le système est conçu pour se ré-entraîner automatiquement sur les données de chaque boutique.

**« Vos données n’ont pas les mêmes colonnes que votre application. Est-ce un problème ? »**
> Non. J’ai écrit un adaptateur qui ramène chaque jeu au noyau commun (client, produit, date, action, prix, description), et les modèles n’utilisent que les variables présentes à la fois dans les jeux et dans Sellio. Par exemple, le churn utilise 6 variables d’achat que Sellio calcule exactement de la même manière. Pour H&M, j’ai mesuré que la fiche vêtement Sellio est remplie à 100 % pour le nom, la catégorie et le genre, 98 % pour la couleur, 80 % pour le tissu.

**« Comment avez-vous nettoyé les données ? »**
> Suppression des doublons, des annulations, des prix négatifs, des clients anonymes, des robots et des valeurs aberrantes ; harmonisation des valeurs incohérentes. Chaque script produit un rapport chiffré : par exemple, sur Online Retail II on passe de 1 067 371 lignes à 774 591, soit 72,6 % conservées.

**« Pourquoi avoir échantillonné les données ? »**
> Pour que les calculs tiennent en mémoire sur un poste de développement (60 000 visiteurs pour Cosmetics, 1 client sur 16 pour H&M). L’échantillon est tiré au hasard avec une graine fixe, donc reproductible et représentatif.

### Sur la méthode

**« Comment savez-vous que votre modèle marche vraiment ? »**
> Il est noté sur des données qu’il n’a jamais vues, et **postérieures** dans le temps à celles de l’entraînement (validation temporelle). Les réglages sont choisis sur une période de validation, et le test n’est utilisé qu’une seule fois. Et il est toujours comparé à une baseline simple.

**« C’est quoi une fuite de données ? Comment l’avez-vous évitée ? »**
> C’est quand le modèle a accès, pendant l’entraînement, à une information qu’il n’aurait pas dans la réalité — par exemple des données du futur. Je l’ai évitée en calculant les variables uniquement à partir du passé de chaque client, et en séparant les périodes d’entraînement, de validation et de test dans l’ordre chronologique.

**« Qu’est-ce que le sur-apprentissage ? En avez-vous eu ? »**
> C’est quand un modèle apprend par cœur ses exemples et généralise mal. On l’a observé : les forêts de profondeur 16 faisaient moins bien que celles de profondeur 6 en validation. C’est pour ça qu’on choisit les réglages sur la validation et non sur l’entraînement.

**« Pourquoi 90 jours pour le churn ? »**
> C’est un horizon courant dans la littérature et en marketing : assez court pour agir (une relance), assez long pour ne pas confondre une pause normale avec un départ. C’était aussi l’horizon du modèle initial du projet.

### Sur les modèles

**« Pourquoi un Random Forest et pas un réseau de neurones ? »**
> Nos données sont un tableau de quelques variables numériques. Sur ce type de données, les méthodes à base d’arbres sont l’état de l’art et battent généralement les réseaux de neurones, qui brillent surtout sur les images, le texte ou le son. Elles sont aussi plus rapides, plus explicables et ne demandent pas de GPU. Et je l’ai vérifié en comparant 9 modèles sur la validation.

**« Pourquoi pas un simple arbre de décision ? »**
> Un seul arbre est instable et sur-apprend facilement. Une forêt fait voter 300 arbres différents, ce qui corrige ces défauts. Le boosting construit des arbres qui corrigent les erreurs des précédents.

**« Quelle différence entre Random Forest et Gradient Boosting ? »**
> La forêt construit ses arbres indépendamment et fait la moyenne de leurs votes ; le boosting les construit l’un après l’autre, chacun corrigeant les erreurs du précédent. La forêt est plus robuste sans réglage ; le boosting est souvent un peu plus précis mais plus sensible aux réglages. Sur nos données, les deux étaient très proches.

**« Pourquoi deux modèles de churn différents ? »**
> Parce que Sellio a deux secteurs. J’ai testé le modèle général sur les clients de mode : AUC 0,787, correct. Un modèle entraîné sur la mode fait 0,799 et est plus précis. Le système choisit automatiquement le bon modèle selon le type de boutique.

**« Pourquoi K-Means ? Comment avez-vous choisi K ? »**
> K-Means est simple, rapide, stable, et ses groupes s’expliquent facilement par leur centre. J’ai testé K de 3 à 6 et gardé celui qui maximise le score de silhouette : K = 3. J’ai exclu K = 2 car il ne sépare que « dormants » et « actifs », trop grossier pour agir.

**« Pourquoi un modèle hybride de recommandation ? »**
> Chaque approche a un défaut : la popularité ne personnalise pas, le contenu ignore les goûts réels, le collaboratif ne sait rien d’un produit neuf. L’hybride combine les trois, et les proportions s’adaptent automatiquement à chaque boutique. Sur les trois jeux, il bat chaque approche prise seule.

### Sur les métriques

**« C’est quoi l’AUC ? »**
> C’est la probabilité que le modèle donne un score de risque plus élevé à un client qui part vraiment qu’à un client qui reste, si on les tire au hasard. 0,5 = hasard, 1 = parfait. Nos modèles sont à 0,80.

**« 0,80, ce n’est pas un peu faible ? »**
> C’est un bon score pour du comportement humain avec seulement 6 variables. La baseline de bon sens fait 0,74–0,76. Un score proche de 1 aurait été suspect, signe probable d’une fuite de données.

**« Pourquoi ne pas utiliser seulement l’accuracy ? »**
> Parce qu’elle trompe quand les classes sont déséquilibrées : un modèle qui dirait toujours « le client reste » aurait une bonne accuracy sans rien détecter. L’AUC, la précision et le rappel sont plus informatifs.

**« Vos scores de recommandation sont bas, non ? »**
> Deviner exactement quel produit, parmi des milliers, un client va acheter est très difficile. Sur le jeu H&M, les meilleures équipes mondiales de la compétition Kaggle atteignaient un score d’environ 0,036. Ce qui compte, c’est de battre la baseline — ce qu’on fait sur les trois jeux — et de recommander un catalogue beaucoup plus varié.

**« Qu’est-ce que le NDCG ? »**
> Une mesure de qualité d’une liste classée qui donne plus de points quand les bons produits sont en haut de la liste, là où le client regarde.

### Sur la production et l’éthique

**« Comment le modèle est-il mis à jour ? »**
> Automatiquement chaque nuit pour chaque boutique, ou à la demande depuis le backoffice. Chaque entraînement est enregistré avec ses réglages et ses scores.

**« Et la vie privée des visiteurs ? »**
> Les visiteurs anonymes ont un identifiant aléatoire, sans nom ni e-mail. Avant une mise en production, il faudra ajouter un bandeau de consentement et une politique de confidentialité, conformément à la loi tunisienne n° 2004-63 et au RGPD pour les visiteurs européens. C’est listé dans les limites du projet.

**« Quelles sont les limites de votre travail ? »**
> Les jeux publics viennent d’autres pays et d’autres époques ; les tests de recommandation tombent en période de fêtes ; la période H&M couvre le confinement de 2020 ; le churn n’utilise que des variables d’achat. D’où le ré-entraînement par boutique, et les pistes : tests A/B en production, images produit pour la mode, variables de fidélité et d’avis.

**« Que feriez-vous avec plus de temps ? »**
> Mesurer l’effet réel des recommandations par un test A/B, ajouter les images des produits (très utiles pour la mode), enrichir le churn avec les connexions, avis et coupons, et tester des modèles de séquences quand le volume de données le permettra.

---

## 27. Les pièges à éviter à l’oral

| ❌ Ne pas dire | ✅ Dire plutôt |
|---|---|
| « Mon modèle est précis à 80 % » | « Mon modèle a une AUC de 0,80 » (l’AUC n’est pas un pourcentage de bonnes réponses) |
| « L’IA a décidé que… » | « Le modèle estime une probabilité de… » |
| « J’ai utilisé le meilleur modèle » | « J’ai comparé plusieurs modèles sur une période de validation et gardé le meilleur » |
| « Mon modèle ne se trompe jamais » | « Il détecte 85 % des départs, avec des fausses alertes » |
| Cacher que la popularité gagnait au début | Le raconter : c’est la preuve d’une démarche rigoureuse |
| « Le deep learning aurait été mieux » | « Sur des données tabulaires, les arbres sont généralement meilleurs, et je l’ai vérifié » |
| Inventer un chiffre | « Je n’ai pas ce chiffre en tête, il est dans le rapport d’évaluation » |

**Conseil** : si tu ne sais pas, dis-le simplement et explique **comment tu le vérifierais**. Un jury apprécie beaucoup plus l’honnêteté et la méthode qu’une réponse inventée.

---

## 28. Glossaire

| Terme | Définition simple |
|---|---|
| **α (alpha)** | part de popularité dans les recommandations (0 = personnalisé pur, 1 = best-sellers purs) |
| **λ (lambda)** | réglage du mélange collaboratif / contenu : plus il est grand, plus on s’appuie sur le contenu |
| **ARI** (Adjusted Rand Index) | ressemblance entre deux regroupements (1 = identiques) |
| **AUC** | probabilité que le modèle classe un vrai « parti » plus haut qu’un vrai « resté » |
| **Baseline** | méthode simple de référence à battre |
| **Centroïde** | centre d’un groupe en K-Means, le « membre moyen » |
| **Churn** | départ d’un client (il ne rachète plus) |
| **Classification** | prédire une catégorie (part / reste) |
| **Clustering** | regrouper sans réponse connue |
| **Cold start** | démarrage à froid : produit ou boutique sans historique |
| **Couverture** | part du catalogue recommandée au moins une fois |
| **Densité** | part des cases remplies dans le tableau clients × produits (0,08 % à 2 % chez nous : presque vide) |
| **Facteurs latents** | « goûts cachés » découverts automatiquement par la SVD |
| **Feature / variable** | caractéristique décrivant un exemple |
| **Feedback implicite** | ce que l’utilisateur fait (vues, achats), par opposition aux notes |
| **Fuite de données** | information du futur ou de la réponse glissée dans l’entraînement → scores faussement bons |
| **Gradient Boosting** | arbres construits l’un après l’autre, chacun corrigeant le précédent |
| **HitRate@10** | part des clients avec au moins un bon produit dans leurs 10 recommandations |
| **Hyper-paramètre** | réglage choisi par nous (profondeur, K, λ, α…) |
| **Label / cible** | la réponse à prédire |
| **Lift** | combien A rend B plus probable dans un panier (> 1 = lien réel) |
| **NDCG** | qualité d’une liste classée, qui récompense les bons résultats placés en haut |
| **Overfitting** | sur-apprentissage : apprendre par cœur, mal généraliser |
| **Précision** | quand le modèle alerte, a-t-il raison ? |
| **Random Forest** | vote de centaines d’arbres différents |
| **Rappel** | parmi les vrais cas, combien le modèle en trouve |
| **Régression logistique** | somme pondérée des variables transformée en probabilité |
| **ROC** | courbe « détections vs fausses alertes » pour tous les seuils |
| **Seuil** | limite qui transforme une probabilité en décision |
| **Silhouette** | qualité d’un regroupement (−1 à 1) |
| **Standardisation** | ramener chaque variable à moyenne 0 et écart-type 1 |
| **SVD** | technique qui résume un grand tableau en quelques facteurs cachés |
| **TF-IDF** | poids d’un mot : fréquent dans ce texte, rare ailleurs = important |
| **Validation temporelle** | entraîner sur le passé, tester sur le futur |
| **Winsorisation** | plafonner les valeurs extrêmes |
