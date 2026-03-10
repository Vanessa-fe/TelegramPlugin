# Travaux restants - Dashboard SUPERADMIN

**Date:** 2026-03-10
**Basé sur:** brainstorming-session-2026-03-06.md + prd-superadmin.md

---

## Statut actuel

| Phase | Progression | Commentaire |
|-------|-------------|-------------|
| Phase 1 MVP | 85% | VIP + KPIs OK, actions paiements incomplètes |
| Phase 2 | 0% | Créateurs 360°, tickets, churn |
| Phase 3 | 0% | RBAC, support agent |
| Phase 4 | 0% | Ambassadeurs, fidélité, automatisations |

---

## Phase 1 MVP - À terminer

### 1. Suspension manuelle créateur
**Priorité:** Haute
**PRD:** FR22

**À faire:**
- [ ] Backend: endpoint `POST /admin/organizations/:id/suspend`
- [ ] Backend: mettre `saasActive = false` + révoquer accès Telegram
- [ ] Frontend: bouton "Suspendre" dans fiche créateur/impayés
- [ ] Frontend: confirmation modale avant action
- [ ] Backend: audit log de l'action

**Fichiers concernés:**
- `packages/api/src/modules/organizations/organizations.controller.ts`
- `packages/api/src/modules/organizations/organizations.service.ts`
- `packages/frontend/src/app/admin/payments/page.tsx`
- `packages/frontend/src/app/admin/creators/page.tsx`

---

### 2. Auto-blocage après 7 jours ou 3 tentatives
**Priorité:** Haute
**PRD:** FR23

**À faire:**
- [ ] Backend: job worker pour vérifier les impayés quotidiennement
- [ ] Backend: logique de comptage tentatives échouées par subscription
- [ ] Backend: auto-suspension si 7j OU 3 tentatives
- [ ] Backend: notification email au créateur avant blocage (J+5 warning?)
- [ ] Backend: notification email au créateur lors du blocage
- [ ] Dashboard: indicateur "blocage imminent" dans vue impayés

**Fichiers concernés:**
- `packages/worker/src/` - nouveau job `check-unpaid-subscriptions`
- `packages/api/src/modules/admin-dashboard/admin-dashboard.service.ts`
- `packages/shared/src/queues.ts` - nouvelle queue

---

### 3. Relance paiement directe (optionnel)
**Priorité:** Moyenne
**PRD:** FR21

**Statut actuel:** Lien vers Stripe invoice disponible

**À faire (si souhaité):**
- [ ] Backend: endpoint `POST /admin/subscriptions/:id/retry-payment`
- [ ] Backend: appel Stripe API pour relancer le paiement
- [ ] Frontend: bouton "Relancer paiement" dans vue impayés

---

### 4. Contact créateur intégré (optionnel)
**Priorité:** Basse
**PRD:** FR20

**Statut actuel:** Email visible, copie possible

**À faire (si souhaité):**
- [ ] Frontend: bouton "Contacter" ouvre mailto: ou formulaire
- [ ] Backend: templates email pour relance impayé
- [ ] Backend: endpoint envoi email via Brevo

---

## Phase 2 - Gestion complète

### 5. Fiche créateur 360°
**Priorité:** Moyenne
**PRD:** FR24-FR27
**Brainstorming:** CREA-1 à CREA-4

**À faire:**
- [ ] Frontend: page détail créateur enrichie `/admin/creators/[id]`
- [ ] Sections: profil, activité, revenus, historique paiements
- [ ] Timeline chronologique des actions
- [ ] Métriques: produits créés, canaux, abonnés actifs, revenus générés
- [ ] Backend: endpoint enrichi avec toutes les données

**Fichiers à créer:**
- `packages/frontend/src/app/admin/creators/[id]/page.tsx`
- `packages/api/src/modules/admin-dashboard/dto/creator-detail.dto.ts`

---

### 6. Score santé créateur
**Priorité:** Moyenne
**PRD:** FR25, FR28
**Brainstorming:** CREA-5

**À faire:**
- [ ] Backend: calcul du score basé sur:
  - Dernière connexion (> 14j = orange, > 30j = rouge)
  - Activité récente (offres créées, ventes)
  - Statut paiements
  - Tendance revenus
- [ ] Backend: endpoint `/admin/creators/:id/health-score`
- [ ] Frontend: badge coloré 🟢🟠🔴 dans liste et fiche
- [ ] Dashboard: compteur créateurs à risque (remplacer le hardcodé 0)

**Fichiers concernés:**
- `packages/api/src/modules/admin-dashboard/admin-dashboard.service.ts`
- `packages/frontend/src/app/admin/creators/page.tsx`

---

### 7. Système tickets support
**Priorité:** Moyenne
**PRD:** FR29-FR33
**Brainstorming:** SUP-1 à SUP-11

**À faire:**
- [ ] Database: table `Ticket` (id, creatorId, subject, status, priority, createdAt, updatedAt)
- [ ] Database: table `TicketMessage` (id, ticketId, authorType, content, createdAt)
- [ ] Backend: CRUD tickets + messages
- [ ] Frontend créateur: formulaire soumission ticket
- [ ] Frontend admin: liste tickets `/admin/tickets`
- [ ] Frontend admin: vue Kanban (Nouveau → En cours → Résolu)
- [ ] Frontend admin: réponse intégrée
- [ ] Dashboard: compteur vrais tickets non répondus

**Fichiers à créer:**
- `packages/api/prisma/schema.prisma` - tables Ticket, TicketMessage
- `packages/api/src/modules/tickets/`
- `packages/frontend/src/app/admin/tickets/`
- `packages/frontend/src/app/dashboard/support/` (côté créateur)

---

### 8. Recherche universelle
**Priorité:** Basse
**Brainstorming:** SUP-11

**À faire:**
- [ ] Backend: endpoint `/admin/search?q=...`
- [ ] Recherche dans: emails, noms créateurs, noms organisations
- [ ] Frontend: barre de recherche dans header admin
- [ ] Résultats groupés par type

---

### 9. Indicateur risque churn
**Priorité:** Moyenne
**PRD:** FR35-FR36
**Brainstorming:** RET-1 à RET-4

**À faire:**
- [ ] Utiliser le score santé pour identifier les créateurs 🟠 et 🔴
- [ ] Dashboard: liste créateurs à risque cliquable
- [ ] Alerte proactive: notification si score passe en 🔴

---

## Phase 3 - Scale & Support

### 10. RBAC - Rôles et permissions
**Priorité:** Basse (quand embauche support)
**PRD:** FR34
**Brainstorming:** SEC-1

**À faire:**
- [ ] Database: enum `UserRole` étendu (SUPERADMIN, SUPPORT_AGENT)
- [ ] Backend: guards par rôle sur chaque endpoint
- [ ] Support voit: tickets, créateurs (sans finances)
- [ ] Support ne voit pas: revenus, Stripe, suspension

---

### 11. Formulaire churn
**Priorité:** Basse
**PRD:** FR37-FR38
**Brainstorming:** RET-2, SIMP-3

**À faire:**
- [ ] Frontend: formulaire lors de la résiliation (plans payants uniquement)
- [ ] Options: prix, fonctionnalités manquantes, autre solution, autre
- [ ] Backend: stockage raisons
- [ ] Dashboard: analytics raisons de départ

---

## Phase 4 - Croissance

### 12. ROI tracking VIP avancé
**Brainstorming:** VIP-5

**Statut:** Métriques basiques présentes (offres, ventes)

**À faire:**
- [ ] Tracker revenus cumulés post-conversion
- [ ] Calcul ROI: revenus générés vs coût acquisition
- [ ] Dashboard: top VIP convertis par revenus

---

### 13. Rapport VIP automatique
**Brainstorming:** VIP-6, BIZ-5

**À faire:**
- [ ] Job worker: email auto 1 mois après activation
- [ ] Contenu: "Vous avez généré X€, créé Y produits, Z abonnés"
- [ ] But: faciliter la conversion des trials

---

### 14. Programme ambassadeurs
**Brainstorming:** BIZ-1

**À faire:**
- [ ] Identifier créateurs 🟢 constants depuis 6+ mois
- [ ] Système de badges/statuts
- [ ] Avantages ambassadeurs (à définir)

---

### 15. Fidélité auto-récompense
**Brainstorming:** BIZ-2

**À faire:**
- [ ] Détecter créateurs 🟢 depuis 6 mois
- [ ] Offrir automatiquement 1 mois gratuit
- [ ] Notification email de remerciement

---

## Quick wins pour plus tard

| ID | Feature | Complexité | Impact |
|----|---------|------------|--------|
| SIMP-2 | Tickets sans catégories V1 | ⭐ | Shipper vite |
| SIMP-3 | Formulaire churn plans payants only | ⭐ | Ciblé |
| DASH-2 | Badges améliorés (animation?) | ⭐ | UX |
| SUP-5 | Réponse ticket intégrée | ⭐⭐ | Efficacité |

---

## Ordre de priorité recommandé

### Immédiat (terminer MVP)
1. ⚡ Suspension manuelle créateur
2. ⚡ Auto-blocage 7j/3 tentatives

### Court terme (Phase 2 core)
3. Score santé créateur (débloquer dashboard complet)
4. Fiche créateur 360°
5. Système tickets basique

### Moyen terme
6. Recherche universelle
7. Formulaire churn

### Long terme (quand volume le justifie)
8. RBAC
9. Programme ambassadeurs
10. Automatisations (rapports, fidélité)

---

## Notes techniques

### Dépendances
- Auto-blocage dépend de: worker jobs, système email
- Score santé utilisé par: dashboard, liste créateurs, alertes churn
- Tickets utilisé par: dashboard (compteur), fiche créateur

### Patterns existants à réutiliser
- VIP invitations: bon exemple de CRUD complet avec enrichissement
- Gift codes: bon exemple de système avec usages/tracking
- Dashboard stats: pattern agrégation données

### Stack reminder
- Frontend: Next.js 15, shadcn/ui, Tailwind
- Backend: NestJS 11, Prisma, PostgreSQL
- Jobs: BullMQ worker
- Email: Brevo (Sendinblue)
