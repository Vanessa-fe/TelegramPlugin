# P0-02 — Stripe Connect non-MoR alignment

## Scope

- Reference backlog: P0-02
- Objective: confirm charge model and legal posture consistent with non-MoR MVP

## Tasks

- [x] ADR for Stripe Connect direct charges (non-MoR)
- [x] Update `docs/architecture.md` with Stripe flow + ADR reference

## Dev Agent Record

- Decisions: buyer payments use direct charges on Connect; no `transfer_data` or `application_fee`; SaaS billing stays on platform account.
- Assumptions: Connect events include `event.account` for routing; platform logs PaymentEvent for audit only.
- Edge cases: missing `event.account` should skip Connect-only side effects.
- TODO (out of scope): platform fee and KYC for creators.

## Implementation

- Summary: documented non-MoR decision and flow details in ADR + architecture.
- Jobs/services impacted: none (docs-only).
- Idempotence/retries/guards: not applicable.

## File List

- docs/adr/ADR-001-stripe-connect-direct-charges.md
- docs/architecture.md

## Tests / Validation

- Docs only; no tests run.

## Notes

- Keep Stripe Connect flow consistent with non-MoR stance until Phase 1 changes.
