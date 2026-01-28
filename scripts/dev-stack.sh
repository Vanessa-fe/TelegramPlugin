#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.dev.yml"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.local}"
if [[ ! -f "$ENV_FILE" && -f "$ROOT_DIR/.env" ]]; then
  ENV_FILE="$ROOT_DIR/.env"
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "Loading environment from $ENV_FILE"
  set -a
  . "$ENV_FILE"
  set +a
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is required to start postgres/redis."
  exit 1
fi

echo "🐳 Starting infra (postgres + redis)..."
docker compose -f "$COMPOSE_FILE" up -d

echo "⏳ Waiting for postgres..."
for _ in {1..30}; do
  if docker exec telegram_plugin_postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ Postgres is ready"
    break
  fi
  sleep 1
done

if ! docker exec telegram_plugin_postgres pg_isready -U postgres >/dev/null 2>&1; then
  echo "❌ Postgres is not ready."
  exit 1
fi

echo "⏳ Waiting for redis..."
for _ in {1..30}; do
  if docker exec telegram_plugin_redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is ready"
    break
  fi
  sleep 1
done

if ! docker exec telegram_plugin_redis redis-cli ping >/dev/null 2>&1; then
  echo "❌ Redis is not ready."
  exit 1
fi

cd "$ROOT_DIR"

echo "🔧 Generating Prisma client..."
pnpm --filter api prisma:generate

echo "🗃️ Running database migrations..."
pnpm --filter api prisma:deploy

echo "🚀 Starting dev stack (API + Frontend + Bot + Worker)..."
echo ""
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:3001"
echo ""
exec pnpm dev
