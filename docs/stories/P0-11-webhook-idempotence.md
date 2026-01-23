# P0-11 — Webhook idempotence hardening

## Scope

- Reference backlog: P0-11
- Objective: protect from duplicate/out-of-order webhooks

## Tasks

- [x] Add tests for duplicate Stripe events
- [x] Use upsert/transaction to avoid duplicate grants
- [x] Verify unique constraint for PaymentEvent
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: Stripe events deduped via `paymentEvent.upsert` + `processedAt` guard.
- Assumptions: `@@unique([provider, externalId])` already enforced in schema.
- Edge cases: duplicate events after `processedAt` skip side effects.
- TODO (out of scope): webhook retry/backoff tuning (P0-14)

## Implementation

- Summary: `StripeWebhookService` uses `upsert`; tests updated for dedupe.
- Jobs/services impacted: Stripe webhook handling.
- Idempotence/retries/guards: guard on `processedAt` prevents duplicate grants.

## File List

- packages/api/src/modules/payments/stripe-webhook.service.ts
- packages/api/src/modules/payments/stripe-webhook.service.spec.ts
- packages/api/prisma/schema.prisma

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Duplicate events should skip side effects when `processedAt` set.
