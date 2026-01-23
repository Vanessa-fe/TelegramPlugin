# P0-04 — Retention policy baseline

## Scope

- Reference backlog: P0-04
- Objective: define retention for audit logs and payment events, expose values as config

## Tasks

- [x] Write ADR with retention durations (AuditLog 400 days, PaymentEvent 730 days)
- [x] Add retention config keys in `.env.example` + docs
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: retention durations set to 400 days (AuditLog) and 730 days (PaymentEvent); exposed via env keys.
- Assumptions: enforcement via cleanup jobs lands in Phase 1+.
- Edge cases: evidence pack relies on retained logs; ensure retention aligns with RGPD timeline.
- TODO (out of scope): automated cleanup jobs for retention (Phase 1+)

## Implementation

- Summary: ADR added; env/documentation updated with retention configs.
- Jobs/services impacted: none (docs/config-only).
- Idempotence/retries/guards: not applicable.

## File List

- docs/adr/ADR-002-retention-policy.md
- docs/environment.md
- .env.example

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Retention enforcement to be scheduled later in Phase 1.
