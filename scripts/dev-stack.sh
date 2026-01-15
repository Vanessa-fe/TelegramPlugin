#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.dev.yml"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
MIGRATION_NAME="${MIGRATION_NAME:-auto-setup}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to start postgres/redis."
  exit 1
fi

echo "Starting infra (postgres + redis)..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Waiting for postgres..."
for _ in {1..30}; do
  if docker exec telegram_plugin_postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec telegram_plugin_postgres pg_isready -U postgres >/dev/null 2>&1; then
  echo "Postgres is not ready."
  exit 1
fi

echo "Waiting for redis..."
for _ in {1..30}; do
  if docker exec telegram_plugin_redis redis-cli ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec telegram_plugin_redis redis-cli ping >/dev/null 2>&1; then
  echo "Redis is not ready."
  exit 1
fi

cd "$ROOT_DIR"

echo "Running Prisma setup..."
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate --name "$MIGRATION_NAME"
pnpm --filter api prisma:seed

echo "Starting dev stack..."
exec pnpm dev
