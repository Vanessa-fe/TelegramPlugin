# syntax=docker/dockerfile:1

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/bot/package.json packages/bot/package.json
COPY packages/frontend/package.json packages/frontend/package.json
COPY packages/worker/package.json packages/worker/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY packages/api packages/api
RUN pnpm --filter @telegram-plugin/shared build
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/packages/api ./packages/api
COPY --from=build /app/packages/shared ./packages/shared
EXPOSE 3000
CMD ["node", "packages/api/dist/main.js"]
