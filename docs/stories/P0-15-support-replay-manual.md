# P0-15 — Support replay and manual actions

## Scope

- Reference backlog: P0-15
- Objective: support can replay or force grant/revoke; action logged

## Tasks

- [x] Add tests for support endpoints
- [x] Add support-only endpoints for replay + manual grant/revoke
- [x] Log support actions in AuditLog
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: add /access/support/* endpoints restricted to SUPPORT; audit log action names prefixed with support.access; parse subscriptionId from jobId
- Assumptions: DLQ jobId format keeps subscriptionId in segment 2
- Edge cases: missing subscription skips audit log; invalid jobId skips audit log
- TODO (out of scope): support UI (Phase 3)

## Implementation

- Summary: added support endpoints for grant, revoke, replay with audit log writes and subscription lookup
- Jobs/services impacted: ChannelAccessController, AuditLogService, ChannelAccessModule
- Idempotence/retries/guards: DLQ replay still uses existing dedupe; audit log writes are best effort after action

## File List

- packages/api/src/modules/audit-log/audit-log.module.ts
- packages/api/src/modules/audit-log/audit-log.service.ts
- packages/api/src/modules/channel-access/channel-access.controller.ts
- packages/api/src/modules/channel-access/channel-access.controller.spec.ts
- packages/api/src/modules/channel-access/channel-access.module.ts

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Support role only.
