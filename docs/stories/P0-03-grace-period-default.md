# P0-03 — Grace period default (5 jours)

## Scope

- Reference backlog: P0-03
- Objective: define configurable grace period (3-7 days, default 5) and apply to access revoke logic

## Tasks

- [x] Add tests for grace-period behavior (unit + e2e)
- [x] Apply grace period in `ChannelAccessService.handlePaymentFailure`
- [x] Add `PAYMENT_GRACE_PERIOD_DAYS` config (default 5) in API env + docs
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: grace period default 5 days via `PAYMENT_GRACE_PERIOD_DAYS`; applied only for `payment_failed`.
- Assumptions: scheduling + revoke after grace is handled in Phase 1 (P0-13).
- Edge cases: if `graceUntil` already in future, keep it; if expired, revoke immediately.
- TODO (out of scope): scheduler-based revoke after grace expiry (Phase 1 P0-13)

## Implementation

- Summary: `handlePaymentFailure` applies grace for `payment_failed`, sets `graceUntil` and `lastPaymentFailedAt`, skips revoke while grace active.
- Jobs/services impacted: `ChannelAccessService`, tests.
- Idempotence/retries/guards: grace preserves existing `graceUntil` when already active.

## File List

- packages/api/src/modules/channel-access/channel-access.service.ts
- packages/api/src/modules/channel-access/channel-access.service.spec.ts
- packages/api/test/stripe-webhook.e2e-spec.ts
- docs/environment.md
- .env.example

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- P0-13 will add scheduling + notifications for revoke after grace.
