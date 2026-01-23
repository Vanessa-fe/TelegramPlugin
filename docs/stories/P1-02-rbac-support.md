# P1-02 — RBAC support

## Scope

- Reference backlog: P1-02
- Objective: support is read-only plus manual actions; admin cannot access payment secrets

## Tasks

- [x] Add tests and enforce support read-only access + manual actions only
- [x] Add tests and enforce admin restriction on payment secrets
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: enforce read-only by removing SUPPORT from billing connect/login + subscription writes; treat PaymentEvent payload as payment secrets and restrict ORG_ADMIN from payment-events
- Assumptions: support users remain internal and can view payment events
- Edge cases: support without organizationId may still be blocked by org scope
- TODO (out of scope): field-level redaction for org admins

## Implementation

- Summary: RBAC metadata tests added; roles updated for billing, subscriptions, and payment-events
- Jobs/services impacted: BillingController, SubscriptionsController, PaymentEventsController
- Idempotence/retries/guards: role guard enforcement via @Roles metadata

## File List

- packages/api/src/modules/auth/rbac.spec.ts
- packages/api/src/modules/billing/billing.controller.ts
- packages/api/src/modules/payment-events/payment-events.controller.ts
- packages/api/src/modules/subscriptions/subscriptions.controller.ts

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Support: GET endpoints only + manual access endpoints.
