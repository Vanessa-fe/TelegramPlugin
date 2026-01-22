# TelegramPlugin - Documentation Projet

> **SaaS de monétisation Telegram** - Vente d'accès à des canaux Telegram via abonnements ou achats uniques.

**Généré le :** 2026-01-20
**Type :** Monorepo Brownfield
**Track BMM :** BMad Method

---

## Vue d'ensemble

TelegramPlugin est une plateforme SaaS multi-tenant permettant aux créateurs et entreprises de monétiser l'accès à leurs canaux Telegram. L'architecture suit un pattern event-driven avec webhooks de paiement déclenchant des jobs asynchrones pour la gestion des accès.

### Caractéristiques principales

- **Multi-tenant** : Chaque organisation gère ses propres produits, plans et clients
- **Multi-provider payments** : Stripe (Connect marketplace) + Telegram Stars
- **Automatisation complète** : Grant/revoke access via jobs BullMQ
- **Notifications multicanal** : Email (Brevo) + Telegram

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TelegramPlugin Monorepo                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   frontend   │  │     api      │  │     bot      │               │
│  │   Next.js    │  │   NestJS     │  │   grammY     │               │
│  │   Port 3000  │  │   Port 3001  │  │  Long-poll   │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                        │
│         │    HTTP/REST    │   Telegram API  │                        │
│         └────────────────►│◄────────────────┘                        │
│                           │                                          │
│                    ┌──────┴───────┐                                  │
│                    │    worker    │                                  │
│                    │   BullMQ     │                                  │
│                    └──────┬───────┘                                  │
│                           │                                          │
│         ┌─────────────────┼─────────────────┐                        │
│         ▼                 ▼                 ▼                        │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐                 │
│  │ PostgreSQL │    │   Redis    │    │   shared   │                 │
│  │   Prisma   │    │  BullMQ    │    │ Zod/Types  │                 │
│  └────────────┘    └────────────┘    └────────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Packages

| Package | Type | Technologies | Port |
|---------|------|--------------|------|
| **packages/api** | Backend | NestJS 11, Fastify, Prisma, JWT, BullMQ, Stripe | 3001 |
| **packages/frontend** | Web | Next.js 15, React 19, Tailwind 4, Radix UI | 3000 |
| **packages/bot** | Backend | grammY 1.32, Telegram Stars | - |
| **packages/worker** | Backend | BullMQ, Prisma, grammY | - |
| **packages/shared** | Library | Zod schemas, TypeScript types | - |

---

## Modèle de données

### Entités principales

```
Organization
├── User (staff accounts)
├── Customer (end users)
├── Product
│   └── Plan (pricing tiers)
├── Channel (Telegram/Discord)
├── Subscription
│   ├── ChannelAccess
│   └── Entitlement
├── PaymentEvent (idempotency)
└── AuditLog
```

### Relations clés

- **Organization** → possède Products, Channels, Customers
- **Product** → a plusieurs Plans, lié à plusieurs Channels (M:N via ProductChannel)
- **Subscription** → lie Customer + Plan, génère ChannelAccess + Entitlements
- **ChannelAccess** → référence TelegramInvite pour le lien d'invitation

---

## Flux critiques

### 1. Achat via Stripe

```
Customer → Stripe Checkout → Webhook → API
    → Create/Update Subscription (INCOMPLETE → ACTIVE)
    → Create ChannelAccess (PENDING)
    → Create Entitlement
    → Enqueue grant-access job
    → Worker: Create invite link → Notify customer
```

### 2. Achat via Telegram Stars

```
Bot /buy → API invoice → Pre-checkout validation
    → Successful payment → API webhook
    → Same flow as Stripe...
```

### 3. Révocation (payment failed/canceled/refund)

```
Stripe Webhook → API handlePaymentFailure
    → Update ChannelAccess (REVOKED)
    → Revoke Entitlements
    → Enqueue revoke-access job
    → Worker: Revoke invite, kick member, notify
```

---

## Intégrations

| Service | Usage | Variables |
|---------|-------|-----------|
| **Stripe** | Payments, Connect marketplace | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| **Telegram API** | Bot, invites, notifications | TELEGRAM_BOT_TOKEN |
| **Telegram Stars** | In-app payments | TELEGRAM_STARS_WEBHOOK_SECRET |
| **Brevo** | Transactional emails | BREVO_API_KEY |
| **PostgreSQL** | Database | DATABASE_URL |
| **Redis** | Job queues | REDIS_URL |

---

## Commandes

```bash
# Installation
corepack pnpm install

# Infrastructure locale
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Développement
pnpm dev              # Tous les services
pnpm dev:api          # API seule
pnpm dev:frontend     # Frontend seul
pnpm dev:bot          # Bot seul
pnpm dev:worker       # Worker seul

# Base de données
pnpm --filter api prisma:migrate
pnpm --filter api prisma:studio
pnpm --filter api prisma:seed

# Tests
pnpm test
pnpm --filter api test:e2e
```

---

## Documentation existante

- [Architecture](./architecture.md) - Vue d'ensemble technique et fonctionnelle
- [Setup](./setup.md) - Guide de mise en place de l'environnement de test
- [Environment](./environment.md) - Configuration de l'environnement local
- [Email Configuration](./email-configuration.md) - Configuration Brevo (SPF/DKIM/DMARC)

---

## Modules API

| Module | Responsabilité |
|--------|----------------|
| **AuthModule** | JWT auth, guards, login/register |
| **OrganizationsModule** | CRUD organizations |
| **ProductsModule** | CRUD products |
| **PlansModule** | CRUD plans (pricing) |
| **CustomersModule** | CRUD customers |
| **SubscriptionsModule** | CRUD subscriptions |
| **ChannelsModule** | CRUD Telegram channels |
| **ChannelAccessModule** | Grant/revoke logic, queue integration |
| **EntitlementsModule** | Feature flags, access tracking |
| **BillingModule** | Stripe Connect, checkout sessions |
| **StripeWebhookModule** | Webhook handling, idempotency |
| **TelegramStarsModule** | Stars payment flow |
| **StorefrontModule** | Public product pages |
| **SchedulerModule** | Cron jobs (expiry, reminders) |
| **NotificationsModule** | Email + Telegram notifications |

---

## Patterns de résilience

| Pattern | Implémentation |
|---------|----------------|
| **Idempotence** | PaymentEvent unique (provider, externalId) |
| **Déduplication jobs** | Deterministic job IDs (BullMQ) |
| **Graceful degradation** | Try/catch sur notifications, kicks |
| **Retry** | BullMQ exponential backoff |

---

## Statut BMM Workflow

**Phase actuelle :** 0 - Documentation
**Prochaine étape :** Brainstorm ou Research (optionnel) → PRD

Voir `_bmad-output/planning-artifacts/bmm-workflow-status.yaml` pour le suivi complet.
