# Programme de Fidélité — Documentation complète

> **Projet** : NaturEssence Back Office  
> **Stack** : Spring Boot 3.2 (backend) · React 18 + Vite (backoffice)  
> **Page backoffice** : `/fidelite`

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture des données](#2-architecture-des-données)
3. [Comment les points sont gagnés](#3-comment-les-points-sont-gagnés)
4. [Les niveaux (Segments)](#4-les-niveaux-segments)
5. [Montée de niveau automatique](#5-montée-de-niveau-automatique)
6. [Avantages par niveau](#6-avantages-par-niveau)
7. [Guide d'utilisation du Back Office](#7-guide-dutilisation-du-back-office)
   - [Onglet 1 — Configuration](#onglet-1--configuration)
   - [Onglet 2 — Avantages / Niveaux](#onglet-2--avantages--niveaux)
   - [Onglet 3 — Classement](#onglet-3--classement)
   - [Onglet 4 — Ajustement manuel](#onglet-4--ajustement-manuel)
8. [API Endpoints](#8-api-endpoints)
9. [Sécurité et permissions](#9-sécurité-et-permissions)
10. [Formules de calcul](#10-formules-de-calcul)
11. [FAQ](#11-faq)

---

## 1. Vue d'ensemble

Le programme de fidélité NaturEssence récompense chaque client avec des **points** à chaque interaction avec la boutique (commande, avis, inscription, anniversaire). Ces points s'accumulent et permettent aux clients de progresser dans des **niveaux** (segments) offrant des avantages croissants.

```
Client passe commande
        │
        ▼
 Points calculés = montant (TND) × taux (config) × multiplicateur (niveau)
        │
        ▼
 Points ajoutés au solde client
        │
        ▼
 Système vérifie si le client mérite une promotion de niveau (si auto activé)
        │
        ▼
 Client voit ses points et avantages sur son profil (frontoffice)
```

---

## 2. Architecture des données

### Tables PostgreSQL

| Table | Rôle |
|-------|------|
| `loyalty_config` | **Singleton** (1 seule ligne) — paramètres globaux du programme |
| `segments` | 4 niveaux de fidélité avec leurs seuils et avantages |
| `points_transactions` | Historique complet de chaque mouvement de points d'un client |
| `users` | Colonne `loyalty_points` (solde actuel) + `segment_id` (niveau actuel) |

### Entités Java

```
LoyaltyConfig
├── pointsParTnd         (Double)  — points accordés par dinar dépensé
├── pointsBienvenue      (Integer) — bonus à l'inscription
├── pointsAvis           (Integer) — bonus par avis publié
├── pointsAnniversaire   (Integer) — bonus anniversaire
└── autoSegmentPromotion (Boolean) — promotion automatique de niveau

Segment
├── name                 (String)  — identifiant interne : NOUVEAU / FIDELE / VIP / INACTIF
├── label                (String)  — nom affiché : "Nouveau", "Fidèle", "VIP", "Inactif"
├── seuilPoints          (Integer) — points minimum pour atteindre ce niveau
├── multiplicateurPoints (Double)  — multiplicateur sur les points de commande
├── remiseAutomatique    (Double)  — % de réduction permanente au panier
├── remiseAnniversaire   (Double)  — % de réduction supplémentaire le mois d'anniversaire
├── cashbackPourcentage  (Double)  — % du montant crédité en points après livraison
└── [14 Boolean benefits]          — voir section 6

PointsTransaction
├── user        — référence client
├── type        — COMMANDE / AVIS / BIENVENUE / ANNIVERSAIRE / AJUSTEMENT
├── points      — valeur (positif = gain, négatif = retrait)
├── orderId     — référence commande (optionnel)
├── description — texte explicatif
└── createdAt   — horodatage
```

---

## 3. Comment les points sont gagnés

### 3.1 Commande livrée

Déclencheur : `LoyaltyService.awardPointsForOrder(user, orderTotal, orderId)`

```
points = ROUND( orderTotal × pointsParTnd × multiplicateurPoints )
```

**Exemple** : Commande de 120 TND, config 1 pt/TND, client Fidèle avec multiplicateur 1.5x  
→ `ROUND(120 × 1.0 × 1.5)` = **180 points**

### 3.2 Inscription (Bienvenue)

Déclencheur : `LoyaltyService.awardWelcomePoints(user)` — appelé lors de la création de compte.

```
points = pointsBienvenue  (défaut : 50 pts)
```

### 3.3 Avis publié

Déclencheur : `LoyaltyService.awardPointsForReview(user)` — appelé après validation d'un avis.

```
points = pointsAvis  (défaut : 20 pts)
```

### 3.4 Anniversaire

Déclencheur : Tâche planifiée (ou manuel) — appliqué dans le mois de naissance du client.

```
points = pointsAnniversaire  (défaut : 100 pts)
```

### 3.5 Ajustement manuel (Admin)

Déclencheur : `POST /api/v1/admin/loyalty/users/{userId}/adjust-points`

```
points = delta (positif ou négatif, saisi par l'admin)
```

> **Règle de sécurité** : Le solde ne peut jamais descendre sous 0.  
> `solde_final = Math.max(0, solde_actuel + delta)`

---

## 4. Les niveaux (Segments)

Quatre niveaux prédéfinis, seedés en base au démarrage par `DataSeeder` :

| Niveau | `name` | Couleur | Description |
|--------|--------|---------|-------------|
| 🔵 Nouveau | `NOUVEAU` | Bleu cyan `#0891b2` | Client récemment inscrit, solde 0–499 pts |
| 🟢 Fidèle | `FIDELE` | Vert `#16a34a` | Client régulier, seuil configurable |
| 🟠 VIP | `VIP` | Ambre `#d97706` | Client premium à forte valeur |
| ⚫ Inactif | `INACTIF` | Gris `#64748b` | Client sans activité récente |

> **Note technique** : Le champ `color` en base de données stocke une chaîne de classes Tailwind  
> (ex : `"bg-blue-100 text-blue-800"`), **pas un code hexadécimal**.  
> Le frontend utilise la fonction `tierColor(seg)` qui mappe `seg.name` vers une palette hex interne.

---

## 5. Montée de niveau automatique

Si `autoSegmentPromotion = true`, après **chaque** attribution de points la méthode `maybePromoteSegment()` est appelée :

```java
// Algorithme simplifié
tiers_eligibles = segments où !INACTIF et seuilPoints > 0
meilleur_tier   = tier le plus haut dont seuilPoints ≤ solde_actuel

si meilleur_tier.seuilPoints > seuil_tier_actuel :
    client.segment = meilleur_tier
    sauvegarder
```

**Ce qui ne se passe PAS** :
- Pas de rétrogradation automatique (on ne descend pas un client si ses points baissent)
- Le niveau INACTIF n'est **jamais** attribué automatiquement — uniquement manuellement

---

## 6. Avantages par niveau

Chaque segment possède **14 avantages booléens** activables indépendamment :

### Livraison
| Champ | Description |
|-------|-------------|
| `livraisonGratuiteStandard` | Livraison standard offerte (quel que soit le panier) |
| `livraisonGratuiteExpress` | Livraison express offerte |
| `livraisonPrioritaire` | Commandes traitées en priorité |

### Cadeaux
| Champ | Description |
|-------|-------------|
| `cadeauAnniversaire` | Cadeau ou bon envoyé pendant le mois d'anniversaire |
| `emballageOffert` | Emballage cadeau gratuit sur toutes les commandes |
| `echantillonsGratuits` | Échantillons inclus dans chaque colis |

### Accès exclusif
| Champ | Description |
|-------|-------------|
| `accesAnticipe` | Accès en avant-première aux nouvelles collections |
| `produitExclusif` | Catalogue de produits réservé aux membres |
| `invitationsEvenements` | Invitations aux événements et lancements de marque |
| `accesVentesPrivees` | Accès aux ventes privées |

### Service
| Champ | Description |
|-------|-------------|
| `prioriteSupport` | File prioritaire au support client |
| `retourEtendu` | Délai de retour prolongé |
| `conseillerPersonnel` | Accès à un conseiller dédié |

### Reconnaissance
| Champ | Description |
|-------|-------------|
| `badgeVisible` | Badge du niveau affiché sur le profil public du client |

---

## 7. Guide d'utilisation du Back Office

### Onglet 1 — Configuration

**Objectif** : Définir les règles globales d'attribution de points pour toute la boutique.

| Champ | Ce que ça fait | Valeur par défaut |
|-------|---------------|-------------------|
| Points par TND dépensé | Ratio de base : 1 TND = N points | 1.0 |
| Bonus inscription | Points offerts à la création du compte | 50 |
| Bonus par avis | Points offerts à chaque avis publié | 20 |
| Bonus anniversaire | Points offerts dans le mois de naissance | 100 |
| Montée de niveau auto | Active la promotion automatique de segment | ✅ Activé |

**Comment utiliser :**
1. Modifiez les valeurs dans les champs numériques.
2. Utilisez le toggle pour activer/désactiver la montée automatique.
3. Cliquez **Enregistrer** pour appliquer.

> ⚠️ Ces paramètres s'appliquent aux prochains événements uniquement. Les points déjà attribués ne sont pas recalculés.

---

### Onglet 2 — Avantages / Niveaux

**Objectif** : Configurer chaque niveau (Nouveau, Fidèle, VIP, Inactif) avec ses seuils et avantages.

**Comment utiliser :**
1. **Sélectionnez un niveau** dans la colonne gauche.
2. **Seuil et points** : définissez combien de points il faut pour atteindre ce niveau et le multiplicateur appliqué aux commandes.
3. **Remises** : définissez les % de réduction automatique, anniversaire et cashback.
4. **Avantages** : cliquez sur chaque tuile pour activer (coloré) ou désactiver (gris) l'avantage.
5. Cliquez **Sauvegarder [Niveau]** pour enregistrer ce niveau spécifique.

**Points importants :**
- Le niveau `NOUVEAU` a typiquement un seuil de 0 pts et un multiplicateur de 1x.
- Le niveau `INACTIF` n'a pas de seuil automatique — il est attribué manuellement.
- Chaque niveau se sauvegarde **indépendamment** (vous ne perdez pas les autres en sauvegardant un).

---

### Onglet 3 — Classement

**Objectif** : Visualiser vos clients les plus fidèles, classés par points.

**Comment utiliser :**
1. Choisissez le nombre de clients à afficher (10 / 20 / 50 / 100) via le sélecteur.
2. Le **podium** affiche les 3 premiers avec 🥇 🥈 🥉.
3. Le **tableau** liste tous les clients avec rang, nom, email, niveau et score.
4. Cliquez l'icône **↺ rafraîchir** pour recharger les données.

> 💡 Vue en lecture seule. Pour modifier les points d'un client, utilisez l'onglet **Ajustement manuel**.

---

### Onglet 4 — Ajustement manuel

**Objectif** : Corriger manuellement le solde de points d'un client spécifique.

**Cas d'usage typiques :**
- Compensation suite à une commande endommagée
- Correction d'une erreur de calcul
- Geste commercial exceptionnel
- Mise en INACTIF d'un client (soustraction de points)

**Comment utiliser :**
1. **Recherchez le client** par son email (Entrée ou bouton Chercher).
2. Vérifiez que le nom et l'email correspondent au bon client.
3. **Choisissez un montant** :
   - Boutons rapides : ±10, ±50, ±100 pts
   - Champ libre : entrez un nombre positif (ajout) ou négatif (retrait)
4. La **prévisualisation** indique le nouveau solde avant confirmation.
5. **Saisissez une raison** (obligatoire — elle sera visible dans l'historique du client).
6. Cliquez **Ajouter les points** (vert) ou **Retirer les points** (rouge).

> ⚠️ Le solde ne peut pas descendre sous 0. Un retrait de 200 pts sur un solde de 50 pts résultera en 0 pts.  
> ⚠️ Cette action est réservée aux **SUPER_ADMIN**.

---

## 8. API Endpoints

Tous les endpoints sont préfixés par `/api/v1/admin/loyalty` et nécessitent un token JWT admin.

| Méthode | Endpoint | Rôle requis | Description |
|---------|----------|-------------|-------------|
| `GET` | `/config` | ADMIN, SUPER_ADMIN | Lire la configuration globale |
| `PUT` | `/config` | SUPER_ADMIN | Modifier la configuration |
| `GET` | `/leaderboard?limit=20` | ADMIN, SUPER_ADMIN | Top N clients par points |
| `POST` | `/users/{id}/adjust-points` | SUPER_ADMIN | Ajuster les points d'un client |

**Endpoints segments** (préfixe `/api/v1/admin`) :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/segments` | Lire tous les segments |
| `PUT` | `/segments/{id}` | Modifier un segment |

### Exemple — Ajustement de points

```http
POST /api/v1/admin/loyalty/users/42/adjust-points
Authorization: Bearer <token>
Content-Type: application/json

{
  "delta": -50,
  "reason": "Remboursement partiel commande #1234"
}
```

### Exemple — Mise à jour configuration

```http
PUT /api/v1/admin/loyalty/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "pointsParTnd": 1.5,
  "pointsBienvenue": 100,
  "pointsAvis": 30,
  "pointsAnniversaire": 150,
  "autoSegmentPromotion": true
}
```

---

## 9. Sécurité et permissions

| Action | ADMIN | SUPER_ADMIN |
|--------|-------|-------------|
| Voir la configuration | ✅ | ✅ |
| Modifier la configuration | ❌ | ✅ |
| Voir le classement | ✅ | ✅ |
| Voir les segments | ✅ | ✅ |
| Modifier les segments | ❌ | ✅ |
| Ajuster les points manuellement | ❌ | ✅ |

---

## 10. Formules de calcul

### Points par commande

```
points = ROUND( montant_commande_TND × pointsParTnd × multiplicateur_niveau )
```

### Vérification de promotion

```
Pour chaque tier (non-INACTIF, seuilPoints > 0), trié par seuilPoints croissant :
  Si solde_client >= tier.seuilPoints :
    meilleur_tier = tier

Si meilleur_tier.seuilPoints > niveau_actuel.seuilPoints :
  client.segment ← meilleur_tier
```

### Sécurité du solde

```
nouveau_solde = MAX(0, solde_actuel + delta)
```

---

## 11. FAQ

**Q : Que se passe-t-il si je désactive la montée automatique ?**  
R : Les points continuent d'être attribués normalement, mais le système ne change plus le niveau du client automatiquement. Les promotions doivent être faites manuellement via l'ajustement.

**Q : Peut-on rétrograder un client automatiquement ?**  
R : Non. La rétrogradation n'est pas implémentée automatiquement. Pour la gérer, assignez manuellement le niveau via un ajustement de points ou étendez le backend avec une tâche planifiée.

**Q : Le niveau INACTIF a-t-il un seuil de points ?**  
R : Non. Il n'est jamais attribué automatiquement par le moteur de promotion. Il est prévu pour être attribué manuellement (ex : client inactif depuis plus de 12 mois).

**Q : Les avantages booléens sont-ils automatiquement appliqués ?**  
R : Ils définissent des *droits* que le frontend et les intégrations backend doivent respecter. Par exemple, `livraisonGratuiteStandard = true` signifie que le code de checkout doit vérifier ce flag et ne pas facturer la livraison standard au client.

**Q : Que voit le client de son côté ?**  
R : Sur son profil (frontoffice `/mon-profil`, onglet Fidélité), le client voit : son solde actuel, son niveau actuel, la progression vers le niveau suivant (barre de progression), ses 20 dernières transactions de points, et les avantages de son niveau actuel.

**Q : Les points expirent-ils ?**  
R : Non, dans l'implémentation actuelle les points n'ont pas de date d'expiration. Cette fonctionnalité peut être ajoutée en ajoutant un champ `expiresAt` à `PointsTransaction` et une tâche planifiée.
