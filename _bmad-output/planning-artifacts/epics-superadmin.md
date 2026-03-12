---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
workflowCompleted: true
inputDocuments:
  - _bmad-output/planning-artifacts/prd-superadmin.md
  - _bmad-output/analysis/brainstorming-session-2026-03-06.md
projectType: saas_b2b_admin
date: '2026-03-06'
---

# Dashboard SUPERADMIN - Epic Breakdown

## Overview

Ce document fournit le découpage complet en Epics et Stories pour le Dashboard SUPERADMIN de TelegramPlugin, transformant les requirements du PRD en stories implémentables.

## Requirements Inventory

### Functional Requirements

**MVP (23 FRs) :**

FR1: SUPERADMIN peut voir toutes les alertes critiques sur une page unique
FR2: SUPERADMIN peut voir le nombre de tickets non répondus avec badge
FR3: SUPERADMIN peut voir le nombre d'impayés avec badge
FR4: SUPERADMIN peut voir les créateurs à risque de churn avec badge
FR5: SUPERADMIN peut voir les KPIs essentiels (nouveaux clients, revenus semaine)
FR6: Système affiche les alertes par ordre de priorité (tickets > impayés > churn)
FR7: SUPERADMIN peut créer une invitation VIP avec email
FR8: SUPERADMIN peut définir le plan et la durée gratuite de l'invitation
FR9: Système envoie automatiquement un email d'invitation au VIP
FR10: SUPERADMIN peut voir le tableau des invités VIP avec statut
FR11: SUPERADMIN peut voir si un VIP a activé son compte
FR12: SUPERADMIN peut voir si un VIP a connecté Stripe et Telegram
FR13: SUPERADMIN peut voir les offres créées par un VIP
FR14: SUPERADMIN peut voir les ventes générées par un VIP
FR15: SUPERADMIN peut voir les jours restants sur un trial VIP
FR16: Système alerte quand un trial VIP approche de l'expiration
FR17: SUPERADMIN peut prolonger manuellement un trial VIP
FR18: SUPERADMIN peut voir la liste des paiements en échec
FR19: SUPERADMIN peut voir l'historique des tentatives pour un impayé
FR20: SUPERADMIN peut contacter un créateur avec impayé
FR21: SUPERADMIN peut relancer manuellement un paiement
FR22: SUPERADMIN peut suspendre manuellement un créateur
FR23: Système bloque automatiquement après 7 jours ou 3 tentatives

**Post-MVP (15 FRs) :**

FR24 [Phase 2]: SUPERADMIN peut voir la fiche complète d'un créateur
FR25 [Phase 2]: SUPERADMIN peut voir le score santé d'un créateur
FR26 [Phase 2]: SUPERADMIN peut voir la timeline d'activité d'un créateur
FR27 [Phase 2]: SUPERADMIN peut voir les revenus générés par un créateur
FR28 [Phase 2]: Système calcule le score santé basé sur activité et paiements
FR29 [Phase 2]: Créateur peut soumettre un ticket de support
FR30 [Phase 2]: SUPERADMIN peut voir la liste des tickets
FR31 [Phase 2]: SUPERADMIN peut voir les tickets par statut (Kanban)
FR32 [Phase 2]: SUPERADMIN peut répondre à un ticket
FR33 [Phase 2]: SUPERADMIN peut rechercher un créateur par email ou nom
FR34 [Phase 3]: Agent Support peut voir les tickets sans accès aux finances
FR35 [Phase 2]: SUPERADMIN peut voir les créateurs à risque de churn
FR36 [Phase 2]: SUPERADMIN peut contacter un créateur à risque
FR37 [Phase 3]: Créateur voit un formulaire de sortie lors de la résiliation
FR38 [Phase 3]: SUPERADMIN peut voir les raisons de résiliation

### Non-Functional Requirements

NFR1 [Performance]: Dashboard charge en < 2 secondes
NFR2 [Performance]: Alertes visibles en < 1 seconde après ouverture
NFR3 [Performance]: Actions (invitation VIP, relance paiement) confirment en < 3 secondes
NFR4 [Performance]: Recherche créateur retourne résultats en < 1 seconde
NFR5 [Sécurité]: Authentification requise pour accès dashboard
NFR6 [Sécurité]: Sessions expirent après inactivité
NFR7 [Sécurité]: Actions sensibles (suspension, relance) loggées avec timestamp
NFR8 [Sécurité]: Accès limité à SUPERADMIN uniquement (RBAC Phase 3 pour support)
NFR9 [Intégration]: Lecture temps réel depuis base PostgreSQL existante
NFR10 [Intégration]: Appels Stripe API pour relances paiement
NFR11 [Intégration]: Envoi emails via Brevo existant
NFR12 [Intégration]: Statuts bot Telegram via API existante
NFR13 [Fiabilité]: Dashboard disponible 99% du temps
NFR14 [Fiabilité]: Retry automatique si échec d'action Stripe
NFR15 [Fiabilité]: Pas de perte de données lors des actions

### Additional Requirements

- Extension API NestJS existante (patterns établis)
- Modèle single-tenant (une seule utilisatrice MVP)
- Temps réel : polling simple d'abord, websockets si nécessaire
- Actions critiques avec confirmation modale
- Réutilisation infrastructure existante (PostgreSQL, Redis, Stripe, Brevo)
- Audit log pour traçabilité des actions sensibles
- UI cohérente avec le dashboard créateur existant (shadcn/ui, Tailwind)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Vue alertes critiques page unique |
| FR2 | Epic 1 | Badge tickets non répondus |
| FR3 | Epic 1 | Badge impayés |
| FR4 | Epic 1 | Badge créateurs à risque churn |
| FR5 | Epic 1 | KPIs essentiels |
| FR6 | Epic 1 | Priorité alertes (tickets > impayés > churn) |
| FR7 | Epic 2 | Création invitation VIP email |
| FR8 | Epic 2 | Définition plan et durée gratuite |
| FR9 | Epic 2 | Envoi auto email invitation |
| FR10 | Epic 2 | Tableau invités VIP avec statut |
| FR11 | Epic 2 | Statut activation compte VIP |
| FR12 | Epic 2 | Statut connexion Stripe/Telegram VIP |
| FR13 | Epic 2 | Offres créées par VIP |
| FR14 | Epic 2 | Ventes générées par VIP |
| FR15 | Epic 2 | Jours restants trial VIP |
| FR16 | Epic 2 | Alerte pré-expiration VIP |
| FR17 | Epic 2 | Extension manuelle trial VIP |
| FR18 | Epic 3 | Liste paiements en échec |
| FR19 | Epic 3 | Historique tentatives impayé |
| FR20 | Epic 3 | Contact créateur impayé |
| FR21 | Epic 3 | Relance manuelle paiement |
| FR22 | Epic 3 | Suspension manuelle créateur |
| FR23 | Epic 3 | Auto-blocage 7j/3 tentatives |

## Epic List

### Epic 1: Centre d'Alertes & CEO View
Vanessa peut voir en 1 seconde l'état de santé du SaaS chaque matin - dashboard avec badges d'alertes priorisées et KPIs essentiels.
**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Système VIP Influenceurs
Vanessa peut inviter un influenceur VIP et tracker sa conversion de A à Z - workflow complet de l'invitation email jusqu'à la conversion.
**FRs couverts:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17

### Epic 3: Gestion des Paiements
Vanessa peut identifier et résoudre les problèmes de paiement avant perte de revenus - vue impayés avec historique et actions.
**FRs couverts:** FR18, FR19, FR20, FR21, FR22, FR23

### Epic 4: Fiche Créateur 360° [Phase 2]
Vanessa peut voir la santé globale de chaque créateur et anticiper le churn.
**FRs couverts:** FR24, FR25, FR26, FR27, FR28, FR35, FR36

### Epic 5: Système Tickets [Phase 2]
Vanessa peut gérer le support de manière centralisée avec vue Kanban.
**FRs couverts:** FR29, FR30, FR31, FR32, FR33

### Epic 6: RBAC & Analytics Churn [Phase 3]
Vanessa peut déléguer le support et comprendre les raisons de départ.
**FRs couverts:** FR34, FR37, FR38

---

## Epic 1: Centre d'Alertes & CEO View

**Goal:** Vanessa peut voir en 1 seconde l'état de santé du SaaS chaque matin

### Story 1.1: Dashboard SUPERADMIN avec layout et auth

As a SUPERADMIN,
I want accéder à un dashboard sécurisé dédié,
So that je puisse piloter mon SaaS depuis une interface protégée.

**Acceptance Criteria:**

**Given** je suis connectée avec un compte SUPERADMIN
**When** j'accède à /admin/dashboard
**Then** je vois le layout principal du dashboard SUPERADMIN
**And** la navigation inclut les sections : Alertes, VIP, Paiements

**Given** je ne suis pas authentifiée ou pas SUPERADMIN
**When** j'accède à /admin/*
**Then** je suis redirigée vers la page de connexion

---

### Story 1.2: Badges d'alertes prioritisées

As a SUPERADMIN,
I want voir des badges colorés indiquant les alertes critiques,
So that je sache immédiatement s'il y a des problèmes à traiter.

**Acceptance Criteria:**

**Given** il y a 2 tickets non répondus depuis >24h
**When** je charge le dashboard
**Then** je vois un badge 🔴 "2" sur la section Tickets
**And** ce badge apparaît en priorité 1 (position la plus visible)

**Given** il y a 1 impayé depuis >3 jours
**When** je charge le dashboard
**Then** je vois un badge 🟠 "1" sur la section Paiements
**And** ce badge apparaît en priorité 2

**Given** il y a 3 créateurs montrant des signes de churn
**When** je charge le dashboard
**Then** je vois un badge 🟡 "3" sur la section Créateurs
**And** ce badge apparaît en priorité 3

**Given** aucune alerte active
**When** je charge le dashboard
**Then** je vois tous les indicateurs en 🟢

---

### Story 1.3: KPIs essentiels CEO View

As a SUPERADMIN,
I want voir les KPIs business essentiels en un coup d'œil,
So that je comprenne la santé financière de mon SaaS.

**Acceptance Criteria:**

**Given** je suis sur le dashboard
**When** la page charge
**Then** je vois le nombre de nouveaux clients cette semaine
**And** je vois le revenu total de la semaine en cours
**And** les données se chargent en moins de 2 secondes

**Given** il y a eu 3 nouvelles inscriptions et 450€ de revenus
**When** je consulte les KPIs
**Then** j'affiche "3 nouveaux clients" et "450€ revenus"

---

## Epic 2: Système VIP Influenceurs

**Goal:** Vanessa peut inviter un influenceur VIP et tracker sa conversion de A à Z

### Story 2.1: Formulaire invitation VIP

As a SUPERADMIN,
I want créer une invitation VIP personnalisée,
So that je puisse offrir un accès gratuit ciblé à un influenceur.

**Acceptance Criteria:**

**Given** je suis sur la page Invitations VIP
**When** je clique "Nouvelle invitation"
**Then** je vois un formulaire avec : email, plan (Basic/Pro/Growth), durée gratuite (7/14/30 jours)

**Given** je remplis le formulaire avec sophie@example.com, Plan Pro, 30 jours
**When** je clique "Envoyer invitation"
**Then** l'invitation est créée avec statut "En attente"
**And** je vois une confirmation de succès

**Given** j'entre un email invalide
**When** je soumets le formulaire
**Then** je vois un message d'erreur de validation

---

### Story 2.2: Envoi automatique email invitation

As a SUPERADMIN,
I want que le système envoie automatiquement l'email d'invitation,
So that le VIP reçoive un lien personnalisé sans action manuelle.

**Acceptance Criteria:**

**Given** une invitation VIP est créée
**When** le système traite l'invitation
**Then** un email est envoyé via Brevo avec lien d'inscription unique
**And** l'email contient : plan offert, durée gratuite, lien personnalisé

**Given** l'email est envoyé avec succès
**When** je consulte l'invitation
**Then** je vois le statut "Email envoyé" avec timestamp

**Given** l'envoi échoue
**When** je consulte l'invitation
**Then** je vois le statut "Échec envoi" avec option de réessayer

---

### Story 2.3: Tableau VIP avec statuts activation

As a SUPERADMIN,
I want voir le tableau de tous les invités VIP avec leur progression,
So that je puisse suivre qui a activé son compte.

**Acceptance Criteria:**

**Given** j'ai envoyé 5 invitations VIP
**When** j'accède à la page Invitations VIP
**Then** je vois un tableau avec colonnes : Email, Plan, Statut, Date invitation

**Given** Sophie a cliqué le lien et créé son compte
**When** je consulte le tableau
**Then** je vois ✅ "Compte activé" pour Sophie

**Given** Sophie a connecté son compte Stripe
**When** je consulte sa ligne
**Then** je vois ✅ "Stripe connecté"

**Given** Sophie a lié son bot Telegram
**When** je consulte sa ligne
**Then** je vois ✅ "Telegram lié"

**Given** Marc n'a pas encore activé après 5 jours
**When** je consulte le tableau
**Then** je vois 🟠 "En attente" pour Marc avec "5 jours depuis invitation"

---

### Story 2.4: Métriques performance VIP

As a SUPERADMIN,
I want voir les métriques d'activité de chaque VIP,
So that je puisse évaluer leur potentiel de conversion.

**Acceptance Criteria:**

**Given** Sophie a activé son compte et créé du contenu
**When** je consulte ses métriques VIP
**Then** je vois : nombre d'offres créées, ventes totales (€), jours restants trial

**Given** Sophie a créé 3 offres et généré 250€
**When** je consulte le tableau VIP
**Then** je vois "3 offres" et "250€ générés" sur sa ligne

**Given** il reste 12 jours sur le trial de Sophie
**When** je consulte le tableau
**Then** je vois "12 jours restants" clairement visible

---

### Story 2.5: Alertes expiration et extension trial

As a SUPERADMIN,
I want être alertée avant expiration d'un trial et pouvoir le prolonger,
So that je puisse relancer ou récompenser les VIP prometteurs.

**Acceptance Criteria:**

**Given** le trial de Sophie expire dans 5 jours
**When** je charge le dashboard
**Then** je vois une alerte 🟠 "1 trial expire bientôt"
**And** Sophie apparaît dans la liste des trials à surveiller

**Given** je consulte le détail de Sophie
**When** je clique "Prolonger trial"
**Then** je peux choisir une durée (7/14/30 jours supplémentaires)

**Given** je prolonge de 14 jours
**When** je confirme
**Then** la nouvelle date d'expiration est mise à jour
**And** je vois une confirmation "Trial prolongé jusqu'au [date]"

---

## Epic 3: Gestion des Paiements

**Goal:** Vanessa peut identifier et résoudre les problèmes de paiement avant perte de revenus

### Story 3.1: Liste impayés avec historique tentatives

As a SUPERADMIN,
I want voir la liste des paiements en échec avec leur historique,
So that je puisse comprendre la situation avant d'agir.

**Acceptance Criteria:**

**Given** il y a 3 créateurs avec paiements échoués
**When** j'accède à la page Paiements
**Then** je vois un tableau avec : Créateur, Montant dû, Dernière tentative, Nb tentatives, Jours en échec

**Given** je clique sur la ligne de Marc
**When** le détail s'ouvre
**Then** je vois l'historique complet des tentatives : date, heure, raison échec (carte expirée, fonds insuffisants, etc.)

**Given** Marc a 3 tentatives échouées sur 5 jours
**When** je consulte son historique
**Then** je vois chaque tentative avec sa raison spécifique
**And** le statut global affiche "3 tentatives / 5 jours"

---

### Story 3.2: Actions manuelles sur impayés

As a SUPERADMIN,
I want pouvoir contacter, relancer ou suspendre un créateur en impayé,
So that je puisse résoudre la situation de manière appropriée.

**Acceptance Criteria:**

**Given** je consulte un impayé
**When** je clique "Contacter"
**Then** j'ouvre un formulaire email pré-rempli avec template "Problème de paiement"
**And** l'email est envoyé via Brevo

**Given** je consulte un impayé
**When** je clique "Relancer paiement"
**Then** une nouvelle tentative Stripe est déclenchée
**And** je vois le résultat (succès ou nouvel échec avec raison)

**Given** je consulte un impayé persistant
**When** je clique "Suspendre manuellement"
**Then** je vois une confirmation "Êtes-vous sûr ? L'accès sera révoqué"
**And** après confirmation, le créateur est suspendu immédiatement

**Given** je suspends manuellement Marc
**When** l'action est exécutée
**Then** l'action est loggée dans l'audit trail avec timestamp et raison

---

### Story 3.3: Auto-blocage intelligent

As a SUPERADMIN,
I want que le système bloque automatiquement les impayés persistants,
So that je n'aie pas à surveiller manuellement chaque cas.

**Acceptance Criteria:**

**Given** un créateur a un paiement échoué depuis 7 jours
**When** le système exécute la vérification quotidienne
**Then** le créateur est automatiquement suspendu
**And** une notification email est envoyée au créateur
**And** l'action apparaît dans mes alertes

**Given** un créateur a 3 tentatives de paiement échouées
**When** la 3ème tentative échoue
**Then** le créateur est automatiquement suspendu (même si < 7 jours)
**And** une notification email est envoyée

**Given** un créateur est auto-bloqué
**When** je consulte son dossier
**Then** je vois "Suspendu automatiquement" avec la raison (7j ou 3 tentatives)
**And** je peux "Réactiver manuellement" si le paiement est régularisé

**Given** Marc met à jour sa carte et le paiement passe
**When** je clique "Réactiver"
**Then** son accès est restauré immédiatement
**And** l'action est loggée
