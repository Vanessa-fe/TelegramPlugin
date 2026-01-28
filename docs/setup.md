# Mise en place de l'environnement de test

## Prérequis

- Node.js 20.x (gestion des dépendances natives Prisma/Next.js).
- pnpm 9 (`corepack enable` ou `npm install -g pnpm@9`).
- Docker et Docker Compose (pour PostgreSQL et Redis).
- (Optionnel) Stripe CLI pour recevoir les webhooks en local.
- (Optionnel) direnv ou équivalent pour charger automatiquement votre `.env.local`.

## Variables d'environnement

1. Copiez le fichier `./.env.example` vers `./.env.local`.
2. Ajustez les valeurs sensibles :
   - `DATABASE_URL` : connexion PostgreSQL locale (correspond à Docker).
   - `REDIS_URL` : connexion Redis pour BullMQ.
   - `TELEGRAM_BOT_TOKEN` : token BotFather **test** ou **production**.
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` : clés Stripe (test par défaut).
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` (voir `docs/email-configuration.md`).
   - `NEXT_PUBLIC_API_URL` : URL publique du backend exposée au frontend.
3. Chargez les variables dans votre shell avant de lancer des commandes Node :

```bash
# Dans un shell bash/zsh
set -a
source .env.local
set +a
```

> Astuce : ajoutez ces lignes à un fichier `scripts/load-env.sh` puis `source scripts/load-env.sh` pour éviter de le retaper.

Pour la production, utilisez un fichier dédié (`.env.production`) ou un gestionnaire de secrets (Railway/Render/AWS SSM, etc.).

## Infrastructure locale (PostgreSQL + Redis)

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
docker compose -f infra/docker/docker-compose.dev.yml ps
```

Les conteneurs exposent `postgresql://postgres:postgres@localhost:5432/telegram_plugin` et `redis://localhost:6379`.

## Installation et base de données

```bash
pnpm install
pnpm --filter api prisma:generate
# Première initialisation : crée la migration "init" et synchronise la base
pnpm --filter api prisma:migrate -- --name init
```

Pour ré-initialiser rapidement la base en local :

```bash
pnpm --filter api prisma migrate reset
```

(La commande vous demandera une confirmation et relancera les seeders si vous en ajoutez plus tard.)

## Lancer les services applicatifs

Ouvrez un terminal par service (après avoir chargé `.env.local`) :

- API NestJS : `pnpm dev:api`
- Worker BullMQ : `pnpm dev:worker`
- Bot Telegram (long polling) : `pnpm dev:bot`
- Frontend Next.js : `pnpm dev:frontend`

Adaptez `CORS_ORIGIN` et `NEXT_PUBLIC_API_URL` si le frontend est servi depuis un port différent (`http://localhost:3001` par défaut).

## Tests automatisés

- Suite complète : `pnpm test` (agrège Jest pour `packages/api` et Vitest pour `packages/shared`).
- Lancer uniquement les tests API : `pnpm --filter api test`.
- Mode e2e API (nécessite un `DATABASE_URL` valide et les conteneurs Docker démarrés) : `pnpm --filter api test:e2e`.
- Tests partagés : `pnpm --filter @telegram-plugin/shared test`.

Prisma désactive la connexion en `NODE_ENV=test`, ce qui permet d'exécuter les tests API unitaires sans base. Pour tester avec la base, créez une deuxième URL (`DATABASE_URL_TEST`) et exportez-la avant de lancer les tests.

## Tests grandeur nature sur Telegram

1. Créez un bot via [BotFather](https://t.me/BotFather) et récupérez le token.
2. Créez un canal Telegram privé de test, ajoutez le bot en administrateur avec les droits d'invitation.
3. Assurez-vous que l'API, le worker et le bot tournent (voir section précédente).
4. Connectez l'API à Redis/PostgreSQL en local via Docker; publiez un job `GrantAccessJob` (ex. via un script temporaire ou la console Nest).
5. Vérifiez dans Telegram que le bot peut générer/partager un lien d'invitation, puis révoquer l'accès en poussant un job `RevokeAccessJob`.
6. Pour des scénarios de paiement réalistes, utilisez les clés **test** Stripe et le CLI `stripe listen --forward-to localhost:3000/webhooks/stripe`.

Documentez chaque test (capture d'écran, logs) pour faciliter la recette fonctionnelle.

## Monitoring et observabilité

### Endpoints de santé

- `GET /healthz` - Healthcheck basique (API running)
- `GET /readyz` - Readiness check (DB + Redis connectés)
- `GET /metrics` - Métriques Prometheus (public, pas d'auth)

### Métriques disponibles

```bash
# Vérifier les métriques localement
curl http://localhost:3001/metrics | grep -E "^(webhook|queue)"
```

Métriques clés:
- `webhook_requests_total{status="success|error"}` - Succès/échecs webhooks
- `queue_waiting_jobs{queue="..."}` - Jobs en attente
- `queue_waiting_jobs{queue="...-dlq"}` - Jobs en DLQ (alerte si > 0)

### Runbook opérationnel

Pour les procédures de diagnostic et replay des jobs en échec:
- **[Runbook DLQ et Replay](./runbook-dlq-replay.md)** - Guide complet des opérations

## Préparer la commercialisation

- Basculez vos clés Stripe et Telegram en mode production et stockez-les dans un gestionnaire de secrets (Railway/Render/AWS SSM, etc.).
- Déployez PostgreSQL géré (Neon, Supabase…) et Redis (Upstash, Valkey) puis mettez à jour `DATABASE_URL` / `REDIS_URL`.
- Activez HTTPS sur le backend et configurez l'utilisation d'un webhook Telegram (plutôt que le long polling) pour une meilleure fiabilité.
- Configurez le scraping Prometheus vers `/metrics` et les alertes recommandées (voir [architecture.md](./architecture.md#seuils-dalerte-recommandés)).
- Passez en revue les obligations légales (CGV/CGU, politique de confidentialité, DPA) et préparez l'onboarding Stripe Connect si vous encaissez pour vos clients.
- Exécutez la checklist déploiement : `pnpm build`, migrations Prisma en CI/CD, sauvegardes, rotation des tokens.
