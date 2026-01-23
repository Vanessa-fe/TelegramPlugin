# P1-01 — Audit log enrichment

## Scope

- Reference backlog: P1-01
- Objective: enrich audit logs with metadata and correlation ids; document schema and usage

## Tasks

- [x] Add tests for correlation id + metadata enrichment
- [x] Add correlationId field and wire audit logs for sensitive actions
- [x] Document audit log schema and usage
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: add `correlationId` on AuditLog; use `x-correlation-id` then `x-request-id` for manual actions; Stripe uses `event.id`
- Assumptions: callers provide headers for correlation when needed
- Edge cases: missing subscription skips audit log; missing correlation id stored as null
- TODO (out of scope): full request id propagation

## Implementation

- Summary: enrich audit logs with correlation ids and metadata, add schema field + migration, update docs
- Jobs/services impacted: AuditLogService, ChannelAccessController, StripeWebhookService, Prisma schema/migration
- Idempotence/retries/guards: audit logs best effort; correlation id optional

## File List

- packages/api/prisma/schema.prisma
- packages/api/prisma/migrations/20260201090000_add_audit_log_correlation_id/migration.sql
- packages/api/src/modules/audit-log/audit-log.service.ts
- packages/api/src/modules/audit-log/audit-log.service.spec.ts
- packages/api/src/modules/channel-access/channel-access.controller.ts
- packages/api/src/modules/channel-access/channel-access.controller.spec.ts
- packages/api/src/modules/payments/stripe-webhook.service.ts
- packages/api/src/modules/payments/stripe-webhook.service.spec.ts
- docs/architecture.md

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Sensitive actions include support or admin manual actions and payment webhooks.
