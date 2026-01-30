# UX Redesign - Parcours Créateur TelegramPlugin

**Version:** 1.0
**Date:** 2026-01-29
**Scope:** Parcours créateur (ORG_ADMIN), UI Entitlements, UI Abonnements
**Auteur:** Sally (UX Designer)

---

## Table des matières

1. [Parcours créateur](#1-parcours-créateur)
2. [Wireframes textuels](#2-wireframes-textuels)
3. [Recommandations de libellés](#3-recommandations-de-libellés)
4. [Règles de visibilité](#4-règles-de-visibilité)
5. [Annexe - Mapping technique](#5-annexe---mapping-technique)

---

## 1. Parcours créateur

### 1.1 Persona cible

**Marie, 32 ans** - Créatrice de contenu fitness
- Non-technique (utilise Canva, pas Figma)
- Veut monétiser sa communauté Telegram (3000 membres gratuits)
- Objectif : lancer une offre premium en < 15 minutes
- Frustration actuelle : *"C'est quoi tous ces codes ?"*

### 1.2 Parcours idéal après création d'un produit/abonnement

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Création terminée                                        │
│  ─────────────────────────────────────────────────────────────────  │
│  Message de succès :                                                │
│  "🎉 Votre offre 'Fitness Premium' est prête !"                     │
│                                                                     │
│  [Copier mon lien de vente]  [Promouvoir mon offre]  [Plus tard]   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Page "Promouvoir" (nouvelle section)                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📣 PROMOUVOIR "FITNESS PREMIUM"                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔗 Votre lien de vente                                      │   │
│  │ https://pay.votresite.com/fitness-premium                   │   │
│  │ [Copier]  [Ouvrir]  [QR Code]                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  💬 Message prêt à partager                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "Rejoignez mon canal privé Fitness Premium !                │   │
│  │  Accès illimité à mes programmes exclusifs.                 │   │
│  │  👉 [LIEN]"                                                 │   │
│  │ [Copier le message]  [Personnaliser]                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📱 Partager sur                                                    │
│  [Telegram]  [Instagram]  [Twitter]  [Email]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Dashboard - Vue d'ensemble                               │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📊 Aujourd'hui                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 12       │  │ 3        │  │ 245€     │  │ 89%      │           │
│  │ Abonnés  │  │ Nouveaux │  │ Revenus  │  │ Rétention│           │
│  │ actifs   │  │ ce mois  │  │ ce mois  │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ⚡ Actions rapides                                                 │
│  [Voir mes abonnés]  [Promouvoir]  [Créer une offre]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Checklist onboarding révisée

| Étape | Libellé actuel | Libellé proposé | Action |
|-------|----------------|-----------------|--------|
| 1 | Create your account ✓ | Compte créé ✓ | - |
| 2 | Connect your Stripe account | Connecter mon compte de paiement | → /billing |
| 3 | Create your first product | Créer mon offre | → /products/new |
| 4 | Connect a Telegram channel | Connecter mon canal Telegram | → /channels/new |
| 5 | Share your payment link | **Promouvoir mon offre** | → /promote |

---

## 2. Wireframes textuels

### 2.1 Liste des abonnements

**URL:** `/dashboard/subscriptions`
**Titre de page:** "Mes abonnés"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MES ABONNÉS                                                    [+ Ajouter] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 Vue d'ensemble                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │    12    │  │    10    │  │    1     │  │    1     │                    │
│  │  Total   │  │  Actifs  │  │ En retard│  │  Essai   │                    │
│  │          │  │   ✓      │  │    ⚠     │  │   🕐     │                    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                    │
│                                                                             │
│  🔍 Filtrer : [Tous ▼]  [Rechercher un abonné...]                          │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ABONNÉ              OFFRE                STATUT      DEPUIS      ACTIONS   │
├─────────────────────────────────────────────────────────────────────────────┤
│  👤 Julie Martin     Fitness Premium      ● Actif     12 jan     [Voir]    │
│     julie@email.com  19€/mois                                              │
│                                                                             │
│  👤 Pierre Durand    Coaching VIP         ● Actif     8 jan      [Voir]    │
│     pierre@mail.fr   49€/mois                                              │
│                                                                             │
│  👤 Sophie Lefebvre  Fitness Premium      ⚠ Impayé    3 jan      [Voir]    │
│     sophie@test.com  19€/mois             Relancer →                       │
│                                                                             │
│  👤 Marc Bernard     Coaching VIP         🕐 Essai    Aujourd'   [Voir]    │
│     marc@demo.fr     49€/mois             J-7                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Colonnes définitives :**

| Colonne | Contenu | Source technique |
|---------|---------|------------------|
| Abonné | Nom + email | `customer.displayName`, `customer.email` |
| Offre | Nom produit + prix/récurrence | `plan.name`, `plan.price`, `plan.interval` |
| Statut | Badge coloré + action contextuelle | `subscription.status` (mappé) |
| Depuis | Date relative ou absolue | `subscription.startedAt` |
| Actions | Bouton "Voir" | → détail abonnement |

**Mapping des statuts :**

| Technique | Libellé UI | Couleur | Icône |
|-----------|-----------|---------|-------|
| `ACTIVE` | Actif | Vert | ● |
| `PAST_DUE` | Impayé | Orange | ⚠ |
| `CANCELED` | Annulé | Gris | ✕ |
| `TRIALING` | Essai | Bleu | 🕐 |
| `INCOMPLETE` | En attente | Jaune | ◔ |
| `EXPIRED` | Expiré | Rouge | ✕ |

---

### 2.2 Détail d'un abonnement

**URL:** `/dashboard/subscriptions/[id]`
**Titre:** "[Nom abonné] - [Nom offre]"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Retour                                    Julie Martin - Fitness Premium │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  👤 ABONNÉ                  │  │  📦 OFFRE                           │  │
│  │                             │  │                                     │  │
│  │  Julie Martin               │  │  Fitness Premium                    │  │
│  │  julie@email.com            │  │  19€ / mois                         │  │
│  │  @julie_fitness             │  │  Renouvellement : 12 février        │  │
│  │                             │  │                                     │  │
│  │  [Voir le profil]           │  │  [Voir l'offre]                     │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📊 STATUT DE L'ABONNEMENT                                          │   │
│  │                                                                     │   │
│  │  ● Actif depuis le 12 janvier 2026                                  │   │
│  │                                                                     │   │
│  │  Prochaine facturation : 12 février 2026 (dans 14 jours)           │   │
│  │  Montant : 19€                                                      │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔑 ACCÈS ACCORDÉS                                                  │   │
│  │                                                                     │   │
│  │  Canal             Statut         Depuis                            │   │
│  │  ──────────────────────────────────────────────────                 │   │
│  │  🔒 Fitness VIP    ● Actif        12 jan 2026                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📜 HISTORIQUE                                                      │   │
│  │                                                                     │   │
│  │  12 jan   Abonnement activé                                         │   │
│  │  12 jan   Accès au canal accordé                                    │   │
│  │  12 jan   Paiement reçu - 19€                                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────     │
│  Actions : [Annuler l'abonnement]  [Contacter l'abonné]                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Entitlements (renommé "Accès")

**URL:** `/dashboard/access` (renommer `/dashboard/entitlements`)
**Titre de page:** "Gestion des accès"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GESTION DES ACCÈS                                           [+ Accorder]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 Vue d'ensemble                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                                  │
│  │    45    │  │    42    │  │    3     │                                  │
│  │  Total   │  │  Actifs  │  │ Révoqués │                                  │
│  └──────────┘  └──────────┘  └──────────┘                                  │
│                                                                             │
│  🔍 Filtrer : [Tous les canaux ▼]  [Tous les statuts ▼]  [Rechercher...]   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ABONNÉ              CANAL              VIA              STATUT    ACTIONS  │
├─────────────────────────────────────────────────────────────────────────────┤
│  👤 Julie Martin     🔒 Fitness VIP     Fitness Premium  ● Actif   [Gérer] │
│                                         19€/mois                           │
│                                                                             │
│  👤 Pierre Durand    🔒 Coaching Pro    Coaching VIP     ● Actif   [Gérer] │
│                                         49€/mois                           │
│                                                                             │
│  👤 Sophie Lefebvre  🔒 Fitness VIP     Fitness Premium  ⚠ Suspendu [Gérer]│
│                                         Paiement échoué                    │
│                                                                             │
│  👤 Marc Bernard     🔒 Coaching Pro    Accès manuel     ✕ Révoqué  [—]    │
│                                         Révoqué le 5 jan                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Colonnes définitives :**

| Colonne | Contenu | Source technique |
|---------|---------|------------------|
| Abonné | Nom du client | `customer.displayName` |
| Canal | Nom du canal avec icône | `channel.title` |
| Via | Nom de l'offre OU "Accès manuel" + contexte | `plan.name` via `subscription` OU `revokeReason` |
| Statut | Badge coloré | Dérivé de `status` + `subscription.status` |
| Actions | "Gérer" ou désactivé | Selon statut |

**Mapping des statuts (simplifié) :**

| Logique | Libellé UI | Couleur |
|---------|-----------|---------|
| Entitlement actif + abo actif | Actif | Vert |
| Entitlement actif + abo impayé | Suspendu | Orange |
| Entitlement révoqué | Révoqué | Gris |
| Entitlement expiré | Expiré | Rouge |

---

### 2.4 Section "Promouvoir"

**URL:** `/dashboard/promote` (nouvelle page)
**Ou intégré dans:** `/dashboard/products/[id]`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROMOUVOIR MES OFFRES                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Sélectionner une offre : [Fitness Premium ▼]                              │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  🔗 LIEN DE VENTE                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  https://pay.telegram-plugin.com/p/fitness-premium                  │   │
│  │                                                                     │   │
│  │  [📋 Copier]   [↗ Ouvrir]   [📱 QR Code]                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  💬 MESSAGE PRÊT À PARTAGER                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🏋️ Rejoignez mon canal privé Fitness Premium !                     │   │
│  │                                                                     │   │
│  │  ✅ Programmes d'entraînement exclusifs                             │   │
│  │  ✅ Conseils nutrition personnalisés                                │   │
│  │  ✅ Lives hebdomadaires                                             │   │
│  │                                                                     │   │
│  │  Seulement 19€/mois                                                 │   │
│  │  👉 https://pay.telegram-plugin.com/p/fitness-premium               │   │
│  │                                                                     │   │
│  │  [📋 Copier]   [✏️ Personnaliser]                                   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  📱 PARTAGER DIRECTEMENT                                                   │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │    ✈️    │  │    📸    │  │    🐦    │  │    ✉️    │                   │
│  │ Telegram │  │Instagram │  │ Twitter  │  │  Email   │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  📊 STATISTIQUES DU LIEN                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Clics ce mois : 47    |    Conversions : 3 (6.4%)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Recommandations de libellés

### 3.1 Navigation (Sidebar)

| Actuel | Proposé | Justification |
|--------|---------|---------------|
| Dashboard | Tableau de bord | Francisation cohérente |
| Products | Mes offres | Langage créateur, pas e-commerce |
| Customers | Mes clients | Possession, relation |
| Subscriptions | Mes abonnés | Focus sur la personne, pas le contrat |
| Entitlements | Gestion des accès | Compréhensible sans jargon |
| Channels | Mes canaux | Possession |
| Billing | Paiements | Plus simple |

### 3.2 Statuts d'abonnement

| Technique | UI Créateur | UI Admin |
|-----------|-------------|----------|
| `ACTIVE` | Actif | Actif |
| `PAST_DUE` | Impayé | Paiement en retard |
| `CANCELED` | Annulé | Annulé |
| `TRIALING` | Essai gratuit (J-X) | Période d'essai |
| `INCOMPLETE` | En attente | Paiement incomplet |
| `EXPIRED` | Expiré | Expiré |

### 3.3 Types d'entitlements

| Technique | UI (Proposé) |
|-----------|--------------|
| `CHANNEL_ACCESS` | Accès canal |
| `FEATURE_FLAG` | Fonctionnalité |
| `CONTENT_UNLOCK` | Contenu débloqué |
| `API_QUOTA` | *(masquer pour créateur)* |

### 3.4 Actions

| Actuel | Proposé | Contexte |
|--------|---------|----------|
| View / Voir | Voir le détail | Clarté |
| Revoke | Révoquer l'accès | Action destructive claire |
| Edit | Modifier | Standard |
| Archive | Archiver | Standard |
| Duplicate | Dupliquer | Standard |

### 3.5 Messages vides (empty states)

| Écran | Message proposé |
|-------|-----------------|
| Abonnés (vide) | "Vous n'avez pas encore d'abonnés. Partagez votre lien de vente pour commencer !" + [Promouvoir mon offre] |
| Accès (vide) | "Aucun accès accordé pour le moment. Les accès sont créés automatiquement lors d'un nouvel abonnement." |
| Clients (vide) | "Votre liste de clients est vide. Ils apparaîtront ici après leur premier achat." |

---

## 4. Règles de visibilité

### 4.1 Données JAMAIS visibles (créateur ORG_ADMIN)

| Donnée | Raison |
|--------|--------|
| `subscription.id` | Technique, inutile |
| `customer.id` | Technique, inutile |
| `entitlement.id` | Technique, inutile |
| `stripeCustomerId` | Donnée Stripe interne |
| `stripeSubscriptionId` | Donnée Stripe interne |
| `externalId` (tout type) | Donnée provider interne |
| `resourceId` | Technique |
| `entitlementKey` | Technique |

### 4.2 Données visibles UNIQUEMENT pour SUPERADMIN

| Donnée | Affichage |
|--------|-----------|
| IDs internes | Dans section "Debug" repliable |
| IDs Stripe | Dans section "Debug" repliable |
| Logs webhook | Page dédiée admin |
| PaymentEvents bruts | Page Payments (existante) |

### 4.3 Données toujours visibles (créateur)

| Donnée | Écran |
|--------|-------|
| Nom client | Partout |
| Email client | Liste + détail |
| Nom offre/produit | Partout |
| Prix et récurrence | Partout |
| Statut (libellé humain) | Partout |
| Dates (formatées) | Partout |
| Nom du canal | Accès, Canaux |

### 4.4 Matrice de visibilité par rôle

| Élément | ORG_ADMIN | SUPERADMIN | SUPPORT |
|---------|-----------|------------|---------|
| Noms/emails clients | ✅ | ✅ | ✅ |
| IDs techniques | ❌ | ✅ (debug) | ❌ |
| IDs Stripe | ❌ | ✅ (debug) | ✅ (debug) |
| Actions (révoquer) | ✅ | ✅ | ❌ |
| PaymentEvents | ❌ | ✅ | ✅ (lecture) |
| Webhook logs | ❌ | ✅ | ✅ (lecture) |

---

## 5. Annexe - Mapping technique

### 5.1 Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `packages/frontend/src/app/dashboard/subscriptions/page.tsx` | Refonte complète selon wireframe 2.1 |
| `packages/frontend/src/app/dashboard/subscriptions/[id]/page.tsx` | **Créer** - Détail abonnement (wireframe 2.2) |
| `packages/frontend/src/app/dashboard/entitlements/page.tsx` | Refonte selon wireframe 2.3, renommer route vers `/access` |
| `packages/frontend/src/app/dashboard/promote/page.tsx` | **Créer** - Section promouvoir (wireframe 2.4) |
| `packages/frontend/src/components/dashboard/sidebar.tsx` | Renommer libellés navigation |
| `packages/frontend/src/app/dashboard/page.tsx` | Ajouter bouton "Promouvoir", améliorer stats |

### 5.2 Nouvelles routes API potentielles

| Route | Usage |
|-------|-------|
| `GET /subscriptions/:id/details` | Données enrichies pour détail (client, plan, accès) |
| `GET /products/:id/share-data` | Lien de paiement, message pré-formaté |

### 5.3 Requêtes de données enrichies

Pour la liste des abonnements, le frontend doit recevoir :

```typescript
interface SubscriptionListItem {
  id: string; // Utilisé en interne uniquement, jamais affiché
  status: SubscriptionStatus;
  startedAt: Date;
  currentPeriodEnd: Date;

  // Données enrichies (JOIN côté API)
  customer: {
    displayName: string;
    email: string;
  };
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: PlanInterval;
  };
}
```

Pour les entitlements/accès :

```typescript
interface AccessListItem {
  id: string; // Interne uniquement
  status: 'active' | 'suspended' | 'revoked' | 'expired'; // Statut dérivé
  grantedAt: Date;

  customer: {
    displayName: string;
  };
  channel: {
    title: string;
    provider: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  };
  source: {
    type: 'subscription' | 'manual';
    planName?: string;
    subscriptionStatus?: SubscriptionStatus;
    revokeReason?: string;
  };
}
```

---

## Validation

- [ ] Parcours créateur validé
- [ ] Wireframes validés
- [ ] Libellés validés
- [ ] Règles de visibilité validées
- [ ] Prêt pour implémentation Dev Agent

---

*Document généré par Sally (UX Designer) - BMAD Framework*
