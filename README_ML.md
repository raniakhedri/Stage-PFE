# Sellio — Intelligence artificielle & Machine Learning

> Toutes les fonctionnalités ML de la plateforme, les jeux de données utilisés, leur nettoyage, les choix de modèles et leurs résultats.
> Code : `microservices/analytics-service` (Java, port 8085) et `microservices/analytics-service/python` (données et modèles).

---

## Sommaire

1. [Vue d’ensemble](#1-vue-densemble)
2. [Jeux de données et nettoyage](#2-jeux-de-données-et-nettoyage)
3. [Correspondance avec le modèle de données Sellio](#3-correspondance-avec-le-modèle-de-données-sellio)
4. [Architecture](#4-architecture)
5. [Tracking comportemental](#5-tracking-comportemental)
6. [Moteur de recommandation](#6-moteur-de-recommandation)
7. [Analyse des patterns d’interaction](#7-analyse-des-patterns-dinteraction)
8. [Prédiction du churn](#8-prédiction-du-churn)
9. [API](#9-api)
10. [Exécution et reproduction des résultats](#10-exécution-et-reproduction-des-résultats)
11. [Limites et pistes d’amélioration](#11-limites-et-pistes-damélioration)

---

## 1. Vue d’ensemble

| Fonctionnalité | Type | Modèle | Validé sur | Où c’est utilisé |
|---|---|---|---|---|
| **Tracking comportemental** | Collecte + stockage | — (pipeline de données) | — | Vitrine → `user_events` |
| **Moteur de recommandation** | Feedback implicite | **Hybride** : filtrage collaboratif (SVD tronquée) + similarité de contenu (TF-IDF) + part de popularité, **réglés automatiquement par boutique** | Online Retail II · Cosmetics Shop · H&M | « Vous aimerez aussi », « Recommandé pour vous » |
| **Souvent achetés ensemble** | Règles d’association | Lift | Online Retail II | Panier |
| **Segmentation comportementale** | Clustering | **K-Means** (K choisi par silhouette) | Cosmetics Shop | Backoffice → Comportement & IA |
| **Analyse des parcours** | Analytique descriptive | Entonnoir, recherches, heures d’activité | — | Backoffice → Comportement & IA |
| **Prédiction du churn** | Classification supervisée | **Un modèle par secteur** : Random Forest (général) · Gradient Boosting (vêtements) | Online Retail II · H&M | Backoffice → Clients |

Chaque boutique a ses propres modèles : les données d’un marchand ne servent jamais à recommander chez un autre.

---

## 2. Jeux de données et nettoyage

Une boutique qui démarre n’a pas d’historique : les modèles sont **conçus, réglés et évalués sur trois jeux de données publics réels**, qui couvrent les deux secteurs de Sellio, puis ré-entraînés chaque nuit sur les données de chaque boutique.

| Jeu | Source | Secteur | Contenu | Utilisé pour |
|---|---|---|---|---|
| **Online Retail II** | UCI Machine Learning Repository — [archive.ics.uci.edu/dataset/502](https://archive.ics.uci.edu/dataset/502/online+retail+ii) (Chen, 2019), licence CC BY 4.0 | e-commerce généraliste (cadeaux, décoration) | 1 067 371 lignes de factures, déc. 2009 → déc. 2011 | churn (modèle général), recommandation sur achats, « achetés ensemble » |
| **eCommerce Events History in Cosmetics Shop** | Kaggle — [mkechinov/ecommerce-events-history-in-cosmetics-shop](https://www.kaggle.com/datasets/mkechinov/ecommerce-events-history-in-cosmetics-shop) (projet open data REES46) | **cosmétique** | décembre 2019 : 3 533 286 événements view / cart / remove_from_cart / purchase, 370 154 visiteurs | segmentation, recommandation sur navigation |
| **H&M Personalized Fashion Recommendations** | Kaggle — [competitions/h-and-m-personalized-fashion-recommendations](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations) (H&M Group, 2022) | **vêtements** | 31 788 324 achats (sept. 2018 → sept. 2020), 105 542 articles décrits, 1,37 M clients | churn (modèle vêtements), recommandation mode |

Chaque script de nettoyage écrit un rapport JSON (`datasets/clean/*_cleaning_report.json`) avec l’effectif avant/après chaque étape.

### 2.1 Online Retail II — `python/data_prep/clean_online_retail.py`

| Étape | Lignes avant | Lignes après | Supprimées |
|---|---|---|---|
| 1. Doublons exacts (les 2 feuilles Excel se recouvrent en déc. 2010 + doubles saisies) | 1 067 371 | 1 033 036 | 34 335 |
| 2. Annulations (préfixe C) et ajustements comptables (A) | 1 033 036 | 1 013 926 | 19 110 |
| 3. Quantité ≤ 0 ou prix ≤ 0 | 1 013 926 | 1 007 912 | 6 014 |
| 4. Codes non-produits (frais de port, remises, frais bancaires, tests…) | 1 007 912 | 1 003 214 | 4 698 |
| 5. Client inconnu (`Customer ID` vide) | 1 003 214 | 776 577 | 226 637 |
| 6. Description vide ou annotation interne (« damaged », « ? »…) → libellé le plus fréquent du code | 776 577 | 776 098 | 479 |
| 7. Valeurs aberrantes (> 99,9ᵉ centile en quantité ou en prix) | 776 098 | 774 591 | 1 507 |

**Résultat : 774 591 lignes (72,6 %), 36 374 factures, 5 834 clients, 4 593 produits.** Montants convertis en dinars (1 £ ≈ 3,9 TND, taux indicatif).

### 2.2 Cosmetics Shop — `python/data_prep/clean_cosmetics_events.py`

Défauts constatés : 183 860 doublons exacts, 7 537 prix ≤ 0, 714 sessions manquantes, **43 % de marques et 98 % de codes catégorie manquants**.

| Étape | Supprimées | Raison |
|---|---|---|
| Doublons exacts | 183 860 | même événement enregistré plusieurs fois (double clic, rejeu) |
| Prix ≤ 0 | 7 537 | cadeaux, erreurs de catalogue |
| Session manquante | 714 | visite impossible à reconstituer |
| **Robots** (> 500 événements/jour ou > 60/minute) | 78 998 | trafic non humain |
| Prix aberrant pour le produit (> 5× ou < 1/5 de sa médiane) | 696 | erreur ponctuelle de prix |
| Marque / catégorie manquantes | 0 | conservées, marquées « inconnue » |
| Échantillon de 60 000 visiteurs (graine 42) | — | tenir en mémoire |

**Résultat : 525 253 événements, 60 000 visiteurs, 132 343 visites, 33 716 produits.**

### 2.3 H&M — `python/data_prep/clean_hm.py`

| Étape | Lignes avant | Lignes après | Raison |
|---|---|---|---|
| 1. Échantillon de clients (1 client sur 16, tirage déterministe sur l’identifiant) | 31 788 324 | 1 981 580 | tenir en mémoire |
| 2. **Achats en magasin retirés** | 1 981 580 | 1 393 291 | Sellio est 100 % en ligne : seul le canal web est gardé |
| 3. Prix aberrants (> 99,9ᵉ centile) | 1 393 291 | 1 391 897 | erreurs de caisse |
| 4. Lignes identiques **regroupées en quantité** | 1 391 897 | 1 224 099 | plusieurs unités du même article le même jour : ce ne sont pas des doublons à supprimer |

Autres corrections : âge manquant ou hors [16, 99] → médiane (779 clients) ; `fashion_news_frequency` écrit à la fois « None » et « NONE » → harmonisé ; 277 articles sans description → nom de l’article ; prix anonymisés (≈ 0,03) mis à l’échelle pour qu’un article médian coûte ≈ 50 TND (hypothèse). Identifiants de 64 caractères remplacés par des entiers (mémoire ÷ 10).

**Résultat : 1 224 099 achats en ligne, 68 874 clients, 71 735 articles.**

---

## 3. Correspondance avec le modèle de données Sellio

Aucun jeu public n’a exactement les colonnes de Sellio. Chaque jeu est ramené, par un **adaptateur**, au noyau commun dont les modèles ont besoin — *qui, quel produit, quand, quelle action, quel prix, quelle description* — puis chaque modèle n’utilise **que des champs présents à la fois dans les jeux et dans Sellio**, pour pouvoir servir tel quel en production.

| Champ Sellio | Online Retail II | Cosmetics Shop | H&M |
|---|---|---|---|
| Client, produit, date, prix, quantité | ✅ | ✅ | ✅ (date sans heure) |
| Événements vue / panier / retrait panier / achat (`user_events`) | achats seulement | ✅ | achats seulement |
| Visite (`session_id`) | facture | ✅ | — |
| Nom, description du produit | libellé | ❌ (marque + catégorie) | ✅ |
| Âge du client (`dateOfBirth`) | ❌ | ❌ | ✅ |
| Ville, sexe, points fidélité, avis, coupons, connexions | ❌ | ❌ | ❌ |

**Fiche vêtement Sellio remplie à partir des articles H&M** (`hm_products_sellio.csv.gz`) — couleurs traduites vers les couleurs de base Sellio, genre (Ladieswear → Femme, Menswear → Homme, Baby/Children → Enfant…), tissu / coupe / manches / col extraits de la description :

| Champ | nom · description · catégorie · sous-catégorie · genre | couleur | tissu | manches | coupe | col | saison · tailles |
|---|---|---|---|---|---|---|---|
| Rempli | **100 %** | **98 %** | **80 %** | 33 % | 32 % | 26 % | 0 % (absents du jeu) |

Conséquences par modèle :

- **Recommandation** : n’a besoin que du noyau commun → compatible avec les trois jeux.
- **Segmentation** : a besoin de la navigation (vues, paniers) → seul Cosmetics Shop convient ; les comportements mesurés (profondeur de visite, taux de panier, récence…) ne dépendent pas du secteur.
- **Churn** : 6 variables d’achat communes à tous (+ l’âge pour les vêtements). Les variables propres à Sellio (fidélité, avis, coupons, connexions) ne peuvent pas être apprises sur des données publiques ; elles seront ajoutées lorsque les boutiques auront assez de clients pour ré-entraîner sur leurs propres données.

---

## 4. Architecture

```
 Vitrine (React)                          analytics-service (Spring Boot, 8085)                PostgreSQL
 ───────────────                          ─────────────────────────────────────                ──────────
 tracker.js ── lots d’événements ──▶ POST /analytics/events ──▶ TrackingService ──▶ user_events (partitionnée/mois)
   (vues, clics, recherches,             (validation, anti-abus,                      product_stats_daily
    panier, favoris, achats)              id client lu dans le JWT)                   search_stats_daily
                                                                                            │
                                          MlTrainingService  ◀── chaque nuit 3 h 40 ────────┤ + orders / products
                                            │  (ou bouton « Ré-entraîner »)                  │
                                            ▼                                                │
                                          python/ml_train.py  ──▶  recommender/model.py      │
                                            (fichiers JSON)        segmentation/model.py     │
                                            │                                                ▼
                                            └─ résultats ─────────────────────────▶ product_recommendations
                                                                                    behavior_segments, ml_model_runs
 Recommandations  ◀── GET /analytics/recommendations/* ◀── RecommendationService (lecture indexée, aucun Python)
 Backoffice       ◀── GET /analytics/behavior/overview  ◀── BehaviorController
 Churn            ◀── GET /analytics/churn/*            ◀── ChurnPredictionService ──▶ predict.py (modèle du secteur)
```

**Pourquoi entraîner hors ligne et servir depuis la base ?** Le calcul (SVD, TF-IDF, clustering) prend quelques secondes par boutique ; le faire à chaque visite serait lent et coûteux. Les voisins de chaque produit sont pré-calculés la nuit ; une recommandation est ensuite une simple lecture indexée. La personnalisation « pour vous » reste temps réel : elle combine ces voisins avec l’historique **actuel** du visiteur.

---

## 5. Tracking comportemental

### 5.1 Événements collectés

| Événement | Déclencheur (vitrine) | Données |
|---|---|---|
| `VIEW_PRODUCT` | ouverture d’une fiche produit | produit, prix, catégorie |
| `CLICK_PRODUCT` | clic sur une carte produit (hors boutons) | produit |
| `VIEW_CATEGORY` | ouverture d’une catégorie | catégorie |
| `SEARCH` | recherche (après 0,9 s sans frappe) | requête, **nombre de résultats** |
| `SEARCH_CLICK` | clic sur un résultat de recherche | requête, produit |
| `ADD_TO_CART` / `REMOVE_FROM_CART` | panier | produit, quantité, prix |
| `WISHLIST_ADD` | ajout aux favoris | produit |
| `BEGIN_CHECKOUT` | arrivée sur la page de commande | nb d’articles, montant |
| `PURCHASE` | commande validée | produit, quantité, prix (un événement par ligne) |
| `RECOMMENDATION_CLICK` | clic sur une recommandation | produit — mesure l’efficacité du moteur |

Ce vocabulaire reprend celui des jeux publics (view / cart / remove_from_cart / purchase), ce qui permet d’appliquer les mêmes modèles.

### 5.2 Collecte (`Frontend/src/tracking/tracker.js`)

- **Identité** : un `visitorId` anonyme persistant (localStorage) et un `sessionId` renouvelé après **30 min d’inactivité**. Si le client est connecté, le serveur ajoute son `user_id` **à partir du JWT** — jamais depuis le contenu envoyé.
- **Envoi par lots** : toutes les 4 s (ou à 25 événements, ou quand l’onglet est masqué, avec `keepalive`) ; le tracking ne ralentit jamais la page et une erreur réseau ne casse jamais la boutique.
- **Protection** côté serveur : types en liste blanche, identifiants validés, 50 événements max par lot, **240 événements/minute max par visiteur**, horodatage client ignoré s’il s’écarte de plus de 10 min de l’heure serveur.

### 5.3 Stockage optimisé (`EventStore.java`)

| Technique | Pourquoi |
|---|---|
| **Partitionnement mensuel** (`PARTITION BY RANGE (created_at)`) de `user_events` | Les requêtes récentes ne lisent que 1 ou 2 partitions ; supprimer un mois d’historique est un `DROP TABLE` instantané. Partitions créées automatiquement chaque nuit, partition `DEFAULT` en filet de sécurité. |
| **Index BRIN** sur `created_at` | Les événements arrivent dans l’ordre chronologique : un BRIN couvre les scans temporels pour quelques Ko, contre plusieurs Mo pour un B-tree. |
| **Index B-tree ciblés** et **partiels** | `(shop_id, created_at)`, `(shop_id, visitor_id, created_at)`, `(user_id, …) WHERE user_id IS NOT NULL`, `(shop_id, product_id, event_type) WHERE product_id IS NOT NULL`. |
| **Agrégats journaliers** `product_stats_daily`, `search_stats_daily` (`INSERT … ON CONFLICT DO UPDATE`) | Les tableaux de bord lisent quelques centaines de lignes agrégées au lieu de millions d’événements bruts. |
| **Insertion par lots** (`JdbcTemplate.batchUpdate`) dans une transaction | Un aller-retour base par lot. |
| **Rétention** : 13 mois d’événements bruts, agrégats conservés | Maîtrise du volume. |
| Requêtes de recherche **normalisées** (minuscules, sans accents) | « Huile ARGAN » = « huile argan ». |

---

## 6. Moteur de recommandation

### 6.1 Le problème

Recommander à chaque visiteur les produits qu’il a le plus de chances d’aimer, avec un **feedback implicite** uniquement (vues, paniers, achats), des **matrices extrêmement creuses** (densité 2,1 % sur Online Retail II, 0,13 % sur H&M, 0,08 % sur Cosmetics Shop), un **démarrage à froid** permanent et aucune GPU.

### 6.2 Données d’entrée

Matrice **visiteur × produit** où chaque cellule vaut

$$ r_{u,i} = \log\Big(1 + \sum_{e} w(e) \cdot 0{,}5^{\,\text{âge}(e)/30\,\text{j}}\Big) $$

| Événement | Poids *w* |
|---|---|
| Vue / clic | 1 |
| Clic depuis une recherche | 1,5 |
| Favori | 3 |
| Ajout au panier / début de commande | 4 |
| Achat | 8 |

Décroissance temporelle (demi-vie 30 jours), atténuation `log(1+x)` des visiteurs qui rafraîchissent la même page, commandes (`orders`) ajoutées comme achats, visites anonymes et compte client fusionnés.

### 6.3 Modèle retenu

1. **Filtrage collaboratif** — `TruncatedSVD` sur la matrice pondérée par un **IDF produit** (un produit que tout le monde achète est moins informatif) ; 64 facteurs latents (plafonnés pour les petits catalogues) ; similarité cosinus.
2. **Similarité de contenu** — `TfidfVectorizer` (unigrammes + bigrammes, accents retirés) sur le nom, la catégorie (×3), les attributs (tissu, couleur, coupe, genre, saison, INCI, origine) et la description.
3. **Mélange adaptatif** — $\text{sim}(i,j) = \beta_{ij}\,\text{sim}_{CF} + (1-\beta_{ij})\,\text{sim}_{\text{contenu}}$ avec $\beta_{ij} = n_{ij}/(n_{ij}+\lambda)$ ($n_{ij}$ : plus petit nombre de clients ayant interagi avec *i* ou *j*). Un produit neuf est recommandé **à 100 % sur son contenu**.
4. **Part de popularité** — score final $= (1-\alpha)\cdot\text{personnel} + \alpha\cdot\text{popularité}$, les deux ramenés à [0, 1]. Ajoutée après l’évaluation sur Cosmetics Shop, où la popularité seule battait tous les modèles personnalisés (voir 6.6) : sur des données réelles, les best-sellers portent beaucoup de signal (pics saisonniers, produits consommables).
5. **Réglage automatique par boutique** — à chaque entraînement, le dernier produit fort (panier/achat) de chaque client est caché ; λ ∈ {10, 30, 100, 300, 1 000} puis α ∈ {0 ; 0,2 ; 0,4 ; 0,6 ; 0,8} sont retenus selon le NDCG@10 (au moins 30 cas, sinon λ = 10 et α = 0,4). Nécessaire parce que les meilleurs réglages varient fortement d’un jeu à l’autre (λ de 10 à 1 000, α de 0,4 à 0,8 — tableau 6.6). Le choix et les scores sont journalisés dans `ml_model_runs`.

**Au moment de servir**, le score personnel d’un produit candidat est $\sum_{i \in \text{historique}} w(i)\cdot 0{,}5^{\,\text{âge}/7\,\text{j}} \cdot \text{sim}(i,c)$ (filtrage *item-based*), mélangé à la popularité avec le α de la boutique ; les produits déjà au panier ou achetés sont exclus. **Repli garanti** : modèle → popularité récente → nouveautés (champ `strategy` de la réponse).

**« Souvent achetés ensemble »** — règles d’association sur les paniers (achats d’une même visite, et commandes antérieures au tracking) : A → B retenue si vue au moins 2 fois avec un **lift** $P(B\mid A)/P(B) > 1$, classement par lift.

### 6.4 Pourquoi ce modèle ? Alternatives écartées

| Alternative | Pourquoi écartée |
|---|---|
| **Popularité seule** | Même liste pour tous (0,3 à 1,8 % du catalogue recommandé). Conservée comme repli, comme **baseline** et comme composante du mélange. |
| **kNN utilisateur-utilisateur** | Instable avec des visiteurs majoritairement anonymes et peu actifs ; l’approche produit-produit se pré-calcule. |
| **ALS implicite** (`implicit`) | Extension C/Cython à compiler (fragile sous Windows), sans gain attendu à cette échelle ; la SVD tronquée donne des facteurs comparables avec scikit-learn. |
| **LightFM** | Idée proche, mais projet peu maintenu et roues Python récentes indisponibles. |
| **Réseaux de neurones** (NCF, séquences) | Beaucoup plus de données et un GPU nécessaires ; difficiles à expliquer dans un tableau de bord. |
| **Contenu seul / collaboratif seul** | Chacun est battu par le mélange sur les trois jeux (6.6). |

### 6.5 Protocole d’évaluation

Même question sur les trois jeux : **« quels NOUVEAUX produits ce client va-t-il acheter (ou mettre au panier) dans la période suivante ? »** — les produits déjà achetés ou vus ne comptent pas. Validation **temporelle** : les réglages (facteurs, λ, α) sont choisis sur une période de validation, les chiffres sont rapportés **une seule fois** sur une période de test postérieure.

| Jeu | Validation | Test | Catalogue évalué | Cas de test |
|---|---|---|---|---|
| Online Retail II | historique < 01/06/2011, cible 90 j | historique < 10/09/2011, cible 10/09 → 09/12 | 3 541 produits (≥ 10 acheteurs) | 1 500 clients |
| Cosmetics Shop | historique < 10/12/2019, cible 7 j | historique < 17/12/2019, cible 14 derniers jours | 5 000 produits (≥ 5 visiteurs) | 1 373 visiteurs |
| H&M | historique 6 mois < 25/08/2020, cible 14 j | historique 6 mois < 08/09/2020, cible 08/09 → 22/09 | 5 000 articles (≥ 10 acheteurs) | 2 000 clients |

Métriques : **HitRate@10** (au moins un bon produit dans le top 10), **NDCG@10** (récompense un bon rang), **couverture** (part du catalogue recommandée au moins une fois).

### 6.6 Résultats (périodes de test)

| Modèle | Online Retail II<br>HR@10 · NDCG@10 · couverture | Cosmetics Shop<br>HR@10 · NDCG@10 · couverture | H&M (vêtements)<br>HR@10 · NDCG@10 · couverture |
|---|---|---|---|
| Popularité (baseline) | 0,308 · 0,052 · 1,8 % | 0,159 · 0,044 · 0,4 % | 0,053 · 0,015 · 0,3 % |
| Contenu seul | 0,259 · 0,044 · 47 % | 0,069 · 0,019 · 78 % | 0,038 · 0,014 · 74 % |
| Collaboratif seul | 0,240 · 0,044 · 27 % | 0,084 · 0,020 · 79 % | 0,020 · 0,008 · 81 % |
| Hybride sans popularité | 0,337 · 0,062 · 38 % | 0,079 · 0,022 · 74 % | 0,039 · 0,015 · 75 % |
| **Hybride + popularité (retenu)** | **0,357 · 0,069 · 22 %** | **0,178 · 0,052 · 28 %** | **0,059 · 0,022 · 61 %** |
| Réglages choisis en validation | 128 facteurs, λ = 1 000, α = 0,4 | λ = 10, α = 0,8 | 128 facteurs, λ = 100, α = 0,4 |
| **Gain du modèle retenu sur la popularité** | **HR +16 %, NDCG +34 %** | **HR +12 %, NDCG +17 %** | **HR +10 %, NDCG +41 %** |

Lecture :

- **Le modèle retenu bat la popularité sur les trois jeux**, tout en recommandant 12 à 200 fois plus de produits différents (la popularité montre les mêmes quelques articles à tout le monde).
- Les gains sont **modestes**, ce qui est attendu sur des données réelles : Online Retail II et Cosmetics Shop sont testés en période de fêtes (best-sellers saisonniers), et H&M propose des dizaines de milliers d’articles pour très peu d’achats par client.
- **Sans la part de popularité, l’hybride perdait contre la popularité sur Cosmetics Shop et H&M** : c’est cette évaluation qui a conduit à ajouter α et à le régler par boutique.
- Les valeurs absolues sur H&M sont faibles (≈ 6 % de clients avec au moins un bon article sur 5 000) : c’est l’ordre de grandeur de la compétition Kaggle H&M elle-même, où les meilleures équipes atteignaient un MAP@12 ≈ 0,036.

**« Souvent achetés ensemble »** (Online Retail II) — règles apprises sur les 29 842 factures avant le 10/09/2011, testées sur les 6 492 suivantes : un article du panier permet de proposer un autre article **de la même facture** dans le top 5 dans **47,1 %** des cas, contre **43,0 %** pour les 5 produits les plus vendus. Gain faible mais réel ; 90 % des articles disposent d’au moins une règle.

---

## 7. Analyse des patterns d’interaction

### 7.1 Analytique descriptive (page « Comportement & IA »)

| Indicateur | Calcul | Question métier |
|---|---|---|
| **Entonnoir de conversion** | part des visites atteignant chaque étape : produit consulté → panier → commande commencée → achat | Où perd-on les visiteurs ? |
| Taux d’ajout au panier, de conversion, **d’abandon de panier** | à partir de l’entonnoir | Le catalogue convainc-il ? Le tunnel de commande freine-t-il ? |
| **Recherches fréquentes** et taux de clic | `search_stats_daily` | Que cherchent les clients ? |
| **Recherches sans résultat** | recherches avec `resultsCount = 0` | **Ce qui manque au catalogue** |
| **Heures d’activité** | événements par heure (heure de Tunis) | Quand publier, lancer une promo, envoyer une newsletter |
| Produits les plus consultés et **taux vue → panier** | `product_stats_daily` | Produits vus mais peu ajoutés = prix, photos ou description à revoir |
| Clics sur recommandations | `RECOMMENDATION_CLICK` | Efficacité réelle du moteur |

### 7.2 Segmentation comportementale — K-Means

Chaque visiteur est décrit sur les 90 derniers jours par 9 variables : nombre de visites, profondeur de visite, produits consultés, part de recherches, taux d’ajout au panier, taux d’achat par panier, taux de favoris, récence, jours actifs. Prétraitement : `log(1+x)` sur les comptages → standardisation → **winsorisation à ±3σ** (sinon K-Means consacre un cluster à quelques visiteurs extrêmes). K ∈ {3…6}, choisi par **silhouette** ; K = 2 est exclu (sépare seulement « dormants » et « les autres »). Chaque cluster reçoit un nom et une action marketing à partir de son centroïde.

**Pourquoi K-Means ?**

| Alternative | Pourquoi écartée |
|---|---|
| **RFM** par règles | Ne voit que les acheteurs ; ignore la navigation et les paniers abandonnés ; seuils arbitraires. |
| **DBSCAN / HDBSCAN** | Nombre de segments non maîtrisable, sensible à ε en dimension 9, beaucoup de visiteurs classés « bruit ». |
| **Mélange gaussien** | Plus instable sur de petits effectifs ; des probabilités d’appartenance n’aident pas un marchand qui veut des groupes nets. |
| **Hiérarchique** | Coût mémoire O(n²) sur des milliers de visiteurs. |

**Validation sur navigation réelle (Cosmetics Shop, 60 000 visiteurs, décembre 2019)** — sur des données réelles il n’y a pas de « vrais » segments à retrouver ; on mesure la qualité interne et la **stabilité** (le modèle est ré-entraîné sur 5 sous-échantillons de 80 % et les partitions sont comparées) :

| Métrique | Valeur | Lecture |
|---|---|---|
| K retenu | **3** | silhouette : K=3 **0,468** · K=4 0,385 · K=5 0,408 · K=6 0,418 |
| Silhouette | 0,468 | structure nette (> 0,25 considéré comme raisonnable) |
| Davies-Bouldin | 1,26 | clusters séparés (plus bas = mieux) |
| **Stabilité** (ARI moyen, 5 ré-échantillonnages) | **0,951** (min 0,946) | les segments sont reproductibles, pas un effet du hasard |

| Segment trouvé | Visiteurs | Profil moyen | Action suggérée |
|---|---|---|---|
| Visiteurs occasionnels | 45 694 (76 %) | 1,1 visite, 1,4 produit vu, pas d’achat | capter l’e-mail (newsletter, 1ʳᵉ commande) |
| Acheteurs décidés | 7 615 (13 %) | 15 actions par visite, beaucoup d’ajouts au panier, 25 % d’achat par panier | nouveautés, réassort |
| Explorateurs | 6 691 (11 %) | 5,6 visites, 22 produits vus, 4 jours actifs | recommandations, contenus inspirants |

Trois segments seulement, et un segment majoritaire de visiteurs « de passage » : c’est la réalité d’un site e-commerce sur un mois (la plupart des visiteurs ne reviennent pas). La recherche interne n’existant pas dans ce jeu, la variable « part de recherches » n’a pas pu jouer ; sur une boutique Sellio elle est collectée et peut faire apparaître un segment « chercheurs ciblés ».

---

## 8. Prédiction du churn

**Tâche** : probabilité qu’un client ayant déjà acheté **ne passe aucune commande dans les 90 jours suivants**.

**Un modèle par secteur** : `ChurnPredictionService` détermine l’activité de la boutique du client ; les boutiques de **vêtements** utilisent le modèle appris sur H&M, les autres (cosmétique…) le modèle général appris sur Online Retail II. Chaque modèle a ses propres bandes de risque (FAIBLE / MOYEN / ÉLEVÉ).

**Variables** — calculées de la même façon dans les scripts et dans `FeatureExtractionService` : ancienneté, nombre de commandes, montant total (TND), panier moyen, commandes par mois d’ancienneté, jours depuis la dernière commande (+ âge pour les vêtements).

**Protocole temporel** — les clients sont photographiés à trois dates ; les variables n’utilisent que l’historique **antérieur** à la date, le label est l’absence d’achat dans les 90 jours suivants. Modèles candidats (régression logistique, Random Forest ×6 réglages, Gradient Boosting ×2) entraînés sur T1, choisis sur T2 ; le modèle retenu est ré-entraîné sur T1 + T2 et testé une seule fois sur T3.

| | Online Retail II (général) | H&M (vêtements, canal web) |
|---|---|---|
| T1 · T2 · T3 | 01/03 · 01/06 · 10/09/2011 | 24/12/2019 · 24/03 · 24/06/2020 |
| Clients (T3) · taux de churn | 5 239 · 56,5 % | 64 871 · 73,1 % |
| Modèle retenu en validation | Random Forest (profondeur 6) | Gradient Boosting (taux 0,05) |

**Résultats sur T3 (jamais vu pendant l’entraînement ni le réglage)** :

| Modèle | ROC-AUC | PR-AUC | Accuracy | Précision churn | Rappel churn |
|---|---|---|---|---|---|
| *Online Retail II* — baseline récence | 0,762 | 0,799 | 0,608 | 0,844 | 0,375 |
| *Online Retail II* — régression logistique | 0,791 | 0,812 | 0,728 | 0,737 | 0,804 |
| ***Online Retail II* — Random Forest (retenu)** | **0,801** | **0,820** | **0,735** | 0,728 | **0,849** |
| *H&M* — baseline récence | 0,738 | 0,875 | 0,501 | 0,915 | 0,349 |
| *H&M* — modèle Online Retail appliqué tel quel | 0,787 | 0,891 | 0,786 | 0,831 | 0,887 |
| *H&M* — modèle vêtements sans l’âge | 0,799 | 0,897 | 0,725 | 0,878 | 0,724 |
| ***H&M* — modèle vêtements (retenu)** | **0,799** | **0,899** | 0,722 | **0,880** | 0,718 |

Lecture :

- Les deux modèles atteignent **ROC-AUC ≈ 0,80**, nettement au-dessus de la règle de récence (0,74–0,76) sans être irréalistes.
- **Le modèle général se transfère bien à la mode** (0,787 sur H&M sans ré-entraînement) : le comportement d’achat qui précède un départ est largement commun aux secteurs. Le modèle dédié fait un peu mieux (0,799) et est plus précis ; le modèle général détecte plus de départs mais avec plus de fausses alertes.
- **L’âge n’apporte presque rien** (0,7988 → 0,7993) : le churn est porté par le comportement d’achat (importance par permutation : nombre de commandes 0,137, jours depuis la dernière commande 0,060, âge 0,003).
- En validation, tous les candidats H&M sont à moins de 0,01 d’AUC les uns des autres (0,767 à 0,775) : avec 6 à 7 variables, le choix de l’algorithme compte peu — ce sont les variables qui limitent la performance.
- Bandes de risque : général ÉLEVÉ > 0,76, MOYEN > 0,57 ; vêtements ÉLEVÉ > 0,72, MOYEN > 0,50 (70ᵉ et 40ᵉ centiles des probabilités de test).
- L’ancien modèle (17 variables, données simulées) est archivé dans `python/models/legacy_synthetic/`.

---

## 9. API

Via la gateway `http://localhost:8080/api/v1`.

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/analytics/events` | public | collecte d’un lot `{shop, visitorId, sessionId, events[]}` |
| GET | `/analytics/recommendations/similar?shop&productId&limit` | public | produits similaires |
| GET | `/analytics/recommendations/for-you?shop&visitorId&limit` | public (JWT optionnel) | personnalisé (mélange avec popularité) |
| GET | `/analytics/recommendations/bought-together?shop&ids=1,2&limit` | public | règles d’association |
| GET | `/analytics/recommendations/popular?shop&limit` | public | popularité |
| GET | `/analytics/behavior/overview?shop&days` | marchand (sa boutique) / admin Sellio | tableau de bord |
| POST | `/analytics/behavior/train?shop` | marchand / admin Sellio | ré-entraînement immédiat |
| POST / DELETE | `/analytics/behavior/demo-data?shop[&visitors]` | marchand / admin Sellio | données de démonstration (voir §10) |
| GET | `/analytics/churn/{userId}` · `/analytics/churn/batch` | marchand / admin | churn (réponse : probabilité, risque, `model` utilisé) |

Un marchand ne peut lire que **sa** boutique (403 sinon) ; l’administrateur Sellio les lit toutes.

---

## 10. Exécution et reproduction des résultats

```bash
cd microservices/analytics-service
pip install -r python/requirements.txt openpyxl pyarrow

# Données brutes dans python/datasets/raw/ (non versionnées) :
#   online_retail_II.xlsx      ← https://archive.ics.uci.edu/static/public/502/online+retail+ii.zip
#   cosmetics/2019-Dec.csv     ← Kaggle, Cosmetics Shop
#   hm/transactions_train, articles, customers (.parquet ou .csv) ← Kaggle, H&M

python python/data_prep/clean_online_retail.py
python python/data_prep/clean_cosmetics_events.py --max-users 60000
python python/data_prep/clean_hm.py

python python/train_churn_real.py              # churn général   → models/churn_model.pkl, metrics.json
python python/evaluate_recommender_real.py     # Online Retail II → models/recommender_real_metrics.json
python python/evaluate_cosmetics.py            # Cosmetics Shop   → models/cosmetics_metrics.json
python python/evaluate_hm.py                   # H&M              → models/hm_metrics.json, churn_model_clothes.pkl

mvn spring-boot:run                            # service (crée tables, index et partitions)
```

- **Production** : ré-entraînement de chaque boutique chaque nuit à **3 h 40** (maintenance des partitions à 3 h 15), ou à la demande (backoffice → *Comportement & IA* → « Ré-entraîner les modèles »). Chaque entraînement est journalisé dans `ml_model_runs` (λ et α choisis, scores).
- **Démonstration** : une boutique neuve n’ayant pas de trafic, le bouton « Générer 200 visiteurs » crée ~60 jours de visites **fictives** (identifiants `demo-`) pour montrer l’interface ; « Supprimer » les retire. Ces données ne servent jamais à l’évaluation des modèles.

| Fichier | Contenu |
|---|---|
| `python/data_prep/clean_*.py` | nettoyage des trois jeux (rapports JSON) et adaptation au modèle Sellio |
| `python/train_churn_real.py` · `python/evaluate_hm.py` | churn général · churn vêtements et recommandation mode |
| `python/evaluate_recommender_real.py` · `python/evaluate_cosmetics.py` | recommandation et « achetés ensemble » · segmentation et recommandation sur navigation |
| `python/recommender/model.py` | modèle hybride, réglage automatique de λ et α, règles d’association |
| `python/segmentation/model.py` | variables comportementales, K-Means, nommage des segments |
| `python/predict.py` | inférence churn (choix du modèle par secteur) |
| `src/.../tracking/` · `src/.../ml/` · `src/.../behavior/` · `src/.../service/ChurnPredictionService.java` | ingestion, entraînement, API, tableau de bord, churn |
| `Frontend/src/tracking/` · `Frontend/backoffice/src/pages/Comportement.jsx` | tracker et recommandations de la vitrine · page « Comportement & IA » |

---

## 11. Limites et pistes d’amélioration

- **Transfert de domaine** : les jeux publics viennent du Royaume-Uni (2009-2011), d’une boutique de cosmétiques (2019) et d’H&M (2018-2020). Les boutiques Sellio sont proches mais différentes : c’est pourquoi les modèles de recommandation et de segmentation sont **ré-entraînés et réglés sur chaque boutique** ; seul le churn utilise un modèle appris sur données publiques tant qu’une boutique n’a pas assez de clients.
- **Périodes particulières** : les tests Online Retail II et Cosmetics Shop tombent en période de fêtes ; la période de churn H&M couvre le confinement de 2020 (taux de churn de 66 à 73 %).
- **Cosmetics Shop** : un seul mois analysé (la récence est limitée à 31 jours) et pas de recherche interne ; à étendre avec les autres mois disponibles.
- **Churn** : ajouter les variables de connexion, d’avis, de coupons et de fidélité quand les boutiques auront assez de clients pour ré-entraîner sur leurs propres données.
- **Évaluation en ligne** : mesurer en production le taux de clic et de conversion des recommandations (`RECOMMENDATION_CLICK` est collecté) par **test A/B** contre la popularité.
- **Démarrage à froid** : ajouter les **images** produit (embeddings visuels), très pertinent pour la mode (le jeu H&M fournit les photos).
- **Vie privée** : avant une mise en production, ajouter un **bandeau de consentement** et une politique de confidentialité (loi tunisienne n° 2004-63, RGPD pour les visiteurs européens), respecter « Do Not Track » et permettre l’effacement des données d’un client sur demande.
- **Reconnaissance faciale** (vérification des marchands) : prévue ultérieurement ; le selfie et la pièce d’identité sont déjà collectés.
