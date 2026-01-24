# P1-04 — RGPD delete workflow

## Scope

- Reference backlog: P1-04
- Objective: delete or pseudonymize user data on request (customer + organization)

## Tasks

- [x] Add tests for RGPD delete flows (customer + organization)
- [x] Add soft-delete/anonymisation fields and deletion service
- [x] Add delete endpoints + audit logs + access revocation
- [x] Document RGPD delete flow
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: soft-delete via `deletedAt` on Organization/Customer; anonymize user emails and disable accounts; scrub payment event payloads to decouple
- Assumptions: deletion endpoints are synchronous; org deletion cascades via customer deletion
- Edge cases: repeated delete is no-op; missing org/customer returns NotFound
- TODO (out of scope): deferred hard purge scheduling, archive download of deleted data

## Implementation

- Summary: added DataDeletionsService with customer/org deletion, audit logs, access revocation, and anonymization
- Jobs/services impacted: DataDeletionsService, OrganizationsController
- Idempotence/retries/guards: delete operations short-circuit if already deleted; audit logs written per action

## File List

- packages/api/prisma/schema.prisma
- packages/api/prisma/migrations/20260401120000_add_rgpd_deleted_at_fields/migration.sql
- packages/api/src/modules/data-deletions/data-deletions.module.ts
- packages/api/src/modules/data-deletions/data-deletions.service.ts
- packages/api/src/modules/data-deletions/data-deletions.service.spec.ts
- packages/api/src/modules/organizations/organizations.controller.ts
- packages/api/src/modules/organizations/organizations.module.ts
- docs/architecture.md

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Default strategy: anonymisation + soft delete; hard purge deferred.
