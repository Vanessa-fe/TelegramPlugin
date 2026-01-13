# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram Monetization Platform - a SaaS application enabling selling access to Telegram channels through subscriptions or one-time purchases. Full-stack TypeScript monorepo using pnpm workspaces and Turborepo.

## Common Commands

```bash
# Install dependencies
corepack pnpm install

# Start local infrastructure (PostgreSQL, Redis)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Development (all services)
pnpm dev

# Development (individual services)
pnpm dev:api          # NestJS API on port 3001
pnpm dev:frontend     # Next.js on port 3000
pnpm dev:bot          # Telegram bot
pnpm dev:worker       # BullMQ job processor

# Build and lint
pnpm build            # Build all packages
pnpm lint             # Lint all packages

# Testing
pnpm test                           # Test all packages
pnpm --filter api test              # API unit tests
pnpm --filter api test:e2e          # API e2e tests
pnpm --filter shared test           # Shared package tests (Vitest)

# Database (Prisma in packages/api)
pnpm --filter api prisma:migrate    # Run migrations
pnpm --filter api prisma:studio     # Open Prisma UI
pnpm --filter api prisma:seed       # Seed data
```

## Architecture

### Packages

- **packages/api** - NestJS 11 backend with Fastify, Prisma ORM, JWT auth, BullMQ queues, Stripe webhooks
- **packages/frontend** - Next.js 15 (App Router) dashboard with Tailwind CSS 4 and shadcn/ui
- **packages/bot** - Telegram bot using grammY, handles invite links and member management
- **packages/worker** - BullMQ processor for async jobs (grant-access, revoke-access)
- **packages/shared** - Shared Zod schemas, TypeScript types, queue constants

### Data Flow

1. Customer purchases via Stripe checkout → webhook hits API
2. API creates subscription, enqueues `grant-access` job
3. Worker generates Telegram invite link via bot, notifies customer
4. On cancellation/expiry, `revoke-access` job removes access

### Key Patterns

- **Multi-tenant**: Organizations own products, plans, channels, and customers
- **Idempotent webhooks**: PaymentEvent table tracks processed Stripe events
- **Job queues**: BullMQ with deterministic job IDs for deduplication
- **Shared types**: Import from `@telegram-plugin/shared` for cross-package types

### Database

Prisma schema at `packages/api/prisma/schema.prisma`. Core entities: User, Organization, Customer, Product, Plan, Subscription, Channel, ChannelAccess, TelegramInvite, PaymentEvent.

## Configuration

Environment variables defined in `.env` (see `.env.example`). Key variables:
- `DATABASE_URL`, `REDIS_URL` - Infrastructure
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` - Auth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Payments
- `TELEGRAM_BOT_TOKEN` - Bot
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint

## Tech Stack Reference

- **API**: NestJS 11, Fastify, Prisma, PostgreSQL, BullMQ, Stripe, Pino logging
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod
- **Bot**: grammY 1.32
- **Worker**: BullMQ 5, Prisma, grammY
- **Testing**: Jest (API), Vitest (shared)
