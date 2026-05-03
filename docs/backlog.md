# MVP Execution Backlog (EU-first, Telegram-only)

## Scope
- Align current codebase with PRD and NFR for MVP
- No scope expansion, no new channels
- Priority absolute: payment -> access reliability
- Rule: one PR per NFR objective

## Execution plan (10-12 jours)
- Phase 0 (0.5-1j): decisions + configs
- Phase 1 (3-4j): P0 reliability
- Phase 2 (2-3j): P1 compliance + support
- Phase 3 (2-3j): P1 observability + tests
- Phase 4 (1j): P2 docs + polish

## Phase 0 - Decisions and setup (P0)

### P0-01 EU data residency check
- Goal: confirm data residency for Neon, Upstash, Fly, Netlify
- AC:
  - Providers confirmed in EU regions
  - Doc note added in `docs/architecture.md`

### P0-02 Stripe Connect non-MoR alignment
- Goal: confirm charge model and legal posture consistent with non-MoR MVP
- AC:
  - ADR written with decision and rationale
  - Stripe flow documented in `docs/architecture.md`

### P0-03 Grace period default
- Goal: default grace period = 3-7 days configurable
- AC:
  - Config constant or env in API
  - Value used in access revoke logic

### P0-04 Retention policy baseline
- Goal: define retention for audit logs and payment events
- AC:
  - ADR written with retention durations
  - Retention values available as config

## Phase 1 - Reliability and access (P0)

Execution order: start with P0-13 and P0-14 before any other Phase 1 tasks.

### P0-13 Grace period on payment failure
- Goal: keep access during grace, revoke after grace if unpaid
- AC:
  - graceUntil stored on subscription or access
  - Revoke scheduled when grace expires
  - Notification on failure and on revoke

### P0-14 Queue retries and DLQ
- Goal: retries cover >= 24h with backoff and DLQ
- AC:
  - Retry policy updated to >= 24h window
  - Failed jobs moved to DLQ
  - Manual replay endpoint exists

### P0-10 Access source of truth
- Goal: single state machine for access using ChannelAccess
- AC:
  - Allowed states: PENDING, GRANTED, REVOKE_PENDING, REVOKED
  - ChannelAccess is the only source of truth for access state
  - No new AccessGrant table in Phase 1
  - State stored in DB and updated only via defined transitions
  - Idempotent update on duplicate events
  - Documentation in `docs/architecture.md`

### P0-11 Webhook idempotence hardening
- Goal: protect from duplicate or out of order webhooks
- AC:
  - Unique constraint enforced for payment events
  - Upsert or transaction prevents double grant
  - Tests cover duplicate event scenarios

### P0-12 Grant and revoke pipeline latency
- Goal: payment confirmed -> access granted in < 2s P95
- AC:
  - Job priority or direct path used for grant
  - Metric recorded for end to end latency
  - Alert threshold defined

### P0-15 Support replay and manual actions
- Goal: allow support to replay or force grant or revoke
- AC:
  - Endpoint exists with Support role only
  - Action is logged in audit log

### P0-16 Audit log minimal
- Goal: baseline audit log coverage in Phase 1
- AC:
  - AuditLog.create for grant, revoke, replay, webhooks
  - Retention policy applied

## Phase 2 - Compliance and support (P1)

### P1-01 Audit log enrichment
- Goal: enrich audit log fields and reporting
- AC:
  - Add metadata and correlation ids for sensitive actions
  - Document audit log schema and usage

### P1-02 RBAC enforcement for support
- Goal: least privilege for Support and Admin
- AC:
  - Support can only read plus manual actions
  - Admin cannot access payment secrets
  - Tests cover RBAC boundaries

### P1-03 RGPD export workflow
- Goal: export data for creator on request
- AC:
  - Export job exists and produces archive
  - Completion logged and tracked for SLA < 30 days

### P1-04 RGPD delete workflow
- Goal: delete or pseudonymize user data on request
- AC:
  - Access revoked and tokens removed
  - Deletion or pseudonymization logged

## Phase 3 - Observability and tests (P1)

### P1-10 Metrics and alerting
- Goal: visibility on webhook and access reliability
- AC:
  - Metrics for webhook success, job failures, queue lag
  - Alerts for webhook failure rate and latency

### P1-11 E2E tests for payment flows
- Goal: cover critical flows end to end
- AC:
  - Stripe success -> grant
  - Stripe payment failed -> grace -> revoke
  - Stars payment -> grant

### P1-12 Runbook and replay procedure
- Goal: operational readiness for incidents
- AC:
  - Runbook doc for replay and DLQ
  - Manual steps verified in staging

## Phase 4 - Docs and polish (P2)

### P2-01 Architecture doc update
- Goal: document target architecture and boundaries
- AC:
  - `docs/architecture.md` updated with state machine and flows

### P2-02 Ops checklist update
- Goal: align setup docs with new config
- AC:
  - `docs/setup.md` and `docs/environment.md` updated

---

## Affiliation — Consolidation

État actuel validé :
- Lien affilié fonctionnel
- Tracking clic OK
- Checkout Stripe OK
- Webhook Stripe reçu
- AffiliateReferral créé avec commission correcte
- Dashboard affiche conversions et earnings

### P0 — Avant mise en prod

#### AFF-P0-01 Gestion remboursement Stripe
- Goal: AffiliateReferral passe en CANCELLED sur refund
- AC:
  - Webhook `charge.refunded` traité
  - AffiliateReferral.status = CANCELLED
  - pendingEarnings et totalEarnings décrémentés
  - Tests couvrent le scénario refund

#### AFF-P0-02 Séparation webhook Stripe dev/prod
- Goal: secrets webhook distincts par environnement
- AC:
  - Endpoint DEV utilise secret DEV
  - Endpoint PROD utilise secret PROD
  - Vérification dans dashboard Stripe

#### AFF-P0-03 Validation commissions multi-instance
- Goal: éviter double validation en multi-instance
- AC:
  - Lock Redis sur cron validation OU
  - Validation déplacée dans worker BullMQ
  - Une commission ne peut pas être validée deux fois
  - Tests couvrent concurrence

### P1 — UX Améliorations

#### AFF-P1-01 Copie lien affilié
- Goal: bouton "Copier le lien affilié" dans la liste
- AC:
  - Bouton copie visible sur chaque ligne affilié
  - Feedback visuel après copie

#### AFF-P1-02 Page détail conversion
- Goal: vue détaillée d'une conversion/commission
- AC:
  - Page `/affiliates/[id]/conversions/[conversionId]`
  - Affiche montant, date, statut, lien Stripe

#### AFF-P1-03 Actions sur commissions
- Goal: actions admin sur les commissions
- AC:
  - Action "Marquer comme payée"
  - Action "Annuler"
  - Action "Voir dans Stripe"
  - Audit log pour chaque action

#### AFF-P1-04 Empty states
- Goal: améliorer les empty states affiliation
- AC:
  - Message explicite si pas de clics
  - Message explicite si pas de conversions
  - CTA pour partager le lien

### P2 — Améliorations futures

#### AFF-P2-01 Séparation BDD dev/prod
- Goal: branches Neon distinctes pour dev et prod
- AC:
  - Branch Neon dev créée
  - DATABASE_URL dev pointe vers branch dev
  - Docs mis à jour

#### AFF-P2-02 Analytics PostHog
- Goal: events PostHog pour affiliation
- AC:
  - Event `affiliate_click`
  - Event `affiliate_conversion`
  - Event `commission_validated`
  - Event `commission_paid`

#### AFF-P2-03 Dashboard affilié public
- Goal: page publique pour l'affilié
- AC:
  - Accès via token unique
  - Affiche stats et historique
  - Pas de login requis
