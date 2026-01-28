# RUNBOOK - TelegramPlugin SaaS

**Derniere mise a jour:** 2026-01-26
**Auteur:** Vanessa

Ce document decrit les flux end-to-end, les configurations, et les procedures de debug du SaaS.

---

## Table des matieres

1. [Flux End-to-End](#1-flux-end-to-end)
   - [Auth / Onboarding](#11-auth--onboarding)
   - [Paiement Stripe Connect](#12-paiement-stripe-connect)
   - [Telegram (Bot + Stars)](#13-telegram-bot--stars)
   - [Grant/Revoke Acces](#14-grantrevoke-acces)
   - [Emails Brevo](#15-emails-brevo)
2. [Configuration](#2-configuration)
3. [Commandes](#3-commandes)
4. [Debug Cookbook](#4-debug-cookbook)

---

## 1. Flux End-to-End

### 1.1 Auth / Onboarding

#### Flux d'inscription

```
POST /auth/register
  → Valide email unique
  → Hash password (bcryptjs, 10 rounds)
  → Cree User (role: ORG_ADMIN ou VIEWER)
  → Genere JWT (access + refresh)
  → Set cookies HTTP-only
  → Redirect /dashboard
```

#### Flux de connexion

```
POST /auth/login
  → Valide credentials
  → Update lastLoginAt
  → Genere JWT tokens
  → Set cookies
```

#### Tokens JWT

| Type | TTL | Stockage |
|------|-----|----------|
| Access | 15 min (900s) | Cookie HTTP-only `accessToken` |
| Refresh | 7 jours (604800s) | Cookie HTTP-only `refreshToken` |

#### Roles (RBAC)

| Role | Permissions |
|------|-------------|
| `SUPERADMIN` | Tout (gestion multi-org) |
| `ORG_ADMIN` | Gestion org + billing |
| `SUPPORT` | Lecture + actions manuelles |
| `VIEWER` | Lecture seule |

#### Fichiers cles

| Fichier | Role |
|---------|------|
| `packages/api/src/modules/auth/auth.controller.ts` | Endpoints auth |
| `packages/api/src/modules/auth/auth.service.ts` | Logique JWT, hash |
| `packages/api/src/modules/auth/guards/jwt-auth.guard.ts` | Guard global |
| `packages/frontend/src/contexts/auth-context.tsx` | State auth frontend |

---

### 1.2 Paiement Stripe Connect

#### Architecture Non-MoR (Merchant of Record)

- **Ventes acheteurs**: Direct charges sur compte Connect du createur
- **Pas de** `transfer_data` ou `application_fee`
- **Fonds, refunds, litiges** appartiennent au createur
- **Decision**: voir `docs/adr/ADR-001-stripe-connect-direct-charges.md`

#### Flux Connect (Onboarding createur)

```
POST /billing/stripe/connect
  → stripe.accounts.create({ type: 'express' })
  → Stocke stripeAccountId dans Organization
  → stripe.accountLinks.create() → URL onboarding
  → Createur complete KYC chez Stripe

Webhook account.updated
  → Verifie charges_enabled && details_submitted
  → Organization.saasActive = true
```

#### Flux Checkout (Achat acheteur)

```
POST /billing/checkout [PUBLIC]
  → Valide plan actif + org.saasActive
  → Cree/update Customer
  → Cree Subscription (status: INCOMPLETE)
  → stripe.checkout.sessions.create({ stripeAccount: connectId })
  → Return { url, subscriptionId }
  → Redirect acheteur vers Stripe hosted checkout
```

#### Webhooks Stripe geres

| Event Stripe | PaymentEventType | Action |
|--------------|------------------|--------|
| `checkout.session.completed` | CHECKOUT_COMPLETED | Grant access |
| `invoice.payment_succeeded` | INVOICE_PAID | Grant access |
| `invoice.payment_failed` | INVOICE_PAYMENT_FAILED | Grace period → Revoke |
| `customer.subscription.deleted` | SUBSCRIPTION_CANCELED | Revoke access |
| `charge.refunded` | REFUND_CREATED | Revoke access |

#### Idempotence

- Table `PaymentEvent` avec contrainte unique `[provider, externalId]`
- `UPSERT` + check `processedAt === null` avant traitement
- Evite les doubles grants/revokes

#### Fichiers cles

| Fichier | Role |
|---------|------|
| `packages/api/src/modules/billing/billing.service.ts` | Checkout, Connect |
| `packages/api/src/modules/payments/stripe-webhook.service.ts` | Webhooks (532 lignes) |
| `docs/adr/ADR-001-stripe-connect-direct-charges.md` | Decision architecture |

---

### 1.3 Telegram (Bot + Stars)

#### Bot (grammY)

| Commande/Event | Action |
|----------------|--------|
| `/start` | Message bienvenue |
| `/buy <plan_id>` | Cree invoice Stars → affiche paiement |
| `pre_checkout_query` | Valide avant paiement |
| `successful_payment` | Notifie API → grant access |

#### Flux Telegram Stars

```
User: /buy plan-123
  ↓
Bot: POST /payments/telegram-stars/invoice
  → Cree subscription INCOMPLETE
  → Convertit prix → Stars (2 cents = 1 star par defaut)
  → Return invoice payload
  ↓
Bot: replyWithInvoice()
  ↓
User confirme paiement
  ↓
Telegram: pre_checkout_query
  ↓
Bot: POST /payments/telegram-stars/validate-pre-checkout
  → Valide subscription + plan + montant
  ↓
Paiement reussi
  ↓
Telegram: successful_payment
  ↓
Bot: POST /payments/telegram-stars/webhook
  → Cree PaymentEvent (idempotent)
  → Subscription → ACTIVE
  → ChannelAccessService.handlePaymentSuccess()
  → Enqueue grant-access jobs
```

#### Generation invite links

```
Worker processGrantAccess:
  → bot.api.createChatInviteLink(chatId, options)
  → Stocke dans TelegramInvite
  → Update ChannelAccess → GRANTED
  → Envoie lien au client via Telegram
```

#### Fichiers cles

| Fichier | Role |
|---------|------|
| `packages/bot/src/main.ts` | Bot grammY |
| `packages/api/src/modules/payments/telegram-stars.service.ts` | API Stars |
| `packages/worker/src/main.ts` | Worker grant/revoke |

---

### 1.4 Grant/Revoke Acces

#### State Machine ChannelAccess

```
PENDING → GRANTED → REVOKE_PENDING → REVOKED
    ↑__________________________|
    (restore si paiement reussi pendant grace)
```

#### Transitions

| Trigger | De | Vers |
|---------|-----|------|
| Payment success | - | PENDING (puis GRANTED via worker) |
| Worker success | PENDING | GRANTED |
| Payment success | REVOKE_PENDING | GRANTED (restaure) |
| Payment failed (grace) | GRANTED | REVOKE_PENDING |
| Grace expired / Cancel | REVOKE_PENDING | REVOKED |
| Cancel / Refund | GRANTED | REVOKED |

#### Grace Period

- **Defaut**: 5 jours (`PAYMENT_GRACE_PERIOD_DAYS`)
- **Comportement**: Acces maintenu pendant grace, revoque apres
- **Scheduler**: Verifie toutes les 15 min les grace expirees

#### BullMQ Queues

| Queue | Concurrency | Retry |
|-------|-------------|-------|
| `grant-access` | 4 | 10 attempts, 5min backoff (~42h) |
| `revoke-access` | 2 | 10 attempts, 5min backoff |
| `grant-access-dlq` | - | Dead letter queue |
| `revoke-access-dlq` | - | Dead letter queue |

#### Job IDs (deterministes pour deduplication)

- Grant: `grant:${subscriptionId}:${channelId}`
- Revoke: `revoke:${subscriptionId}:${reason}`

#### Fichiers cles

| Fichier | Role |
|---------|------|
| `packages/api/src/modules/channel-access/channel-access.service.ts` | Logique grant/revoke |
| `packages/api/src/modules/channel-access/channel-access.queue.ts` | BullMQ queues |
| `packages/worker/src/main.ts` | Worker processing |
| `packages/api/src/modules/scheduler/scheduler.service.ts` | Grace period cron |

---

### 1.5 Emails Brevo

#### Configuration

```env
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=Telegram Plugin
```

#### Types d'emails

| Type | Trigger | Sujet |
|------|---------|-------|
| PAYMENT_SUCCESS | Paiement reussi | "Paiement confirme" |
| PAYMENT_FAILED | Paiement echoue | "Echec du paiement" |
| SUBSCRIPTION_CANCELED | Annulation | "Abonnement annule" |
| CHANNEL_ACCESS_GRANTED | Acces accorde | "Acces accorde" |
| CHANNEL_ACCESS_REVOKED | Acces revoque | "Acces revoque" |
| SUBSCRIPTION_EXPIRING | 3 jours avant expiration | "Votre abonnement expire bientot" |

#### Flux d'envoi

```
ChannelAccessService.handlePaymentSuccess()
  → NotificationsService.sendPaymentConfirmation()
    → NotificationsService.sendEmail()
      → Brevo.TransactionalEmailsApi.sendTransacEmail()
```

#### Mode Dev

Si `BREVO_API_KEY` non configure:
- Emails logues avec `[EMAIL - DEV MODE]`
- Pas d'envoi reel

#### Fichiers cles

| Fichier | Role |
|---------|------|
| `packages/api/src/modules/notifications/notifications.service.ts` | Service emails |

---

## 2. Configuration

### 2.1 Variables d'environnement par service

#### Infrastructure

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | API, Worker | PostgreSQL connection string |
| `REDIS_URL` | API, Worker | Redis pour BullMQ |

#### API (NestJS)

| Variable | Service | Description |
|----------|---------|-------------|
| `PORT` | API | Port serveur (defaut: 3000) |
| `HOST` | API | Host (defaut: 0.0.0.0) |
| `CORS_ORIGIN` | API | Origines CORS autorisees |
| `LOG_LEVEL` | API | Niveau de log (debug, info, warn, error) |
| `ACCESS_LATENCY_ALERT_MS` | API, Worker | Seuil alerte latence (defaut: 2000) |
| `DATA_EXPORT_DIR` | API | Dossier exports RGPD |

#### Auth

| Variable | Service | Description |
|----------|---------|-------------|
| `JWT_ACCESS_SECRET` | API | Secret JWT access token (32 bytes) |
| `JWT_REFRESH_SECRET` | API | Secret JWT refresh token (32 bytes) |
| `JWT_ACCESS_TTL` | API | TTL access token en secondes (defaut: 900) |
| `JWT_REFRESH_TTL` | API | TTL refresh token en secondes (defaut: 604800) |
| `COOKIE_SECRET` | API | Secret cookies (64 bytes hex) |

#### Frontend (Next.js)

| Variable | Service | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Frontend | URL de l'API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Cle publique Stripe |

#### Stripe

| Variable | Service | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | API | Cle secrete Stripe |
| `STRIPE_WEBHOOK_SECRET` | API | Secret webhook Stripe |
| `STRIPE_APPLICATION_FEE_PERCENT` | API | Commission plateforme (0 pour MVP) |
| `STRIPE_CONNECT_RETURN_URL` | API | URL retour Connect onboarding |
| `STRIPE_CONNECT_REFRESH_URL` | API | URL refresh Connect onboarding |
| `STRIPE_CHECKOUT_SUCCESS_URL` | API | URL succes checkout |
| `STRIPE_CHECKOUT_CANCEL_URL` | API | URL annulation checkout |
| `PAYMENT_GRACE_PERIOD_DAYS` | API | Grace period en jours (defaut: 5) |
| `AUDIT_LOG_RETENTION_DAYS` | API | Retention audit logs (defaut: 400) |
| `PAYMENT_EVENT_RETENTION_DAYS` | API | Retention payment events (defaut: 730) |

#### Telegram

| Variable | Service | Description |
|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot, Worker | Token du bot Telegram |
| `TELEGRAM_STARS_WEBHOOK_SECRET` | API | Secret API Stars |
| `TELEGRAM_STARS_API_URL` | Bot | URL API (defaut: NEXT_PUBLIC_API_URL) |
| `TELEGRAM_STARS_CONVERSION_RATE` | API | Cents par Star (defaut: 2) |

#### Brevo (Emails)

| Variable | Service | Description |
|----------|---------|-------------|
| `BREVO_API_KEY` | API | Cle API Brevo |
| `BREVO_FROM_EMAIL` | API | Email expediteur |
| `BREVO_FROM_NAME` | API | Nom expediteur |

### 2.2 Fichiers de configuration

| Fichier | Description |
|---------|-------------|
| `.env.local` | Variables d'environnement locales |
| `.env.production` | Variables d'environnement production |
| `.env.example` | Template des variables |
| `fly.toml` | Config deploiement Fly.io |
| `packages/api/prisma/schema.prisma` | Schema base de donnees |
| `turbo.json` | Config Turborepo |
| `pnpm-workspace.yaml` | Config monorepo |

---

## 3. Commandes

### 3.1 Lancer en local

```bash
# 1. Installer les dependances
corepack pnpm install

# 2. Lancer l'infra (PostgreSQL + Redis)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# 3. Configurer l'environnement
cp .env.example .env.local
# Editer .env.local avec vos cles

# 4. Appliquer les migrations
pnpm --filter api prisma:migrate

# 5. (Optionnel) Seeder la base
pnpm --filter api prisma:seed

# 6. Lancer tous les services
pnpm dev

# Ou individuellement:
pnpm dev:api       # API sur port 3001
pnpm dev:frontend  # Frontend sur port 3000
pnpm dev:bot       # Bot Telegram
pnpm dev:worker    # Worker BullMQ
```

### 3.2 Lancer en staging

```bash
# Deployer sur Fly.io
fly deploy

# Ou via CI/CD GitHub Actions (automatique sur push master)
```

#### URLs staging

| Service | URL |
|---------|-----|
| API | `https://telegram-plugin-api.fly.dev` |
| Frontend | `https://votre-app.netlify.app` |

### 3.3 Smoke Tests P0

#### Pre-requis

```bash
# Docker doit etre lance
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Appliquer migrations sur DB test
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/telegram_plugin_test" \
  pnpm --filter api prisma:migrate
```

#### Tests unitaires

```bash
# Tous les tests API
pnpm --filter api test

# Tests specifiques
pnpm --filter api test -- --testPathPattern=channel-access
pnpm --filter api test -- --testPathPattern=stripe-webhook
```

#### Tests E2E

```bash
# Tous les tests E2E
pnpm --filter api test:e2e

# Tests specifiques
pnpm --filter api test:e2e -- --testPathPattern=checkout-flow
pnpm --filter api test:e2e -- --testPathPattern=stripe-webhook
pnpm --filter api test:e2e -- --testPathPattern=telegram-stars
pnpm --filter api test:e2e -- --testPathPattern=scheduler
```

#### Smoke test Stripe webhook (manuel)

```bash
# 1. Lancer l'API
pnpm dev:api

# 2. Dans un autre terminal, utiliser Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# 3. Declencher un event de test
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
```

#### Smoke test Telegram Stars (manuel)

```bash
# 1. Lancer API + Bot
pnpm dev:api
pnpm dev:bot

# 2. Dans Telegram, envoyer au bot:
/buy <plan_id>

# 3. Verifier les logs API pour le flux
```

### 3.4 Build et lint

```bash
# Build tous les packages
pnpm build

# Lint
pnpm lint

# Type check
pnpm --filter api build
pnpm --filter frontend build
```

---

## 4. Debug Cookbook

### 4.1 Ou regarder les logs

#### Logs API (Pino JSON)

```bash
# En local
pnpm dev:api 2>&1 | pnpm pino-pretty

# En production (Fly.io)
fly logs -a telegram-plugin-api
```

#### Logs Worker

```bash
# En local
pnpm dev:worker

# Chercher les erreurs de job
grep -i "error" logs/worker.log
```

#### Logs BullMQ

```bash
# Voir les jobs en attente/echec
redis-cli
> KEYS bull:*
> LRANGE bull:grant-access:waiting 0 -1
> LRANGE bull:grant-access-dlq:waiting 0 -1
```

### 4.2 Erreurs frequentes

#### "Cannot grant channel access: subscription not found"

**Cause**: Le subscriptionId dans le webhook ne correspond pas a une subscription en DB.

**Debug**:
```sql
SELECT * FROM "Subscription" WHERE id = '<subscriptionId>';
SELECT * FROM "PaymentEvent" WHERE "externalId" = '<stripeEventId>';
```

**Solution**: Verifier que le checkout a bien cree la subscription avant le webhook.

---

#### "Webhook signature verification failed"

**Cause**: `STRIPE_WEBHOOK_SECRET` incorrect ou payload modifie.

**Debug**:
```bash
# Verifier le secret
echo $STRIPE_WEBHOOK_SECRET

# Tester avec Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe --log-level debug
```

**Solution**: Regenerer le webhook secret dans Stripe Dashboard.

---

#### "Bot is not an administrator in the chat"

**Cause**: Le bot n'a pas les permissions admin sur le channel.

**Debug**:
```bash
# Verifier les permissions bot
curl "https://api.telegram.org/bot<TOKEN>/getChatMember?chat_id=<CHANNEL_ID>&user_id=<BOT_ID>"
```

**Solution**: Ajouter le bot comme admin avec permissions "Invite users".

---

#### "Job moved to DLQ after 10 retries"

**Cause**: Le job grant/revoke a echoue 10 fois.

**Debug**:
```bash
# Voir les jobs DLQ
redis-cli LRANGE bull:grant-access-dlq:waiting 0 -1

# Voir le payload du job
redis-cli HGETALL bull:grant-access-dlq:<jobId>
```

**Solution**:
1. Identifier la cause dans les logs
2. Corriger le probleme (permissions bot, subscription manquante, etc.)
3. Rejouer le job:
   ```bash
   curl -X POST http://localhost:3000/access/replay \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"queue": "grant", "jobId": "<jobId>"}'
   ```

Voir aussi: `docs/runbook-dlq-replay.md`

---

#### "BREVO_API_KEY not configured"

**Cause**: La variable d'environnement n'est pas definie.

**Comportement**: Les emails sont logues mais pas envoyes.

**Solution**: Configurer `BREVO_API_KEY` dans `.env`.

---

#### "Grace period already active"

**Cause**: Plusieurs webhooks `invoice.payment_failed` recus.

**Comportement normal**: Le systeme garde le `graceUntil` existant si pas encore expire.

**Debug**:
```sql
SELECT id, status, "graceUntil", "lastPaymentFailedAt"
FROM "Subscription"
WHERE id = '<subscriptionId>';
```

---

### 4.3 Commandes debug utiles

#### Verifier l'etat d'une subscription

```sql
-- Subscription + accesses
SELECT
  s.id, s.status, s."graceUntil",
  ca.status as access_status, ca."channelId"
FROM "Subscription" s
LEFT JOIN "ChannelAccess" ca ON ca."subscriptionId" = s.id
WHERE s.id = '<subscriptionId>';
```

#### Verifier les events de paiement

```sql
SELECT id, type, "externalId", "processedAt", "createdAt"
FROM "PaymentEvent"
WHERE "subscriptionId" = '<subscriptionId>'
ORDER BY "createdAt" DESC;
```

#### Verifier les invites Telegram

```sql
SELECT id, status, "inviteLink", "expiresAt", "usesCount"
FROM "TelegramInvite"
WHERE "channelId" = '<channelId>'
ORDER BY "createdAt" DESC;
```

#### Forcer un grant manuel

```bash
curl -X POST http://localhost:3000/access/support/grant \
  -H "Authorization: Bearer <support_token>" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": "<subscriptionId>"}'
```

#### Forcer un revoke manuel

```bash
curl -X POST http://localhost:3000/access/support/revoke \
  -H "Authorization: Bearer <support_token>" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": "<subscriptionId>", "reason": "manual"}'
```

### 4.4 Metriques Prometheus

```bash
# Endpoint metriques
curl http://localhost:3000/metrics

# Metriques cles
webhook_requests_total{provider,event_type,status}
webhook_duration_seconds{provider,event_type}
queue_jobs_total{queue,status}
queue_waiting_jobs{queue}
```

### 4.5 Health checks

```bash
# API health
curl http://localhost:3000/healthz

# API ready
curl http://localhost:3000/readyz
```

---

## Annexes

### A. Schema de donnees simplifie

```
User ─────────────┐
                  ↓
Organization ─────┼──→ Product ──→ Plan
      │           │        │
      │           │        ↓
      ↓           │   ProductChannel
   Channel ←──────┤        │
      │           │        ↓
      ↓           │   Subscription ←── Customer
TelegramInvite    │        │
      │           │        ↓
      ↓           │   ChannelAccess
ChannelAccess ←───┘        │
                           ↓
                      PaymentEvent
                           │
                           ↓
                       AuditLog
```

### B. Ports par defaut

| Service | Port |
|---------|------|
| API | 3000 (prod), 3001 (dev) |
| Frontend | 3000 |
| PostgreSQL | 5432 (local), 5433 (test) |
| Redis | 6379 |

### C. Liens utiles

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Connect Accounts](https://dashboard.stripe.com/connect/accounts)
- [Brevo Dashboard](https://app.brevo.com)
- [Telegram BotFather](https://t.me/BotFather)
- [Fly.io Dashboard](https://fly.io/apps/telegram-plugin-api)

---

*Genere le 2026-01-26*
