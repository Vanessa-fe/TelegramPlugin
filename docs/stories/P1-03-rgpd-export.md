# P1-03 — RGPD export workflow

## Scope

- Reference backlog: P1-03
- Objective: export data for creator on request with SLA tracking

## Tasks

- [x] Add tests + implement export job (archive + SLA tracking + audit log)
- [x] Document RGPD export flow
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: RGPD export stored as JSON archive on disk; SLA due date fixed at 30 days; audit log on completion
- Assumptions: export directory is local to API runtime; org admins request exports for their org
- Edge cases: missing organization marks export FAILED; non-pending exports are skipped
- TODO (out of scope): archive download endpoint, external storage (S3/GCS)

## Implementation

- Summary: DataExport model + scheduler processing with archive generation, SLA tracking, and audit log completion
- Jobs/services impacted: DataExportsService, SchedulerService
- Idempotence/retries/guards: processExport skips non-pending; errors update status to FAILED

## File List

- packages/api/prisma/schema.prisma
- packages/api/prisma/migrations/20260301100000_add_data_exports/migration.sql
- packages/api/src/modules/data-exports/data-exports.controller.ts
- packages/api/src/modules/data-exports/data-exports.module.ts
- packages/api/src/modules/data-exports/data-exports.schema.ts
- packages/api/src/modules/data-exports/data-exports.service.ts
- packages/api/src/modules/data-exports/data-exports.service.spec.ts
- packages/api/src/modules/scheduler/scheduler.module.ts
- packages/api/src/modules/scheduler/scheduler.service.ts
- packages/api/src/modules/scheduler/scheduler.service.spec.ts
- packages/api/src/app.module.ts
- .env.example
- docs/environment.md
- docs/architecture.md

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- SLA target: completion within 30 days of request.
