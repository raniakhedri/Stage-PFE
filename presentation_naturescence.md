# Présentation — NaturEssence (Mémoire de fin d’études)

> Objectif : contenu **slide-par-slide** + notes orales. Cette présentation décrit le **projet tel qu’il est implémenté**, en restant alignée avec l’architecture, les flux et les endpoints documentés.

---

## Slide 1 — Titre (Page de Garde)
**Digitalisation et Intelligence Client**  
**Développement d'un écosystème e-commerce prédictif pour la cosmétique**

- **Élaboré par** : Rania Khedhri
- **Encadrant universitaire** : Talel Zouari (ESPRIT)
- **Encadrant professionnel** : Malek Naouar (Antigone)

**Notes orales (30s)**
- “Bonjour à toutes et à tous, et merci pour votre présence. Je m'appelle Rania Khedhri, et c'est avec une grande fierté que je vous présente le fruit de mon travail : la digitalisation et l'intelligence client, via le développement d'un écosystème e-commerce prédictif.”

---

## Slide 2 — Plan (utilise ton visuel « Plan »)
- Introduction
- Problématique
- Étude de l’existant
- Solution proposée
- Technologies et outils utilisés
- Réalisation & Conclusion

**Notes orales (10–15s)**
- “Je vais suivre ce plan et illustrer les flux les plus importants de bout en bout.”

---

## Slide 3 — Introduction (contexte projet)
- Le e‑commerce moderne exige :
  - **administration** du catalogue et du contenu
  - **expérience client** rapide et fiable
  - **personnalisation** (segmentation, ciblage)
  - **sécurité** (auth, rôles)
- NaturEssence répond à ces besoins via : Backoffice + Frontoffice + API

**Notes orales (20–30s)**
- “Le projet n’est pas seulement un site vitrine : c’est un système de gestion + distribution de contenu et produits, avec des règles métier côté serveur.”

---

## Slide 4 — Problématique (orientation “valeur”)
**Problématique** : comment livrer une plateforme e‑commerce :
- **facile à administrer** (contenu, promotions, commandes)
- **cohérente** (backoffice → backend → frontoffice)
- **personnalisée** (bannières ciblées par segment)
- **sécurisée** (JWT, accès admin)

**Indicateur de réussite**
- Une modification en backoffice est visible “en live” côté frontoffice (ex : bannières homepage)

**Notes orales (30s)**
- “La valeur centrale : relier l’admin à l’expérience client, sans rupture de données et avec des règles claires.”

---

## Slide 5 — Étude de l’existant (Solutions du marché)

| Type de solution | Exemples du marché | Avantages principaux | Limites & Problèmes majeurs |
| :--- | :--- | :--- | :--- |
| **SaaS / Clé en main** | Shopify, PrestaShop | Lancement très rapide, interface intuitive, hébergement inclus | Coûts d'abonnement + commissions par vente, data sous contrôle de l'éditeur (Vendor Lock-in), dépendance coûteuse aux plugins IA tiers. |
| **CMS Monolithiques** | WordPress (WooCommerce) | Large communauté, milliers de thèmes et plugins prêts à l'emploi | Architecture technique (PHP) vieillissante et lourde, plugins qui ralentissent le chargement, très difficile de greffer du Machine Learning natif sans refonte. |
| **Monolithes Enterprise** | Magento, Salesforce Commerce | Extrêmement robuste, gère de massifs volumes de transactions | Coût total de possession (TCO) prohibitif pour des marques naissantes, besoin constant d'équipes de maintenance dédiées, déploiements lents. |

**Notes orales (30–45s)**
- “Avant de développer NaturEssence, nous avons étudié le marché. Shopify est rapide mais vous rend locataire de votre donnée et bride l’IA sur-mesure. WordPress/WooCommerce est populaire, mais son architecture monolithique montre très vite ses limites en termes de performance et d'analyse comportementale. NaturEssence a donc été pensé comme l’alternative idéale : la flexibilité de React pour contourner la lourdeur des CMS classiques, et la liberté d'ajouter nos propres algorithmes via microservices sans être enfermés.”

---

## Slide 6 — Solution proposée (Ta vision macro)
**Notre solution va bien au-delà d'un simple site e-commerce classique : c'est une véritable plateforme pilotée par la donnée (data-driven).**

**1. Socle robuste & Sécurité**
- Backoffice d'administration et Frontoffice client modernes.
- Gestion avancée des rôles et moteur promotionnel complet.
- Sécurité renforcée.

**2. Écosystème IA / ML Services**
- Moteur de Recommandation.
- Intelligence Client (Churn Prediction) : Segmentation prédictive pour maximiser la rétention (+25%).
- Excellence Opérationnelle : Recherche sémantique vectorielle et modération NLP automatique des avis.
- Système de tracking comportemental.

**3. Contrôle & KPI**
- Personnalisation dynamique de l'apparence en temps réel.
- Tableau de bord administrateur riche en KPIs.

**Notes orales (30–40s)**
- “Plutôt que d'empiler des modules, j'ai pensé NaturEssence comme un écosystème 'Data-Driven'. D'un côté, un socle e-commerce classique très robuste, et de l'autre, des services de Machine Learning qui analysent les comportements pour pousser des recommandations et prédire le churn.”

---

## Slide 7 — Valeurs Ajoutées (Ce qui rend le projet "Niveau Ingénierie")

**1. Architecture microservices scalable**
- Chaque service (auth, catalogue, commandes, ML, tracking) est indépendant et déployable séparément, permettant une scalabilité horizontale sans impact sur les autres modules.

**2. Personnalisation dynamique en temps réel**
- Les administrateurs peuvent modifier les couleurs, polices, logos et le mode sombre directement depuis l'interface (Config-driven UI), sans aucune intervention technique.

**3. Intelligence Artificielle et recommandation personnalisée**
- Moteur basé sur le collaborative filtering (scikit-learn).
- Analyse du comportement utilisateur en temps réel et segmentation automatique des clients pour adapter le contenu et les promotions.

**4. Automatisation et gain de productivité**
- Implémentation de technologies avancées (IA, ML, AR envisagée) pour améliorer l'expérience d'achat et rationaliser les opérations internes (ex: modération NLP).

**Notes orales (30–45s)**
- “La vraie valeur de ce projet réside dans sa conception. Architecturer en microservices assure qu'une panne du module ML ne fera jamais crasher les paiements. L'intégration native de scikit-learn nous permet d'avoir une segmentation intelligente et autonome. Enfin, le Backoffice donne un pouvoir total au marketing pour ajuster le design (couleurs, dark mode) en direct, sans jamais solliciter un développeur. C'est l'essence même de l'agilité.”

---

## Slide 7 — Architecture générale & ports
**Stack**
- Backend : Spring Boot + PostgreSQL
- Backoffice : React + Vite (admin)
- Frontoffice : React + Vite (client)
- ML Services (optionnel / premium) : Python FastAPI (recommandation) 

**Ports (dev)**
- API : `http://localhost:8080`
- Backoffice : `http://localhost:3000`
- Frontoffice : `http://localhost:3001`
- ML Services : `http://localhost:8001`

**API namespaces**
- Public : `/api/v1/public/*`
- Admin : `/api/v1/admin/*`
- Auth : `/api/v1/auth/*`

**Intégration IA/ML (implémentée via service séparé)**
- Le backend consomme le service ML via HTTP pour exposer des fonctionnalités “premium” (ex : recommandations).

**Notes orales (20–30s)**
- “Le découpage d’URL structure la sécurité : public vs admin vs auth. Et l’IA est isolée dans un microservice FastAPI pour garder le backend Java propre.”

---

## Slide 8 — Sécurité : JWT + contexte utilisateur
**Frontoffice**
- Après login : stockage local (ex : `accessToken`, `refreshToken`, `user`)
- `user.segmentName` utilisé pour le ciblage de bannières

**Backend (implémenté)**
- JWT : génération/validation + filtre d’authentification (Bearer Token)

**Backoffice**
- Protection des routes (composant `RequireAuth`)

**Notes orales (30s)**
- “L’objectif : garantir que les endpoints admin sont appelés uniquement avec un token valide.”

---

## Slide 9 — Focus #1 : Système de bannières (end‑to‑end)
**Pourquoi c’est le “cas d’école” du projet ?**
- Contenu piloté par l’admin
- Exposé via API publique
- Consommé en frontoffice avec règles (device/segment/dates)

**Flux**
1. Backoffice crée / met à jour une bannière
2. Backend stocke et expose
3. Frontoffice affiche sur la homepage (hero)

**Notes orales (25–35s)**
- “C’est le meilleur exemple de cohérence de bout en bout : un champ saisi en admin influence directement l’UX client.”

---

## Slide 10 — Détails bannières : champs métier & règles d’affichage
**Champs liés bout‑en‑bout**
- Textes : `titre`, `sousTitre`
- Médias : `imageUrl` (desktop), `mobileImageUrl` (mobile), `videoUrl` (optionnel)
- CTA : `ctaTexte`, `ctaLien`, `ctaType`
- UX : `alignement`, `animation`, `dureeSecondes`
- Ciblage : `audience` (segment)
- Publication : `actif`, `statut`, `dateDebut`, `dateFin`
- Visibilité : `visibleHomepage`, `visibleMobile`, `visibleDesktop`
- Tri : `priorite`, `ordre`

**Règles frontoffice (implémentées)**
- sélection image mobile/desktop selon viewport
- filtrage par visibilité + homepage
- CTA selon `ctaType`
- animations
- refresh : toutes les 30s + au focus de l’onglet

**Notes orales (40–60s)**
- “Le système est ‘config-driven’ : on évite de recoder l’UI à chaque campagne marketing.”

---

## Slide 11 — Démonstration (scénario simple)
**Scénario démo**
1. Admin (backoffice) : créer une bannière
   - position : `HOMEPAGE_HERO`
   - audience : `VIP`
   - `visibleMobile=true`, `visibleDesktop=true`, `visibleHomepage=true`
2. Frontoffice : se connecter avec un utilisateur `VIP`
3. Homepage : la bannière s’affiche (image mobile en responsive)

**Notes orales (20–30s)**
- “Cette démo montre la valeur business : campagnes ciblées sans déploiement.”

---

## Slide 12 — Modules Backoffice & Frontoffice (vision produit)
**Backoffice (admin)**
- Produits, Catégories, Collections
- Bannières, Apparence, Promotions
- Commandes, Clients, Avis
- TVA / Livraison, Rôles & permissions

**Frontoffice (client)**
- Homepage + hero dynamique
- Pages catégories / produit
- Auth : login + inscription
- Navbar : état invité vs connecté

**Notes orales (25–35s)**
- “On couvre la boucle complète : gérer → publier → vendre → suivre.”

---

## Slide 13 — Qualité, exploitation & runbook
**Run**
- Backend : `Backend/` → `./mvnw.cmd spring-boot:run`
- Frontend : `Frontend/` → `npm install`
  - backoffice : `npm run dev:backoffice`
  - frontoffice : `npm run dev:frontoffice`

**QA bannières (checklist)**
- actif + dates + audience
- visibilité mobile/desktop/homepage
- images desktop + mobile

**Notes orales (20–30s)**
- “J’ai documenté un guide d’exploitation clair, reproductible.”

---

## Slide 14 — IA/ML (Premium) + limites & améliorations
**Fonction IA/ML (implémentée via ML Services)**
1. Recommandations produits : microservice FastAPI (port 8001) consommé par l’écosystème.
2. Objectif : personnaliser l’expérience (ex : “Vous aimerez aussi”) et soutenir les conversions.

**Limites connues**
3. UI A/B test présente dans le backoffice, pas encore reliée à une logique backend.
4. Planification des bannières au niveau date (pas de filtre heure persistant).
5. Endpoint public retourne des données wrap dans `ApiResponse` : contrat à stabiliser.

**Amélioration prioritaire**
6. Performance : split des gros bundles JS côté backoffice.

**Pourquoi c’est crédible ?**
- Le socle est déjà modulaire : endpoints séparés + logique de ciblage déjà en place

**Notes orales (30–45s)**
- “Je montre un socle robuste et cohérent, et j’assume clairement les limites restantes et les axes d’amélioration.”

---

## Slide 15 — Conclusion
- Résultat : plateforme e‑commerce complète, administrable, sécurisée
- Point fort différenciant : **bannières ciblées** + règles d’affichage device‑aware
- Valeur business : campagnes rapides, cohérentes, et contrôlées par l’admin

**Ouverture**
- Améliorations incrémentales : performance, qualité des campagnes, robustesse des contrats API

**Notes orales (15–25s)**
- “Le projet est cohérent techniquement : un backoffice admin, une API structurée et un frontoffice qui consomme des données live.”
