# Project Context — Telegram Monetization SaaS

## Goal
Build a SaaS for Telegram creators to sell digital products and subscriptions.
Payments use Telegram platform payments (Telegram Stars / payments API). Focus: reliability + security + simple UX.

## Stack
- Frontend: Next.js (App Router), Tailwind
- Backend: NestJS API
- DB: Postgres (managed)
- Email: Brevo SMTP
- Hosting: Fly.io (API) + managed DB

## Core Flows
1) Creator onboarding → connect Telegram bot/channel
2) Product creation → price, access rules
3) Checkout → Telegram payment → webhook confirmation
4) Delivery → unlock content / add user to channel / send link
5) Subscriptions → renewals + access control + failed payment handling

## Data Model (high level)
- User (telegramUserId)
- Creator (ownerUserId)
- Product (creatorId, type: one_time|subscription)
- Order (productId, buyerId, status)
- Subscription (buyerId, productId, status, periodEnd)
- AccessGrant (buyerId, resourceId, active)

## Non-negotiables
- Never expose DB publicly
- Webhooks: verify signature, idempotency, store raw payload
- Auth: server-side sessions/JWT (decide per task), minimal scopes
- Logs: structured logs + correlation id

## Constraints / Style
- Keep code simple, readable, minimal abstractions
- Prefer server components; avoid client unless needed
- No big refactors unless asked
- Output: short answers. Provide exact code changes/patches

## Current Focus
(keep updated in SESSION.md)
