#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.dev.yml"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.development}"
if [[ ! -f "$ENV_FILE" && -f "$ROOT_DIR/.env" ]]; then
  ENV_FILE="$ROOT_DIR/.env"
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "Loading environment from $ENV_FILE"
  set -a
  . "$ENV_FILE"
  set +a
fi

is_local_database_url() {
  local database_url="${1:-}"
  [[ -n "$database_url" ]] || return 1
  [[ "$database_url" =~ @localhost([:/]|$) ]] && return 0
  [[ "$database_url" =~ @127\.0\.0\.1([:/]|$) ]] && return 0
  [[ "$database_url" =~ @postgres([:/]|$) ]] && return 0
  [[ "$database_url" =~ @telegram_plugin_postgres([:/]|$) ]] && return 0
  return 1
}

is_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

find_available_port() {
  local start_port="$1"
  local reserved_port="${2:-}"
  local port="$start_port"
  while is_port_in_use "$port" || { [[ -n "$reserved_port" ]] && [[ "$port" -eq "$reserved_port" ]]; }; do
    port=$((port + 1))
  done
  echo "$port"
}

API_PORT="${API_PORT:-${PORT:-3002}}"
if is_port_in_use "$API_PORT"; then
  NEW_PORT="$(find_available_port "$API_PORT")"
  echo "⚠️  Port $API_PORT is in use, switching API to $NEW_PORT"
  API_PORT="$NEW_PORT"
fi

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
if [[ "$FRONTEND_PORT" -ne 3000 ]]; then
  echo "⚠️  Frontend is set to $FRONTEND_PORT (expected 3000). Update CORS_ORIGIN/OAuth URLs if you keep this."
fi
if is_port_in_use "$FRONTEND_PORT"; then
  echo "❌ Port $FRONTEND_PORT is already in use. Telegram-plugin frontend requires 3000."
  echo "   Stop the other server or choose a different port and update env URLs accordingly."
  exit 1
fi
if [[ "$FRONTEND_PORT" -eq "$API_PORT" ]]; then
  echo "❌ FRONTEND_PORT ($FRONTEND_PORT) conflicts with API_PORT ($API_PORT)."
  exit 1
fi

export API_PORT="$API_PORT"
export FRONTEND_PORT="$FRONTEND_PORT"
export PORT="$FRONTEND_PORT"
if [[ -z "${NEXT_PUBLIC_API_URL:-}" || "${NEXT_PUBLIC_API_URL:-}" == http://localhost:* ]]; then
  export NEXT_PUBLIC_API_URL="http://localhost:$API_PORT"
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

if [[ "${NODE_ENV:-development}" == "production" ]]; then
  echo "🗃️ Running production migrations..."
  pnpm --filter api prisma:deploy
elif is_local_database_url "${DATABASE_URL:-}"; then
  echo "🗃️ Running local database migrations..."
  pnpm --filter api prisma:migrate
elif [[ "${RUN_REMOTE_MIGRATIONS:-0}" == "1" ]]; then
  echo "🗃️ Running checked-in migrations on remote database..."
  pnpm --filter api prisma:deploy
else
  echo "⚠️  Remote DATABASE_URL detected."
  echo "   Skipping 'prisma migrate dev' to avoid advisory-lock contention on the shared database."
  echo "   Set RUN_REMOTE_MIGRATIONS=1 if you explicitly want to apply checked-in migrations with 'prisma migrate deploy'."
fi

echo "🚀 Starting dev stack (API + Frontend + Bot + Worker)..."
echo ""
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   API:      http://localhost:$API_PORT"
echo ""
exec pnpm dev
