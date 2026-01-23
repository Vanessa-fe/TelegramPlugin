# P0-10 — Access source of truth (ChannelAccess state machine)

## Scope

- Reference backlog: P0-10
- Objective: state machine unique for access via ChannelAccess

## Tasks

- [x] Add tests for transitions + idempotence
- [x] Add REVOKE_PENDING to AccessStatus and apply transitions
- [x] Update access flow to use ChannelAccess as source of truth
- [x] Update `docs/architecture.md` with state machine
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: `REVOKE_PENDING` added; grace period switches access to pending revoke without removing access.
- Assumptions: access remains active while `REVOKE_PENDING`; payment success restores to `GRANTED` without re-grant job.
- Edge cases: duplicate `payment_failed` keeps `REVOKE_PENDING`; revoke transition includes `REVOKE_PENDING`.
- TODO (out of scope): remove legacy access sources if found

## Implementation

- Summary: state transitions added in `ChannelAccessService`; schema/migration updated; docs updated.
- Jobs/services impacted: API `ChannelAccessService` + scheduler flow.
- Idempotence/retries/guards: status updateMany includes `REVOKE_PENDING`; duplicate events no-op.

## File List

- packages/api/prisma/schema.prisma
- packages/api/prisma/migrations/*
- packages/api/src/modules/channel-access/channel-access.service.ts
- packages/api/src/modules/channel-access/channel-access.service.spec.ts
- packages/api/test/stripe-webhook.e2e-spec.ts
- docs/architecture.md

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- State machine: PENDING -> GRANTED -> REVOKE_PENDING -> REVOKED.
