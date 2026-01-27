# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN corepack enable && apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/worker/package.json packages/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS build

# Copy monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.base.json

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/worker/node_modules ./packages/worker/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

# Copy source files
COPY packages/shared packages/shared
COPY packages/worker packages/worker
COPY packages/api/prisma packages/api/prisma

# Build shared first
RUN pnpm --filter @telegram-plugin/shared build

# Generate Prisma client for worker
RUN cd packages/api && npx prisma generate

# Build worker
RUN pnpm --filter @telegram-plugin/worker build

FROM base AS runner

ENV NODE_ENV=production

# Copy monorepo config
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy built files and dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/worker ./packages/worker
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/packages/api/prisma ./packages/api/prisma

CMD ["node", "packages/worker/dist/main.js"]
