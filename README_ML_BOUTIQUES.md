# Le Machine Learning de Sellio, boutique par boutique

Ce document explique comment l’intelligence de Sellio fonctionne pour **chaque boutique**, quel que soit son secteur (mode, beauté, sport, high-tech, maison, épicerie, bijoux, enfants) : ce qui est appris, à partir de quelles données, quand, et ce qui se passe pour une boutique qui vient d’ouvrir.

Documents complémentaires : `README_ML.md` (détail technique et résultats) et `COURS_ML_DEBUTANT.md` (les notions expliquées depuis zéro).

---

## 1. Réponses courtes

| Question | Réponse |
|---|---|
| Le ML marche-t-il pour les nouveaux secteurs ? | **Oui.** La recommandation et la segmentation apprennent sur les données de chaque boutique, quel que soit son secteur. La prédiction de l’attrition utilise un modèle déjà entraîné : le modèle « mode » pour la mode, le sport et les enfants, et le modèle « général » pour les autres secteurs. |
| Faut-il d’autres jeux de données ? | **Pas pour faire fonctionner la plateforme.** Ils seraient utiles pour **valider** l’attrition sur les secteurs high-tech, épicerie et bijoux, que nos deux jeux actuels ne couvrent qu’indirectement (voir § 8). |
| La recommandation est-elle hybride ? | **Oui.** Elle combine quatre sources : le filtrage collaboratif (ML, factorisation SVD), la similarité de contenu (TF-IDF sur les fiches produit), la popularité et des règles d’association pour « souvent achetés ensemble ». Le dosage entre ces sources est réglé automatiquement pour chaque boutique. |
| À quoi sert l’analyse comportementale ? | À montrer au commerçant **ce que font ses visiteurs** (où ils décrochent, ce qu’ils cherchent sans le trouver, quels groupes de visiteurs il a) et à alimenter les recommandations et la détection des clients sur le départ (voir § 6). |

---

## 2. Le principe : une boutique = ses propres modèles

Sellio héberge plusieurs boutiques, mais **aucune donnée n’est mélangée** :

- chaque événement de navigation porte l’identifiant de sa boutique ;
- l’entraînement est lancé **boutique par boutique**, avec uniquement les données de cette boutique ;
- les résultats (voisins de chaque produit, segments de visiteurs) sont rangés par boutique ;
- un commerçant ne peut lire que les analyses de sa propre boutique (contrôle côté serveur).

Conséquence directe : une boutique de sport apprend sur ses propres clients sportifs, une épicerie sur ses propres gourmets. Un modèle de recommandation entraîné sur la mode n’est jamais appliqué à une épicerie. C’est pour cela que les nouveaux secteurs fonctionnent sans jeu de données supplémentaire.

---

## 3. Le parcours des données, de la vitrine au modèle

```
Vitrine du client                      analytics-service                    Python (scikit-learn)
──────────────────                     ─────────────────                    ─────────────────────
vue produit, recherche,   ──lots──▶   table user_events      ──chaque──▶   recommandation hybride
ajout panier, achat…                  (par boutique,           nuit         segmentation K-Means
                                       partitionnée par mois)  3 h 40
commandes payées          ─────────▶  (vérité terrain des achats)
                                                │
                                                ▼
                          product_recommendations, behavior_segments, ml_model_runs
                                                │
              ┌─────────────────────────────────┼──────────────────────────────┐
              ▼                                 ▼                              ▼
   Vitrine : « Vous aimerez aussi »,   Backoffice : page             Backoffice : risque
   « Pour vous », « Souvent achetés    « Comportement & IA »         d’attrition dans Clients
   ensemble », « Populaires »
```

1. **Collecte.** La vitrine envoie des événements : page vue, catégorie vue, produit vu, clic, recherche, clic sur un résultat de recherche, ajout et retrait du panier, favori, début de commande, achat et clic sur une recommandation. Le visiteur est identifié par un identifiant **anonyme**, remplacé par son compte s’il est connecté.
2. **Stockage.** La table `user_events` est découpée par mois. Les données de plus de 13 mois sont supprimées.
3. **Entraînement.** Chaque nuit à 3 h 40 (ou quand le commerçant clique sur « Ré-entraîner »), le service prend les données de **chaque boutique** et appelle les scripts Python. Les commandes payées sont ajoutées comme achats, y compris celles passées avant la mise en place du suivi.
4. **Service.** Les recommandations sont pré-calculées : les afficher revient à lire une table, sans calcul au moment où le client navigue.

---

## 4. Ce qui est appris par boutique, et ce qui est pré-entraîné

| Brique | Type d’apprentissage | Entraînée sur | Quand | Quantité minimale |
|---|---|---|---|---|
| Recommandation | Non supervisé (SVD) + contenu + statistiques | Les données **de la boutique** (180 derniers jours d’événements + commandes) | Chaque nuit / à la demande | 2 produits actifs |
| Segmentation des visiteurs | Non supervisé (K-Means) | Les visiteurs **de la boutique** (90 derniers jours) | Chaque nuit / à la demande | 8 visiteurs |
| Prédiction de l’attrition | Supervisé (forêt aléatoire / gradient boosting) | Jeux publics réels (Online Retail II, H&M) | Hors ligne, une fois | 1 commande par client à scorer |

Pourquoi l’attrition est-elle pré-entraînée ? Un modèle supervisé a besoin d’**exemples dont on connaît la fin** : des clients observés pendant des mois, dont on sait s’ils sont revenus ou non. Une boutique qui ouvre n’a pas cet historique. Nous partons donc de modèles appris sur de vraies boutiques, avec un protocole temporel et une comparaison à une règle simple (voir `README_ML.md`).

---

## 5. La recommandation : hybride, et comment

### 5.1 Les quatre ingrédients

| Ingrédient | Nature | Ce qu’il apporte | Sa limite |
|---|---|---|---|
| **Filtrage collaboratif** (SVD tronquée) | **Machine Learning** non supervisé : on factorise la matrice visiteurs × produits pour trouver des « goûts » cachés | Découvre des associations réelles : « ceux qui regardent ces chaussures de trail regardent aussi ce sac d’hydratation » | Inutile pour un produit que personne n’a encore vu |
| **Similarité de contenu** (TF-IDF) | Représentation statistique du texte des fiches : nom, catégorie, attributs du secteur | Marche dès le premier jour, même pour un produit neuf | Recommande des produits très ressemblants, sans tenir compte des goûts réels |
| **Popularité** | Statistique : ce qui se vend et se consulte le plus | Très forte quand les achats se concentrent (best-sellers, consommables) | Identique pour tout le monde |
| **Règles d’association** (lift) | Fouille de données sur les paniers | « Souvent achetés ensemble » dans le panier | Il faut des paniers de plusieurs produits |

### 5.2 Comment ils sont mélangés

1. **Signal pondéré.** Chaque action vaut plus ou moins selon l’intérêt qu’elle montre : vue = 1, clic depuis une recherche = 1,5, favori = 3, panier et début de commande = 4, achat = 8. Une action perd la moitié de son poids tous les 30 jours.
2. **Similarité entre deux produits** = β × collaboratif + (1 − β) × contenu, avec β = n / (n + λ), où *n* est le nombre d’interactions du produit le moins connu des deux. Un produit très consulté est recommandé d’après les **comportements** ; un produit neuf, d’après sa **fiche**.
3. **Score pour un visiteur** = (1 − α) × goûts personnels + α × popularité.
4. **Réglage automatique de λ et α pour chaque boutique.** Pour chaque visiteur, on cache son dernier produit mis au panier ou acheté, et on retient les valeurs qui le retrouvent le mieux (NDCG@10). Sans au moins 30 cas de test, les valeurs par défaut s’appliquent (α = 0,4).

C’est ce réglage qui rend la recommandation **adaptée à chaque secteur sans le coder** : une épicerie où tout le monde rachète la même huile d’olive obtiendra un α élevé (beaucoup de popularité) ; une boutique de bijoux où chaque client a son style obtiendra un α plus faible.

### 5.3 Ce que voit le client, et les solutions de repli

| Section de la vitrine | Source | Si la boutique n’a pas encore assez de données |
|---|---|---|
| « Vous aimerez aussi » (fiche produit) | Voisins hybrides du produit | Produits populaires de la même catégorie, puis nouveautés |
| « Pour vous » (accueil) | Historique du visiteur × voisins + popularité | Produits populaires |
| « Souvent achetés ensemble » (panier) | Règles d’association, puis voisins | Voisins du produit |
| « Populaires » | Popularité de la boutique | Nouveautés |

Les produits déjà mis au panier ou achetés par le visiteur ne lui sont pas re-proposés dans « Pour vous ».

### 5.4 Ce qui change d’un secteur à l’autre

L’algorithme est le même partout. La seule différence est le **texte de contenu**, qui reprend les champs propres à chaque secteur :

| Secteur | Champs utilisés par la similarité de contenu |
|---|---|
| Mode | tissu, couleur, coupe, genre, saison |
| Beauté | nom latin/INCI, origine |
| Sport | discipline, niveau, matière, technologies, genre, couleur |
| High-tech | marque, modèle, connectivité, compatibilité, couleur |
| Maison | matériau, pièce, style, dimensions, couleur |
| Épicerie | origine, labels, allergènes, conservation, ingrédients |
| Bijoux | matière, pierre, finition, genre |
| Enfants | âge conseillé, matière, normes, compétences |

Plus un commerçant remplit ces champs, meilleure est la recommandation pour ses produits neufs.

---

## 6. L’analyse comportementale : son but

Le but est de **transformer les clics anonymes en décisions pour le commerçant**. Concrètement, la page « Comportement & IA » répond à ces questions :

| Question du commerçant | Ce que Sellio montre |
|---|---|
| Où mes visiteurs décrochent-ils ? | L’**entonnoir** : visites → produits vus → ajouts au panier → commandes, avec le taux à chaque étape |
| Qu’est-ce qui intéresse mes visiteurs ? | Les produits les plus consultés, l’activité par jour et par heure |
| Que cherchent-ils sans le trouver ? | Les recherches les plus fréquentes et celles **sans résultat** (produits à ajouter au catalogue) |
| Qui sont mes visiteurs ? | Les **segments** trouvés par K-Means, avec une action conseillée pour chacun |
| Qui risque de ne plus revenir ? | Le **risque d’attrition** de chaque client (élevé / moyen / faible), dans « Clients » |

Ces mêmes événements servent aussi à **personnaliser la vitrine** (recommandations, § 5). L’analyse comportementale est donc à la fois un tableau de bord pour le commerçant et la matière première de l’IA.

### Comment la segmentation trouve les groupes

Chaque visiteur des 90 derniers jours est décrit par 9 chiffres :
- nombre de visites, actions par visite, produits vus ;
- part des recherches, taux d’ajout au panier, taux d’achat après ajout, taux de favoris ;
- jours depuis la dernière visite, nombre de jours actifs.

K-Means regroupe les visiteurs qui se ressemblent. Avant cela :
- les compteurs passent au logarithme et sont standardisés ;
- les valeurs extrêmes sont plafonnées (sinon un seul « super-visiteur » forme un groupe à lui seul) ;
- le nombre de groupes (3 à 6) est choisi automatiquement par le score de silhouette.

Chaque groupe reçoit un nom et une action : visiteurs occasionnels, acheteurs décidés, explorateurs, abandonnistes de panier, chercheurs ciblés, visiteurs dormants ou clients fidèles. **Les groupes sont trouvés dans les données de chaque boutique** : une boutique de sport et une épicerie n’auront pas forcément les mêmes.

---

## 7. La prédiction de l’attrition, secteur par secteur

Un client est considéré comme **perdu** s’il ne commande pas dans les **90 jours**. Le score se calcule à partir de son historique dans la boutique : ancienneté, nombre de commandes, montant dépensé, panier moyen, fréquence d’achat et jours depuis la dernière commande. L’âge est utilisé par le modèle mode s’il est connu, sinon une valeur par défaut. L’âge n’améliore presque rien, voir `README_ML.md`.

| Secteur | Modèle utilisé | Entraîné sur | Pourquoi ce choix | Niveau de confiance |
|---|---|---|---|---|
| Mode | Gradient boosting « mode » | H&M (AUC 0,799 au test) | Même secteur | **Élevé** : validé sur ce secteur |
| Sport | Gradient boosting « mode » | H&M | H&M inclut une ligne sport ; achats saisonniers et tailles comme la mode | **Moyen** : proche mais non validé à part |
| Enfants | Gradient boosting « mode » | H&M | H&M inclut une ligne enfants/bébé | **Moyen** : même remarque |
| Beauté | Forêt aléatoire « général » | Online Retail II (AUC 0,801 au test) | Petits paniers, rachats fréquents, proche d’un commerce de détail généraliste | **Moyen** |
| Maison & déco | Forêt aléatoire « général » | Online Retail II | Online Retail II vend justement de la déco et des articles cadeaux | **Moyen à élevé** |
| Bijoux | Forêt aléatoire « général » | Online Retail II | Articles cadeaux, achats plus espacés | **À valider** |
| Épicerie | Forêt aléatoire « général » | Online Retail II | Faute de mieux | **À valider** : on rachète une épicerie bien plus souvent que tous les 90 jours |
| High-tech | Forêt aléatoire « général » | Online Retail II | Faute de mieux | **À valider** : un téléphone ne se rachète pas en 90 jours |

Le score est affiché en trois niveaux : **élevé** (30 % des clients les plus à risque), **moyen**, **faible**. Les seuils sont calculés pour chaque modèle. Ce choix est fait automatiquement d’après le secteur de la boutique ; si le commerçant change de secteur, le modèle change aussi.

---

## 8. Faut-il d’autres jeux de données ?

**Pour que la plateforme fonctionne : non.**
- La recommandation et la segmentation n’utilisent pas les jeux publics en production : elles apprennent chaque nuit sur la boutique elle-même. Les jeux publics nous ont seulement servi à **prouver** que la méthode fonctionne sur de vraies données (résultats dans `README_ML.md`).
- L’attrition a déjà un modèle pour chaque boutique (« mode » ou « général »).

**Pour être rigoureux devant un jury : oui pour l’attrition de trois secteurs.** Le modèle « général » est appliqué à l’épicerie, au high-tech et aux bijoux sans avoir été testé sur ces secteurs. Le problème principal n’est pas le modèle mais l’**horizon de 90 jours**, qui ne correspond pas à leur rythme d’achat. Trois jeux publics réels permettraient de le vérifier :

| Jeu de données (public) | Secteurs couverts | Ce qu’il permettrait |
|---|---|---|
| **Olist Brazilian E-Commerce** (Kaggle) | Maison, sport, jouets, montres et bijoux, électronique, beauté — avec catégories et avis | Tester l’attrition et la recommandation **par secteur** sur une même plateforme multi-boutiques, la plus proche de Sellio |
| **eCommerce behavior data from multi category store** (Kaggle, REES46) | Électronique en majorité, plus maison, enfants… | Même format que notre jeu Cosmetics (même producteur) : valider la segmentation et la recommandation sur le high-tech |
| **Instacart Market Basket Analysis** (Kaggle) | Épicerie | Rachats très fréquents : choisir un horizon d’attrition adapté (par exemple 30 jours) et valider « souvent achetés ensemble » |

Avec ces jeux, l’évolution naturelle serait :
1. un **horizon d’attrition par secteur** (court pour l’épicerie, long pour le high-tech) ;
2. un modèle d’attrition par famille de secteurs, validé comme les deux actuels (entraînement T1, choix T2, test T3, comparaison à une règle simple) ;
3. à terme, **ré-entraîner l’attrition sur les données de Sellio** elles-mêmes, dès que les boutiques auront plusieurs mois d’historique. Les vraies données tunisiennes valent mieux que n’importe quel jeu public.

---

## 9. Une boutique qui ouvre : chronologie

| Moment | Ce qui se passe |
|---|---|
| Jour 0 (aucune donnée) | Recommandations = produits populaires de la catégorie, puis nouveautés. Pas encore de segments. Attrition : rien à scorer (aucune commande). |
| Dès 2 produits actifs, première nuit | La similarité de **contenu** fonctionne déjà : « Vous aimerez aussi » propose des produits aux fiches proches (même discipline, même matière…). |
| Dès 8 visiteurs | Premiers segments (peu fiables tant que les visiteurs sont peu nombreux). |
| Premières commandes | Chaque client ayant commandé reçoit un score d’attrition. |
| Quelques centaines d’interactions | Le **collaboratif** prend le relais sur les produits les plus vus ; λ et α commencent à être réglés automatiquement (30 cas de test minimum). |
| Plusieurs mois | Le modèle s’appuie surtout sur les comportements réels de la boutique ; les segments se stabilisent. |

Le commerçant peut aussi générer des **données de démonstration** (visites fictives, supprimables en un clic) pour présenter les fonctionnalités sur une boutique sans trafic.

---

## 10. Ce qu’il faut retenir pour le jury

1. **Isolation** : chaque boutique a ses propres modèles et ne voit que ses propres données.
2. **Recommandation hybride** : collaboratif (ML) + contenu + popularité + règles d’association. Le dosage est appris par boutique, et il existe un repli pour le démarrage à froid.
3. **Analyse comportementale** : elle sert le commerçant (entonnoir, recherches sans résultat, segments, risque d’attrition) et nourrit la personnalisation.
4. **Secteurs** : la recommandation et la segmentation s’adaptent sans nouveau jeu de données ; l’attrition est validée pour la mode et le commerce généraliste, et **à valider** pour l’épicerie, le high-tech et les bijoux (jeux identifiés : Olist, REES46 multi-catégories, Instacart).
5. **Honnêteté des résultats** : chaque modèle a été évalué sur des données réelles, avec un découpage temporel et une comparaison à une règle simple (voir `README_ML.md`).
