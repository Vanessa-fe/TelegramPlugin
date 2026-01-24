# Architecture fonctionnelle et technique

## Vue d’ensemble

- **Objectif produit** : SaaS qui vend l’accès à des canaux Telegram (et, à terme, autres messageries) via des abonnements ou achats uniques.
- **Modules principaux** :
  - `Frontend` (Next.js) : dashboard administrateur, portail client, pages publiques.
  - `Backend API` (NestJS) : gestion des utilisateurs, offres, abonnements, webhooks de paiement, orchestration des invitations.
  - `Worker & File d’attente` (BullMQ/Redis) : exécution idempotente des tâches sensibles (envoi/révocation d’invitations, relances).
  - `Bot Telegram` (grammY) : interface avec l’API Telegram pour générer/annuler des liens et gérer les membres des canaux.
  - `Base de données` (PostgreSQL + Prisma) : stockage persistant, migrations.
  - `Observabilité & Sécurité` : logs structurés (Pino), Sentry, métriques basiques, gestion des secrets.

## Stack technique

- **Frontend** : Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query/TanStack Query pour gérer les appels API.
- **Backend** : NestJS (Fastify adapter), TypeScript, Prisma ORM, PostgreSQL, Zod pour la validation, JWT pour l’auth admin, sessions Telegram côté client via widget.
- **Tâches asynchrones** : BullMQ + Redis (mode worker), réessais exponentiels, déduplication via jobId déterministe.
- **Bot** : grammY avec Webhook HTTP (piloté par le backend) ou long-polling en mode worker séparé (configurable).
- **Paiements** : Stripe (Checkout + Billing), webhooks signés ; couche d’abstraction pour intégrer PayPal plus tard.
  - Abonnement SaaS créateur facturé sur le compte Stripe plateforme.
  - Ventes acheteurs traitées en direct charges sur le compte Connect du créateur.
  - Stripe gère fonds, refunds, litiges, reçus ; la plateforme gère logs PaymentEvent et accès.
  - Checkout acheteur sur compte Connect via header stripeAccount, sans transfer_data ni application_fee.
  - Webhooks paiements acheteurs = events Connect (event.account). Decision: non-MoR (voir `docs/adr/ADR-001-stripe-connect-direct-charges.md`).
- **Infra** : Docker Compose dev, déploiement sur Railway/Render/VPS, DB managée (Neon, Supabase ou Railway), reverse proxy (Traefik/Caddy/nginx) si nécessaire.
- **CI/CD** : GitHub Actions (tests, lint, build, déploiement), Prisma migrate dans le pipeline.

## Residence des donnees (UE)

- **Objectif** : data residency UE, Frankfurt (eu-central-1) par defaut si incertain.
- **PostgreSQL (Neon)** : EU - Frankfurt (eu-central-1).
- **Redis/BullMQ (Upstash)** : EU - Frankfurt (eu-central-1).
- **API (Fly.io)** : primary_region = fra (Paris).
- **Frontend (Netlify)** : edge global (CDN) ; donnees sensibles reste cote API/DB/Redis en UE.

## Domaines fonctionnels

- **Gestion des organisations** : chaque client (entreprise/créateur) possède ses produits, plans tarifaires et canaux.
- **Monétisation** : types d’accès (one-shot, abonnement, essai gratuit), codes promo, coupons.
- **Accès Telegram** : génération d’invitations, suivi de leur usage, révocation, suppression utilisateur si paiement échoue.
- **Conformité (GDPR)** : export des données, anonymisation, suppression sur demande.
- **Administration** : logs, analytics simples (MRR, churn, top clients), suivi des événements bot/paiement.

## Modèle de données (premier jet)

- `User` : compte admin interne (staff) et comptes organisation (multi-tenancy léger).
- `Customer` : client final qui achète un accès.
- `Organization` : entité qui possède les produits et canaux.
- `Product` : offre commerciale (ex. canal Telegram Premium).
- `Plan` : déclinaison tarifaire (mensuel, annuel, one-shot, essai).
- `Subscription` : relation client/plan, inclut statut, dates de facturation, métadonnées Stripe.
- `PaymentEvent` : journal des webhooks paiements (idempotence).
- `Channel` : ressource Telegram (ou futur Discord) liée à un produit.
- `ChannelAccess` : trace de l’accès octroyé (invitation, date expiration, statut).
- `TelegramInvite` : lien généré, nombre d’utilisations restant, date d’expiration.
- `AuditLog` : actions critiques (ajout/retrait membre, remboursement, suppression).
- `DataExport` : job d'export RGPD (statut, SLA, archive).

## Audit log (schema + usage)

- Champs: `organizationId`, `actorId`, `actorType`, `action`, `resourceType`, `resourceId`, `correlationId`, `metadata`, `createdAt`.
- `correlationId`: `x-correlation-id` ou `x-request-id` pour les actions manuelles; `event.id` pour Stripe.
- `metadata`: objet JSON, enrichi selon l’action (ex: `reason`, `queue`, `jobId`, `subscriptionId`, `eventType`).
- Actions sensibles: support/admin manual, replay DLQ, webhooks paiement, revoke/grant system.

## Etat d'acces (ChannelAccess)

### Source de vérité

`ChannelAccess.status` est la source unique de vérité pour l'état d'accès d'un client à un channel.

### State Machine

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    ▼                                                 │
┌─────────┐    ┌─────────┐    ┌────────────────┐    ┌─────────┐      │
│ PENDING │───▶│ GRANTED │───▶│ REVOKE_PENDING │───▶│ REVOKED │      │
└─────────┘    └─────────┘    └────────────────┘    └─────────┘      │
     │              │                  │                  │           │
     │              │                  │                  │           │
     │              ▼                  ▼                  │           │
     │         [Bot génère       [Grace period          │           │
     │          invite link]      en cours]              │           │
     │                                                   │           │
     └───────────────────────────────────────────────────┴───────────┘
                         (Échec définitif)
```

### Transitions

| De | Vers | Trigger | Action |
|----|------|---------|--------|
| - | `PENDING` | Payment success | Création ChannelAccess + job grant-access |
| `PENDING` | `GRANTED` | Worker success | Bot génère invite, notifie client |
| `PENDING` | `REVOKED` | Échec après retries | Job en DLQ, accès non accordé |
| `GRANTED` | `REVOKE_PENDING` | Payment failed | Grace period démarre (graceUntil) |
| `GRANTED` | `REVOKED` | Cancellation/Refund | Révocation immédiate |
| `REVOKE_PENDING` | `GRANTED` | Payment recovered | Grace annulée, accès maintenu |
| `REVOKE_PENDING` | `REVOKED` | Grace expired | Scheduler révoque accès |

### Grace Period

- **Durée par défaut**: 5 jours (configurable via `GRACE_PERIOD_DAYS`)
- **Déclencheur**: `invoice.payment_failed` webhook
- **Stockage**: `Subscription.graceUntil` timestamp
- **Scheduler**: `handleExpiredGracePeriods()` toutes les 15 minutes
- **Notification**: Client notifié à l'échec et à la révocation

### Queues et Retries

| Queue | Retries | Backoff | Fenêtre totale |
|-------|---------|---------|----------------|
| `grant-access` | 10 | Expo 5min | ~42 heures |
| `revoke-access` | 10 | Expo 5min | ~42 heures |

Après épuisement des retries, les jobs sont déplacés vers les DLQ:
- `grant-access-dlq`
- `revoke-access-dlq`

Voir [Runbook DLQ](./runbook-dlq-replay.md) pour les procédures de replay.

## Flux critiques

1. **Onboarding d’une organisation**
   - Admin crée une organisation dans le dashboard.
   - L’organisation connecte Stripe (OAuth) ou configure les clés API.
   - L’organisation ajoute un canal Telegram (bot devient admin) et crée un produit/plan.

1. **Achat client final**
   - Client arrive sur la page de vente (`/client/{slug}`), choisit un plan.
   - Redirection vers Stripe Checkout (compte Connect via stripeAccount).
   - Webhook Stripe Connect (payment_intent.succeeded / checkout.session.completed, event.account) réceptionné par l’API.
   - Création ou mise à jour du `Customer`, du `Subscription`.
   - Envoi d’un job asynchrone `GrantAccessJob` avec `subscriptionId`.
   - Worker appelle le Bot API pour générer (ou récupérer) un `TelegramInvite`, puis l’envoie au client (email/Telegram bot) ou retourne via portail.

1. **Échec paiement avec grace period**
   - Webhook Stripe `invoice.payment_failed` réceptionné.
   - `Subscription.status` → `PAST_DUE`, `graceUntil` = now + 5 jours.
   - `ChannelAccess.status` → `REVOKE_PENDING` (accès maintenu pendant grace).
   - Notification client: "Paiement échoué, vous avez 5 jours pour régulariser".
   - **Si paiement récupéré**: `Subscription` → `ACTIVE`, `ChannelAccess` → `GRANTED`.
   - **Si grace expire**: Scheduler détecte `graceUntil < now`, job `RevokeAccessJob` envoyé.

1. **Annulation / Refund**
   - Webhook Stripe `customer.subscription.deleted` ou `charge.refunded`.
   - `Subscription.status` → `CANCELED`.
   - Job `RevokeAccessJob` envoyé immédiatement (pas de grace).
   - Bot supprime l'utilisateur du canal ou invalide l'invitation.
   - Notification au client: "Votre accès a été révoqué".

1. **Export RGPD**
   - Admin déclenche un export (API `data-exports`).
   - Job `DataExport` créé (SLA 30 jours).
   - Scheduler traite les exports en attente et génère un archive JSON.
   - Completion loggée dans `AuditLog`.

1. **Suppression RGPD**
   - Admin supprime un customer ou une organization via l'API.
   - Donnees personnelles anonymisees (soft delete).
   - Acces revoques et jobs associes enregistres.
   - Action loggee dans `AuditLog`.

1. **Renouvellement / upgrade**
   - Stripe gère la facturation récurrente.
   - Webhook déclenche mise à jour du `Subscription` et refresh d’expiration côté `ChannelAccess`.

## Structure de code envisagée

```text
packages/
  api/            # NestJS (modules par domaine)
  bot/            # grammY, logique Telegram
  frontend/       # Next.js (app router)
  worker/         # BullMQ processors (peut vivre dans api si simple)
  shared/         # librairies communes (schemas Zod, SDK client)
infra/
  docker/         # Dockerfiles, compose
  terraform/      # (optionnel) IaC futur
docs/
  architecture.md # ce document
```

## Sécurité & conformité

- JWT admin avec rotation des refresh tokens, stockage cookies HttpOnly.
- Limiter l’accès aux API via API Keys par organisation pour automatisations.
- Vérification des signatures webhooks Stripe, stockage des événements avant traitement (idempotence).
- Rate limiting sur endpoints publics, protection CSRF pour les formulaires.
- Politique de sauvegarde PostgreSQL (snapshots quotidiens), secrets en variables d’environnement.

## Observabilité

- Logs JSON via Pino (corrélation par `requestId`).
- Sentry pour backend/bot/frontend.
- Healthchecks : `/healthz`, `/readyz`.
- Métriques Prometheus : `/metrics`.
- Dashboard d'alerte simple (uptime robot ou statuspage).

### Métriques Prometheus

Endpoint: `GET /metrics` (public, pas d'auth pour scraping).

| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `webhook_requests_total` | Counter | `provider`, `event_type`, `status` | Total webhooks reçus (success/error) |
| `webhook_duration_seconds` | Histogram | `provider`, `event_type` | Durée traitement webhook |
| `queue_jobs_total` | Counter | `queue`, `status` | Total jobs (completed/failed) |
| `queue_job_duration_seconds` | Histogram | `queue` | Durée traitement job |
| `queue_waiting_jobs` | Gauge | `queue` | Jobs en attente (waiting + active) |

Labels `provider`: `stripe`, `telegram_stars`.
Labels `queue`: `grant-access`, `revoke-access`, `grant-access-dlq`, `revoke-access-dlq`.

### Seuils d'alerte recommandés

| Alerte | PromQL | Seuil | Severité |
|--------|--------|-------|----------|
| WebhookHighFailureRate | `rate(webhook_requests_total{status="error"}[5m]) / rate(webhook_requests_total[5m])` | > 5% | critical |
| WebhookHighLatency | `histogram_quantile(0.95, rate(webhook_duration_seconds_bucket[5m]))` | > 2s | warning |
| QueueHighBacklog | `queue_waiting_jobs` | > 100 | warning |
| DLQNonEmpty | `queue_waiting_jobs{queue=~".*-dlq"}` | > 0 | critical |

### Logs métriques (Worker)

Le worker émet des logs structurés pour le monitoring:

```json
{
  "metric": "access_grant_latency_ms",
  "latencyMs": 1234,
  "queue": "grant-access",
  "jobId": "..."
}
```

Alertes côté logs (Datadog/Grafana Loki):
- `metric:access_grant_latency_ms latencyMs:>2000` → latence excessive
- `level:error queue:*` → échec job

### Opérations et runbooks

- **Runbook DLQ et replay**: [docs/runbook-dlq-replay.md](./runbook-dlq-replay.md)
  - Diagnostic des jobs en échec
  - Procédures de replay via API
  - Actions support manuelles (force grant/revoke)
  - Troubleshooting guide

## Roadmap MVP (résumé)

1. Setup projet monorepo + tooling (TurboRepo ou Nx).
2. Auth admin + onboarding organisation, gestion produits/plans.
3. Intégration Stripe Checkout + webhooks + pipeline d’invitation Telegram.
4. Dashboard analytics basiques (MRR, nombre de clients, logs bot).
5. Docs de déploiement (Docker Compose, instructions Railway/Render).
6. Gestion export/suppression données utilisateur.

## Ouvertures futures

- Support Discord/WhatsApp via interface `ChannelProvider`.
- Ajout d’autres PSP (PayPal, Paddle) en appliquant le même pattern `PaymentProvider`.
- Marketplace de templates de landing pages pour les créateurs.
- Intégration CRM (HubSpot, Notion) et emailing (Customer.io, Mailjet).
