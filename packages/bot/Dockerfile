# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/bot/package.json packages/bot/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS build

# Copy monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.base.json

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/bot/node_modules ./packages/bot/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY packages/shared packages/shared
COPY packages/bot packages/bot

# Build shared first, then bot
RUN pnpm --filter @telegram-plugin/shared build
RUN pnpm --filter @telegram-plugin/bot build

FROM base AS runner

ENV NODE_ENV=production

# Copy monorepo config (needed for pnpm workspace resolution)
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy built files and dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/bot ./packages/bot
COPY --from=build /app/packages/shared ./packages/shared

CMD ["node", "packages/bot/dist/main.js"]
