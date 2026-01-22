# Configuration de l'environnement local

Ce projet est un monorepo PNPM contenant l'API NestJS, le bot Telegram, le worker BullMQ, le frontend Next.js et des librairies partagées. Voici la procédure pour (re)mettre l'environnement de développement en place.

## Prérequis

- **Node.js >= 20** recommandé (testé avec `v21.7.2`). Utiliser `nvm` ou `asdf` si besoin.
- **Corepack** (activé par défaut avec Node 20) pour installer la bonne version de PNPM.
- **PostgreSQL** local (Docker ou installation native). L'exemple utilise `postgres://postgres:postgres@localhost:5432/telegram_plugin`.
- **Redis** local pour BullMQ (ex. `redis://localhost:6379`).
- Accès aux **secrets Stripe** (publishable + secret key, webhook secret) et au **token du bot Telegram** lorsque l'on veut tester l'intégration.

## Installer les dépendances Node

1. Active la version attendue de PNPM :

   ```bash
   corepack prepare pnpm@9.0.0 --activate
   ```

   > Si un binaire `pnpm` système revient toujours en version 8, utiliser `corepack pnpm <commande>` afin de garantir la version souhaitée.

2. Installe toutes les dépendances du monorepo :

   ```bash
   corepack pnpm install
   ```

   Les workspaces déclarés dans `pnpm-workspace.yaml` (api, bot, worker, frontend, shared) sont tous résolus automatiquement.

## Variables d'environnement

1. Copier le fichier d'exemple :

   ```bash
   cp .env.example .env
   ```

2. Renseigner les valeurs sensibles :

   - `DATABASE_URL` : connexion PostgreSQL (utilisée par Prisma dans `packages/api`).
   - `REDIS_URL` : utilisé par BullMQ (`packages/worker`).
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - `TELEGRAM_BOT_TOKEN`.
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` (voir `docs/email-configuration.md`).
   - Adapter `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL` si les ports changent.

## Services externes

Lancer les dépendances locales (par exemple avec Docker) :

```bash
docker run --name telegram-plugin-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
docker run --name telegram-plugin-redis -p 6379:6379 -d redis:7
```

> Un fichier `infra/docker/docker-compose.dev.yml` regroupe les deux services : `docker compose -f infra/docker/docker-compose.dev.yml up -d`. Si la commande `docker` n'est pas disponible, installe Docker Desktop ou utilise une instance PostgreSQL/Redis déjà en place.

Initialiser ensuite la base Prisma lorsque les migrations seront disponibles :

```bash
corepack pnpm --filter api run prisma:migrate
```

Injecter un jeu de données de démonstration :

```bash
corepack pnpm --filter api run prisma:seed
```

## Démarrer les applications

- `pnpm dev` lance tous les services via Turborepo.
- Individuellement :
  - `pnpm dev:api`
  - `pnpm dev:bot`
  - `pnpm dev:worker`
  - `pnpm dev:frontend`

Assure-toi que la variable `NODE_ENV=development` est définie pour bénéficier du logging enrichi (`nestjs-pino`) et du hot reload.
