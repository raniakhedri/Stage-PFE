# Contenu de la présentation — Sellio (25 slides)

> Chaque slide contient : **Titre**, **Texte à mettre sur la slide** (court), **Visuel** (image du dossier `Rapport_rania/Image/`) et **À dire** (notes orales, à coller dans « Notes » de Canva).
> Durée visée : ~20 min de présentation + 5 min de démo.

---

## Slide 1 — Page de garde

**Titre :** Conception et développement d'une plateforme SaaS multi-boutiques intelligente pour le e-commerce

**Sous-titre :** Sellio : créer, personnaliser et gérer sa boutique en ligne, avec des services d'intelligence artificielle

- Réalisé par : **Rania KHEDHRI**
- Encadrant académique : **M. Talel Zouari**
- Encadrant professionnel : **M. Malek Naouar**
- Organisme d'accueil : **Antigone**
- Diplôme National d'Ingénieur en Informatique, option **TWIN**, ESPRIT
- Année universitaire 2025 – 2026

**Visuel :** logos `esprit.png` + `Antigonelogo.jpg`

**À dire :** « Bonjour, je vais vous présenter mon projet de fin d'études réalisé chez Antigone : Sellio, une plateforme SaaS qui permet à des commerçants de créer leur propre boutique en ligne, avec de l'essayage virtuel et de l'apprentissage automatique intégrés. »

---

## Slide 2 — Plan

1. Introduction
2. Problématique et étude de l'existant
3. Solution proposée
4. Méthodologie adoptée
5. Analyse des besoins
6. Conception et réalisation
7. Démonstration
8. Conclusion et perspectives

*(déjà fait sur Canva)*

---

## Slide 3 — Introduction

**Texte :**
> Le commerce en ligne est devenu un passage obligé pour les marques, y compris les plus petites. Mais créer et faire vivre une boutique en ligne reste coûteux et technique, et les outils qui la rendent plus efficace, comme la recommandation de produits ou l'essayage virtuel, sont souvent réservés aux grandes enseignes. Les plateformes SaaS de e-commerce répondent à ce besoin en permettant à chaque commerçant d'ouvrir sa boutique sans développement. C'est dans ce contexte que s'inscrit notre projet : une plateforme qui rend la vente en ligne accessible, personnalisée et intelligente.

**Visuel :** une illustration e-commerce (boutique, panier, smartphone) sur la partie colorée de la slide

**À dire :** « Aujourd'hui, vendre en ligne n'est plus une option pour une marque. Pourtant, pour un petit commerçant, c'est encore compliqué : il faut un site, un paiement, un suivi des clients… et les fonctions intelligentes sont réservées aux grands. Notre projet part de ce constat. »

---

## Slide 4 — Problématique

**Texte (3 constats) :**
- 🔁 **Pour l'agence :** chaque boutique est redéveloppée → coûteux, applications isolées à maintenir séparément
  *(point de départ : NaturEssence, boutique de cosmétiques)*
- 📱 **Pour les commerçants :** vente via Instagram / WhatsApp, stock sur tableur, aucune donnée sur les visiteurs
- 💸 **Plateformes existantes :** abonnement en devises, fonctions intelligentes vendues en extensions séparées

**Encadré — Problématique :**
> Comment concevoir une plateforme distribuée, à base de microservices, qui permette à des commerçants de secteurs variés de **créer, personnaliser et exploiter leur boutique en toute sécurité**, tout en **exploitant le comportement des visiteurs par apprentissage automatique** pour personnaliser l'achat et anticiper la perte de clients ?

**À dire :** « Une bijouterie, une épicerie fine et une marque de vêtements ont au fond les mêmes besoins : catalogue, vitrine, commande, promotions. Mais un modèle SaaS ajoute ses propres questions : vérifier l'identité du commerçant, isoler les données de chaque boutique, et adapter la fiche produit à chaque métier. »

---

## Slide 5 — Étude de l'existant

**Tableau comparatif (version courte pour la slide) :**

| Critère | Shopify | WooCommerce | Wix | Converty | **Sellio** |
|---|---|---|---|---|---|
| SaaS multi-boutiques | ✔ | ✘ | ✔ | ✔ | **✔** |
| Fiche produit adaptée au secteur | Partiel | Extensions | Partiel | ✘ | **✔** |
| Vitrine personnalisable sans code | ✔ | Partiel | ✔ | ✔ | **✔** |
| Vérification d'identité (KYC) | Via paiement | ✘ | Via paiement | ✘ | **✔** |
| Recommandations | Apps tierces | Extensions | Limitées | ✘ | **✔** |
| Prédiction de l'attrition | Apps tierces | ✘ | ✘ | ✘ | **✔** |
| Essayage virtuel | Apps tierces | Extensions | ✘ | ✘ | **✔** |
| Adapté au marché tunisien | Config. | Config. | Config. | ✔ | Partiel |

**Visuel :** logos des 4 plateformes

**À dire :** « Converty répond déjà bien au marché tunisien : dinar, paiement à la livraison. Sellio ne prétend pas le remplacer sur ce point, Stripe ne gère pas le dinar. Sellio se différencie autrement : fiches produit par secteur, vérification KYC, et une couche d'intelligence branchée sur les mêmes données que la boutique. »

---

## Slide 6 — Solution proposée : Sellio

**Texte — 3 espaces :**
- 🌐 **Site de la plateforme** — présentation, inscription des commerçants, console d'administration Sellio
- 🛠️ **Back-office du commerçant** — catalogue, vitrine, commandes, marketing, analyse
- 🛍️ **Vitrine publique** — la boutique où les clients achètent

**Chiffres clés (en gros) :**
**8** secteurs · **8** modèles de vitrine · **5** microservices · **3** modèles de ML · **230** tests

*(8 secteurs : mode, beauté, sport, high-tech, maison, épicerie, bijoux, enfants)*

**Visuel :** `ui_sellio_home.png`

**À dire :** « Une boutique devient opérationnelle en quelques minutes, au lieu d'un développement sur mesure. »

---

## Slide 7 — Fonctionnalités principales

**6 blocs (icône + titre + 1 ligne) :**
1. **Intégration des commerçants** — assistant de création, vérification KYC (carte, pièce d'identité, selfie)
2. **Catalogue intelligent** — fiche produit adaptée au secteur et au type (bague, montre, chaussure, smartphone…)
3. **Vitrine sans code** — 8 modèles (Minimal, Bold, Luxury, Sport, Tech, Artisan, Pop, Éditorial), aperçu en direct
4. **Parcours d'achat** — panier, TVA, zones de livraison, paiement **Stripe**, retours, avis
5. **Marketing & fidélité** — codes promo, bannières ciblées, e-mailing (Brevo), points et niveaux
6. **Intelligence** — essayage virtuel temps réel (**Decart**), recommandations, segmentation, prédiction de l'attrition

**Visuel :** mosaïque `ui_vitrine_luxury.png`, `ui_vitrine_sport.png`, `ui_vitrine_tech.png`, `ui_vitrine_pop.png`

---

## Slide 8 — Valeurs ajoutées

- **Une plateforme, plusieurs boutiques** — un seul code, une seule infrastructure
- **Confiance vérifiée** — aucun commerçant ne vend avant validation KYC ; le numéro de carte n'est jamais stocké
- **Isolation stricte des données** — chaque client appartient à une seule boutique ; même l'équipe Sellio n'y a pas accès
- **Vitrine adaptée au métier** — sans écrire de code
- **Intelligence intégrée** — modèles évalués sur des données réelles, face à une référence simple
- **Architecture évolutive** — un microservice et une base par domaine

**À dire :** « Je tiens à préciser ce qui est mesuré : le gain des recommandations, c'est un meilleur classement des produits, pas une hausse de chiffre d'affaires mesurée. »

---

## Slide 9 — Méthodologie adoptée : Scrum

**Pourquoi Agile ?**
Le périmètre a beaucoup évolué : boutique unique (NaturEssence) → microservices → multi-boutiques → essayage virtuel → ML → DevOps.

**Pourquoi Scrum (vs Kanban, XP) ?**
- Sprints et revues réguliers avec l'encadrant
- Backlog pour prioriser un périmètre qui s'élargit
- XP peu adapté : pas de programmation en binôme avec une seule développeuse

**Rôles :**
| Rôle | Personne |
|---|---|
| Product Owner | M. Malek Naouar |
| Scrum Master | Karim Arouchi |
| Équipe de développement | Rania Khedhri |

**Visuel :** `scrum-framework.png`

---

## Slide 10 — Planification : 7 releases, 12 sprints

**Frise chronologique (février → octobre 2026) :**

| Release | Sprints | Livrable |
|---|---|---|
| R1 | S1 – S2 | Passerelle, authentification, rôles · Boutiques, KYC, console Sellio |
| R2 | S3 – S4 | Catalogue par secteur · 8 vitrines et personnalisation |
| R3 | S5 – S6 | Panier, commande, Stripe · Retours, TVA, livraison, avis |
| R4 | S7 – S8 | Promotions, bannières, e-mailing · Fidélité et segments |
| R5 | S9 | Essayage virtuel Decart |
| R6 | S10 – S11 | Suivi comportemental, recommandation · Segmentation, attrition |
| R7 | S12 | Docker et intégration continue |
| Clôture | 20 – 29 oct. | Tests, corrections CI, rapport |

**À dire :** « Des sprints d'environ trois semaines. Les sprints 9 à 11 sont un peu plus longs : l'essayage dépend d'un service externe, et l'évaluation des modèles ne se réduit pas à écrire une API. »

---

## Slide 11 — Analyse des besoins : les acteurs

**Acteurs principaux :**
- **Super administrateur / Administrateur Sellio** — valide les dossiers KYC, gère boutiques et commerçants (sans accès aux clients)
- **Commerçant** — crée et gère sa boutique
- **Collaborateur de boutique** — permissions limitées (ex. commandes uniquement)
- **Visiteur** — navigue, reçoit des recommandations, essaie virtuellement
- **Client** — commande, paie, suit, retourne, donne un avis, cumule des points

**Acteurs secondaires :** Stripe · Decart · Brevo · GitHub Actions · moteur ML (Python / scikit-learn)

**Visuel :** diagramme de cas d'utilisation général

---

## Slide 12 — Besoins fonctionnels

**Équipe Sellio**
- Consulter les statistiques globales · Valider / refuser un dossier KYC · Suspendre, bloquer, supprimer un commerçant · Gérer les administrateurs

**Commerçant**
- Créer sa boutique et faire vérifier son identité
- Gérer produits, catégories et variantes
- Personnaliser apparence et page d'accueil avec aperçu en direct
- Gérer commandes, retours, TVA, livraison
- Créer promotions, bannières, campagnes e-mail, programme de fidélité
- Consulter l'analyse comportementale et les risques d'attrition

**Visiteur / Client**
- Parcourir, rechercher, recevoir des recommandations, essayer virtuellement
- Commander et payer par carte, suivre ses commandes, demander un retour, publier un avis

---

## Slide 13 — Besoins non fonctionnels (ISO/IEC 25010)

| Qualité | Exigence |
|---|---|
| 🔒 Sécurité | JWT (24 h) + refresh (7 j), BCrypt, rôles vérifiés côté serveur, aucune donnée de carte sur nos serveurs |
| ⚡ Performance | Recommandations pré-calculées, événements envoyés par lots, table partitionnée par mois |
| 🛡️ Fiabilité | Panne de l'analyse ≠ panne des achats ; transactions ACID |
| 🎨 Utilisabilité | Interfaces responsives, personnalisation visible immédiatement |
| 🧩 Maintenabilité | Un microservice par domaine, tests à chaque modification |
| 📦 Portabilité | Une image Docker par service, lancement en une commande |
| 👤 Confidentialité | Suivi par identifiant de visiteur anonyme |

---

## Slide 14 — Conception : architecture logique

**Choix : architecture microservices** (vs monolithique, N-tiers)
- Le sujet demande une plateforme distribuée
- Charges très différentes : l'analyse reçoit un flux continu, l'identité peu de requêtes
- Pannes isolées, déploiements indépendants

**Couches :**
- **Présentation :** 2 applications React — Sellio/back-office (3000) et vitrine (3001)
- **Passerelle :** Spring Cloud Gateway (8080), point d'entrée unique
- **Métier :** 5 microservices Spring Boot — auth · catalog · order · marketing · analytics
- **Intelligence :** scripts Python (pandas, scikit-learn)
- **Données :** PostgreSQL
- **Externes :** Stripe · Decart · Brevo

**Visuel :** `architecture_logique.png` *(prendre toute la slide)*

---

## Slide 15 — Architecture physique : une base par microservice

**Texte :**
- **5 serveurs PostgreSQL**, un par microservice : conteneur, port, compte et volume distincts
- Un service ne lit **jamais** les tables d'un autre → il passe par une **API interne** protégée par un jeton de service
- Le **JWT** porte l'identifiant de la boutique → isolation des données à chaque requête
- **Pourquoi PostgreSQL ?** transactions ACID (commande + paiement + stock), JSONB pour les thèmes, partitionnement pour les événements

**Visuel :** `architecture_physique.png`

**À dire :** « Si le disque de la base d'analyse se remplit, les comptes et les commandes restent lisibles : chaque volume est indépendant. »

---

## Slide 16 — Environnement technologique

**Logos en grille :**
- **Back-end :** Java 17 · Spring Boot 3.2 · Spring Cloud Gateway · Maven
- **Front-end :** React 18 · Vite · Tailwind CSS
- **Données & IA :** PostgreSQL · Python · pandas · scikit-learn
- **Services externes :** Stripe · Decart · Brevo
- **Qualité & DevOps :** JUnit 5 · Vitest · pytest · Docker · GitHub Actions
- **Outils :** VS Code · Git/GitHub · PlantUML

---

## Slide 17 — Réalisation : Releases 1 & 2 (plateforme, catalogue, vitrine)

**Texte :**
- **Création de boutique en assistant** : secteur, modèle de vitrine, identité visuelle, carte, pièce d'identité, selfie
- **Revue KYC** par l'administrateur : approbation ou refus motivé
- **Fiche produit par secteur** : tour de doigt pour une bague, pointure pour une chaussure, allergènes en épicerie…
- **Éditeurs « Apparence » et « Page d'accueil »** : logo, couleurs, polices, sections masquées / réordonnées, textes, produits mis en avant — **aperçu en direct** de la vraie vitrine

**Visuels (2-3 captures) :** `ui_nouvelle_boutique.png`, `ui_revue_dossier.png`, `ui_fiche_bijou.png`, `ui_page_accueil.png`

---

## Slide 18 — Réalisation : Releases 3 & 4 (vente, marketing, fidélité)

**Texte :**
- **Panier** avec choix obligatoire de taille / pointure / format
- **Tunnel de commande** : zones de livraison, TVA, codes promo → **paiement Stripe**
- **Gestion des commandes et des retours**, avis modérés par le commerçant
- **Promotions** : codes promo ciblés et remises automatiques
- **Bannières** ciblées par segment · **Campagnes e-mail** via Brevo
- **Fidélité** : points et niveaux (Nouveau, Fidèle, VIP, Inactif), montée de niveau automatique

**Visuels :** `ui_checkout.png`, `ui_paiement_stripe.png`, `ui_promotions.png`, `ui_fidelite_niveaux.png`

---

## Slide 19 — Release 5 : Essayage virtuel en temps réel

**Flux en 4 étapes (schéma) :**
1. Le navigateur demande un **jeton éphémère** (10 min) au catalog-service → la clé secrète Decart **reste sur le serveur**
2. Ouverture de la caméra (1280×720) + image du vêtement compressée (768 px, JPEG)
3. Connexion **WebRTC** au modèle génératif **Lucy VTON** de Decart
4. Le client se voit **porter le vêtement en direct**

**Pourquoi Decart ?**
| Solution | Décision |
|---|---|
| Superposition 2D (MediaPipe) | ✘ rendu peu réaliste |
| Diffusion auto-hébergée (IDM-VTON) | ✘ GPU nécessaire, pas de temps réel |
| API image par image (FASHN) | ✘ photo statique |
| **Decart Lucy VTON** | ✔ **vidéo en direct, sans GPU** |

**Maîtrise du coût :** session limitée à **45 s**

**Visuels :** `architecture_tryon.png`, `ui_tryon_bouton.png`

---

## Slide 20 — Release 6 : Intelligence comportementale

**Pipeline (schéma de gauche à droite) :**
**Collecte** (12 types d'événements, visiteur anonyme) → **Stockage** (table partitionnée par mois, index BRIN, rétention 13 mois) → **Entraînement** (chaque nuit à 3 h 40, Python) → **Restitution** (vitrine + tableau de bord « Comportement »)

**Données réelles, pas synthétiques :**
| Jeu public | Volume brut | Après nettoyage |
|---|---|---|
| Online Retail II (UCI) | 1 067 371 lignes | 774 591 ventes |
| Cosmetics (Kaggle, REES46) | 3,5 M événements | 525 253 événements |
| H&M (Kaggle) | 31,8 M achats | 1,22 M achats |

**Protocole :** découpage **temporel** (entraîner sur le passé, tester sur le futur) + comparaison à une **référence simple**

**Visuel :** `architecture_ml.png`

**À dire :** « Une plateforme neuve n'a pas d'historique. Des données artificielles auraient donné de bons scores… qui ne disent rien face à de vrais clients. »

---

## Slide 21 — Résultats des modèles

**3 cartes :**

**🎯 Recommandation — hybride (SVD + TF-IDF + popularité)**
- HR@10 : **0,308 → 0,357** (Online Retail II)
- Meilleur que la popularité sur les 3 jeux
- « Souvent achetés ensemble » : **47,1 %** vs 43,0 %

**👥 Segmentation — K-Means (K = 3)**
- Silhouette **0,468** · Stabilité ARI **0,951**
- Occasionnels 76 % · Acheteurs décidés 13 % · Explorateurs 11 %

**⚠️ Attrition — Forêt aléatoire / Gradient boosting**
- AUC **≈ 0,80** (vs 0,76 pour la référence)
- Rappel : **85 %** des départs repérés vs 38 %
- Modèle choisi selon le secteur de la boutique

**À dire :** « Les gains sont réels mais bornés. Une AUC de 0,80 veut dire que le modèle ordonne mieux un client parti et un client resté, pas qu'il a 80 % de bonnes réponses. »

**Visuels :** `ui_reco_fiche.png`, `ui_comportement.png`, `ui_churn.png`

---

## Slide 22 — Release 7 : Qualité et DevOps

**Gauche — 230 tests automatisés :**
- **JUnit 5** (back-end) : isolation des boutiques, droits par rôle, JWT, services métier
- **Vitest** (front-end) : sections de la vitrine, fiches par secteur, écrans du back-office
- **pytest** (ML) : recommandation, segmentation, attrition

**Droite — Pipeline GitHub Actions :**
`push / PR` → tests back-end ∥ front-end ∥ ML → build des **8 images Docker** → publication sur **GitHub Container Registry** (branche `main`)

- Dockerfile multi-étapes, utilisateur non privilégié
- Toute la plateforme se lance en **une commande** (Docker Compose)
- Secrets dans un `.env`, jamais dans les images

**Visuels :** `pipeline_ci.png`, `ui_github_actions.png`

**À dire :** « Le déploiement continu sur un serveur n'est pas en place : les images sont prêtes sur le registre, le lancement reste manuel. »

---

## Slide 23 — Démonstration

**Texte sur la slide :** « Démonstration » + capture `ui_vitrine_editorial.png` en fond

**Scénario conseillé (5 min) :**
1. **Commerçant** : créer une boutique → choisir secteur et modèle → étapes KYC
2. **Admin Sellio** : approuver le dossier
3. **Back-office** : ajouter un produit (fiche adaptée au secteur) → modifier couleurs et page d'accueil avec l'aperçu en direct
4. **Vitrine** : naviguer → recommandations « Vous aimerez aussi » → **essayage virtuel**
5. **Client** : panier → code promo → paiement Stripe (carte test `4242 4242 4242 4242`)
6. **Back-office** : commande reçue → page « Comportement » (segments, risques d'attrition)

> Astuce : prévoir une **vidéo enregistrée** en secours (l'essayage virtuel dépend du réseau ; un VPN bloque WebRTC).

---

## Slide 24 — Conclusion et perspectives

**Conclusion :**
- Sellio : plateforme SaaS **multi-boutiques**, **8 secteurs**, de la création de boutique jusqu'au paiement
- **5 microservices**, une base PostgreSQL chacun, **2 applications React**
- **Essayage virtuel temps réel** et **3 modèles de ML** évalués sur des données réelles
- **230 tests**, Docker, intégration continue
- Leçon retenue : *un modèle ne vaut que par la rigueur de son évaluation*

**Perspectives :**
- 💳 Prestataire de paiement **local (dinar tunisien)** + confirmation par webhook
- 🤳 **Reconnaissance faciale** pour automatiser le KYC
- ☸️ Messagerie asynchrone entre services, **Kubernetes**, **déploiement continu**
- 🇹🇳 Ré-entraîner l'attrition sur des **données tunisiennes** + **tests A/B**
- 📱 **Application mobile** commerçants et clients

---

## Slide 25 — Merci

**Texte :** Merci pour votre attention
**Sous-texte :** Questions ?
Rania KHEDHRI — Sellio · ESPRIT × Antigone · 2025-2026

---

## Questions probables du jury (préparation)

- **Pourquoi microservices et pas un monolithe ?** → sujet distribué, charges différentes (analyse vs identité), isolation des pannes et des données.
- **Comment garantissez-vous l'isolation entre boutiques ?** → le JWT porte l'ID de boutique, chaque requête est filtrée côté serveur, `TenantGuard` renvoie 404 pour un enregistrement d'une autre boutique, testé par JUnit.
- **Pourquoi Stripe si le dinar n'est pas supporté ?** → mode test fiable pour valider le tunnel ; prestataire local en perspective.
- **Pourquoi des données publiques ?** → pas d'historique au démarrage ; données synthétiques = scores trompeurs.
- **Que signifie HR@10 ?** → part des cas où un produit réellement acheté ensuite est dans les 10 suggestions.
- **Le modèle d'attrition marche-t-il pour une épicerie ?** → à valider : horizon 90 j inadapté ; jeux Instacart / Olist identifiés.
- **Coût de Decart ?** → facturé à la seconde ; session plafonnée à 45 s, jeton valable 10 min.
