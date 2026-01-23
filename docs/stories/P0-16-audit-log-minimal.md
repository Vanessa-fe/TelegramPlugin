# P0-16 — Audit log minimal

## Scope

- Reference backlog: P0-16
- Objective: baseline audit log coverage in Phase 1

## Tasks

- [x] Add tests for audit log creation
- [x] Create AuditLog module/service
- [x] Log grant, revoke, replay, webhook events
- [x] Apply retention cleanup using retention config
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: audit log actions for grant/revoke/replay/webhooks with actorType SYSTEM for automated flows; retention cleanup runs daily at 02:30
- Assumptions: subscription lookup provides organizationId; webhook logging only for mapped Stripe events
- Edge cases: missing subscription skips audit log; invalid retention values fall back to defaults
- TODO (out of scope): audit log export (Phase 2)

## Implementation

- Summary: added audit log unit tests, logging hooks for grant/revoke/replay and Stripe webhooks, daily retention cleanup job
- Jobs/services impacted: ChannelAccessService, ChannelAccessController, StripeWebhookService, SchedulerService, AuditLogService
- Idempotence/retries/guards: webhook idempotence preserved via PaymentEvent; audit logs best effort; retention uses deleteMany

## File List

- packages/api/src/modules/audit-log/audit-log.service.spec.ts
- packages/api/src/modules/channel-access/channel-access.controller.ts
- packages/api/src/modules/channel-access/channel-access.controller.spec.ts
- packages/api/src/modules/channel-access/channel-access.service.ts
- packages/api/src/modules/channel-access/channel-access.service.spec.ts
- packages/api/src/modules/payments/stripe-webhook.module.ts
- packages/api/src/modules/payments/stripe-webhook.service.ts
- packages/api/src/modules/payments/stripe-webhook.service.spec.ts
- packages/api/src/modules/scheduler/scheduler.service.ts
- packages/api/src/modules/scheduler/scheduler.service.spec.ts

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Retention cleanup via scheduled job.
