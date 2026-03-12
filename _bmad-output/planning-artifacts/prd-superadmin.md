---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - _bmad-output/analysis/brainstorming-session-2026-03-06.md
  - _bmad-output/planning-artifacts/prd.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 1
classification:
  projectType: saas_b2b_admin
  domain: fintech
  complexity: medium
  projectContext: brownfield
  targetUser: superadmin_single
workflowType: 'prd'
date: '2026-03-06'
---

# Product Requirements Document - Dashboard SUPERADMIN

**Author:** Vanessa
**Date:** 2026-03-06

## Executive Summary

Dashboard interne SUPERADMIN pour piloter le SaaS TelegramPlugin. Outil de gestion et monitoring pour l'opératrice de la plateforme (single-user MVP), permettant : acquisition via système VIP influenceurs, visibilité temps réel sur les alertes critiques, gestion des créateurs et paiements, préparation au scale.

## Success Criteria

### User Success

- Voir les alertes critiques (tickets, impayés, churn) en < 1 seconde
- Inviter un influenceur VIP en < 30 secondes
- Avoir confiance totale que rien n'échappe au radar
- Priorité alertes : 1) Tickets non répondus 2) Impayés 3) Signes de churn

### Business Success

- **Court terme** : Convertir les influenceurs VIP invités en clients payants
- **Moyen terme** : Identifier les patterns de churn avant qu'ils deviennent critiques
- **Long terme** : Passer < 1h/semaine sur l'admin même avec 100+ clients

### Technical Success

- Dashboard charge en < 2 secondes
- Alertes mises à jour en temps réel (pas de refresh manuel)
- Intégration seamless avec le système grant/revoke existant

### Measurable Outcomes

- Temps d'invitation VIP : < 30 secondes
- Visibilité problème : < 1 seconde (alertes visibles dès ouverture)
- Taux de conversion VIP trackable et mesurable
- Temps de réponse tickets : objectif < 24h (alerte si dépassé)

## Product Scope

### MVP (Phase 1)

- Système VIP complet : invitation email, tableau tracking, alertes pré-expiration, extension manuelle
- CEO View basique : KPIs essentiels (nouveaux clients, revenus, alertes), badges notifications
- Gestion paiements : vue impayés avec historique, workflow escalade, auto-blocage 7j/3 tentatives

### Growth (Phase 2-3)

- Fiche créateur 360° avec timeline et métriques
- Score santé créateur (vert/orange/rouge)
- Système tickets avec vue Kanban
- Dashboard agent support (préparation embauche)
- RBAC et rôles
- Formulaire churn et analytics rétention

### Vision (Phase 4+)

- Programme ambassadeurs automatisé
- Fidélité auto-récompense
- FAQ auto-générée depuis tickets
- Insights roadmap depuis demandes récurrentes
- Rapport VIP automatique aux influenceurs

## User Journeys

### Journey 1 - Morning Check (Happy Path)

**Persona :** Vanessa, SUPERADMIN - "Est-ce que tout va bien ?"

**Scène d'ouverture :** Lundi 8h30, café en main, laptop ouvert. Vanessa veut savoir en 1 seconde s'il y a des problèmes.

**Action :** Elle arrive sur le dashboard et voit immédiatement :
- 🔴 2 tickets non répondus
- 🟠 1 impayé depuis 3 jours
- 🟢 Reste : tout va bien

**Climax :** Elle clique sur le badge rouge "2 tickets", voit les détails, traite les urgences.

**Résolution :** En 2 minutes, elle sait exactement où elle en est. Café encore chaud.

### Journey 2 - Invitation VIP (Happy Path)

**Persona :** Vanessa invite Sophie, influenceuse Telegram intéressée

**Scène d'ouverture :** DM terminé sur Telegram, Sophie a envoyé son email pour tester la plateforme.

**Action :**
1. Vanessa va dans "Invitations VIP"
2. Entre l'email de Sophie + paramètres personnalisés (Plan Pro, 1 mois gratuit)
3. Clic → Sophie reçoit un email avec lien d'inscription personnalisé

**Climax :** Sophie clique, crée son compte, connecte Stripe et son bot Telegram.

**Résolution :** Dans le tableau VIP, Vanessa voit :
- Compte activé ✅
- Stripe connecté ✅
- Bot Telegram lié ✅
- 2 offres créées
- 12 ventes / 340€ générés
- 18 jours restants sur le trial

**Recovery si problème :** Sophie n'active pas après 5 jours → Alerte 🟠 → Vanessa peut relancer ou prolonger le trial.

### Journey 3 - Gestion Impayé (Edge Case)

**Persona :** Vanessa gère Marc, créateur avec paiement échoué depuis 4 jours

**Scène d'ouverture :** Dashboard matin, badge 🟠 "1 impayé" visible.

**Action :**
1. Clic sur l'alerte → Fiche impayé de Marc
2. Informations visibles : 3 tentatives échouées, carte expirée, dernier contact jamais
3. Options disponibles : Contacter Marc, Relancer le paiement, Suspendre manuellement

**Climax :** Vanessa envoie un message à Marc. Il met à jour sa carte. Paiement réussi.

**Résolution :** Marc repasse en 🟢, accès maintenu, situation résolue.

**Échec :** Pas de réponse après 7 jours → Auto-blocage se déclenche → Marc perd l'accès → Notification envoyée automatiquement.

### Journey 4 - Prévention Churn (Edge Case)

**Persona :** Vanessa observe Lisa, créatrice active qui montre des signes de ralentissement

**Scène d'ouverture :** Dashboard, Lisa apparaît en 🟠 dans la liste créateurs. Score santé dégradé.

**Action :**
1. Clic sur Lisa → Fiche créateur 360°
2. Informations visibles : dernière connexion il y a 12 jours, 0 nouvelles offres en 3 semaines, revenus en baisse
3. Vanessa décide d'observer pour l'instant
4. Option disponible : Contacter Lisa quand elle le décide

**Scénario A - Rétention :** Activité reprend → Score repasse 🟢 → Rien à faire

**Scénario B - Churn :** Score passe 🔴 → Résiliation → Formulaire de sortie → Vanessa comprend pourquoi

### Journey Requirements Summary

**Capabilities révélées par les journeys :**

- Centre d'alertes unifié avec badges (tickets + impayés + churn)
- Système invitation VIP avec paramètres personnalisables (plan, durée)
- Tableau de suivi VIP (activation, connexions, offres créées, ventes générées)
- Fiche impayé avec actions directes (contact, relance paiement, suspension manuelle)
- Fiche créateur 360° avec score santé et timeline activité
- Système de contact intégré (emails et templates)
- Alertes automatiques (expiration VIP, inactivité, délai tickets)
- Formulaire de sortie pour comprendre le churn

## SaaS B2B Admin Specific Requirements

### Project-Type Overview

- Dashboard interne single-user (SUPERADMIN)
- Outil de pilotage, pas produit client-facing
- Extension du système TelegramPlugin existant

### Technical Architecture Considerations

- Lecture/écriture sur la base TelegramPlugin existante
- Intégration Stripe pour actions paiements
- Système email pour contacts créateurs
- Temps réel pour alertes (websockets ou polling)

### Tenant Model

- Single-tenant : une seule utilisatrice (Vanessa)
- RBAC Phase 3 : ajout rôle Support avec accès limité

### Integration List

- PostgreSQL (base existante)
- Stripe API (paiements, relances)
- Système email (Brevo existant)
- Bot Telegram (statuts connexion)

### Implementation Considerations

- Actions critiques avec confirmation
- Audit log pour actions sensibles (suspension, relance)
- Pas de nouvelle infrastructure - réutilise l'existant

## Risk Mitigation Strategy

### Technical Risks
- **Temps réel alertes** : Polling simple d'abord, websockets si nécessaire
- **Intégration Stripe** : API déjà utilisée, patterns existants

### Market Risks
- **Pas encore de clients** : Système VIP = outil d'acquisition prioritaire
- **Validation** : Tester le workflow VIP avec 2-3 vrais influenceurs

### Resource Risks
- **Solo dev** : MVP lean, réutilisation maximale de l'existant
- **Contingency** : Phase 1 peut fonctionner sans Phase 2

## Functional Requirements

### Centre d'Alertes & Dashboard

- FR1 [MVP]: SUPERADMIN peut voir toutes les alertes critiques sur une page unique
- FR2 [MVP]: SUPERADMIN peut voir le nombre de tickets non répondus avec badge
- FR3 [MVP]: SUPERADMIN peut voir le nombre d'impayés avec badge
- FR4 [MVP]: SUPERADMIN peut voir les créateurs à risque de churn avec badge
- FR5 [MVP]: SUPERADMIN peut voir les KPIs essentiels (nouveaux clients, revenus semaine)
- FR6 [MVP]: Système affiche les alertes par ordre de priorité (tickets > impayés > churn)

### Système VIP Influenceurs

- FR7 [MVP]: SUPERADMIN peut créer une invitation VIP avec email
- FR8 [MVP]: SUPERADMIN peut définir le plan et la durée gratuite de l'invitation
- FR9 [MVP]: Système envoie automatiquement un email d'invitation au VIP
- FR10 [MVP]: SUPERADMIN peut voir le tableau des invités VIP avec statut
- FR11 [MVP]: SUPERADMIN peut voir si un VIP a activé son compte
- FR12 [MVP]: SUPERADMIN peut voir si un VIP a connecté Stripe et Telegram
- FR13 [MVP]: SUPERADMIN peut voir les offres créées par un VIP
- FR14 [MVP]: SUPERADMIN peut voir les ventes générées par un VIP
- FR15 [MVP]: SUPERADMIN peut voir les jours restants sur un trial VIP
- FR16 [MVP]: Système alerte quand un trial VIP approche de l'expiration
- FR17 [MVP]: SUPERADMIN peut prolonger manuellement un trial VIP

### Gestion des Paiements

- FR18 [MVP]: SUPERADMIN peut voir la liste des paiements en échec
- FR19 [MVP]: SUPERADMIN peut voir l'historique des tentatives pour un impayé
- FR20 [MVP]: SUPERADMIN peut contacter un créateur avec impayé
- FR21 [MVP]: SUPERADMIN peut relancer manuellement un paiement
- FR22 [MVP]: SUPERADMIN peut suspendre manuellement un créateur
- FR23 [MVP]: Système bloque automatiquement après 7 jours ou 3 tentatives

### Gestion des Créateurs

- FR24 [Phase 2]: SUPERADMIN peut voir la fiche complète d'un créateur
- FR25 [Phase 2]: SUPERADMIN peut voir le score santé d'un créateur
- FR26 [Phase 2]: SUPERADMIN peut voir la timeline d'activité d'un créateur
- FR27 [Phase 2]: SUPERADMIN peut voir les revenus générés par un créateur
- FR28 [Phase 2]: Système calcule le score santé basé sur activité et paiements

### Support & Tickets

- FR29 [Phase 2]: Créateur peut soumettre un ticket de support
- FR30 [Phase 2]: SUPERADMIN peut voir la liste des tickets
- FR31 [Phase 2]: SUPERADMIN peut voir les tickets par statut (Kanban)
- FR32 [Phase 2]: SUPERADMIN peut répondre à un ticket
- FR33 [Phase 2]: SUPERADMIN peut rechercher un créateur par email ou nom
- FR34 [Phase 3]: Agent Support peut voir les tickets sans accès aux finances

### Rétention & Churn

- FR35 [Phase 2]: SUPERADMIN peut voir les créateurs à risque de churn
- FR36 [Phase 2]: SUPERADMIN peut contacter un créateur à risque
- FR37 [Phase 3]: Créateur voit un formulaire de sortie lors de la résiliation
- FR38 [Phase 3]: SUPERADMIN peut voir les raisons de résiliation

## Non-Functional Requirements

### Performance

- Dashboard charge en < 2 secondes
- Alertes visibles en < 1 seconde après ouverture
- Actions (invitation VIP, relance paiement) confirment en < 3 secondes
- Recherche créateur retourne résultats en < 1 seconde

### Sécurité

- Authentification requise pour accès dashboard
- Sessions expirent après inactivité
- Actions sensibles (suspension, relance) loggées avec timestamp
- Accès limité à SUPERADMIN uniquement (RBAC Phase 3 pour support)

### Intégration

- Lecture temps réel depuis base PostgreSQL existante
- Appels Stripe API pour relances paiement
- Envoi emails via Brevo existant
- Statuts bot Telegram via API existante

### Fiabilité

- Dashboard disponible 99% du temps
- Retry automatique si échec d'action Stripe
- Pas de perte de données lors des actions
