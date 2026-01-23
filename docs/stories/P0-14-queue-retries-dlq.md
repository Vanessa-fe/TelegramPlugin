# P0-14 — Retries 24h + DLQ + replay manuel

## Scope

- Reference backlog: P0-14
- Objective: retries >=24h avec backoff, DLQ, endpoint replay manuel

## Tasks

- [x] Ajouter tests pour replay endpoint et DLQ handling
- [x] Ajuster policy de retry BullMQ >=24h
- [x] Implementer DLQ pour grant/revoke
- [x] Ajouter endpoint replay manuel
- [x] Run `pnpm -C packages/api test` et `pnpm -C packages/shared test`

## Dev Agent Record

- Decisions: retries BullMQ = 10 attempts, backoff exponentiel base 5m (~42h); DLQ par queue; replay manuel limite a SUPERADMIN.
- Assumptions: jobs DLQ removed from queue source; replay supprime un job existant avant re-add.
- Edge cases: replay DLQ d'un job introuvable -> error; replay multiple -> jobId recree.
- TODO (out of scope): UI ops pour DLQ (Phase 3)

## Implementation

- Summary: ajout queues DLQ, move to DLQ apres dernier retry, endpoint replay.
- Jobs/services impacted: ChannelAccessQueue, worker BullMQ, controller access.
- Idempotence/retries/guards: replay supprime job existant avant re-queue.

## File List

- packages/shared/src/index.ts
- packages/shared/src/index.js
- packages/shared/src/index.d.ts
- packages/shared/src/index.test.ts
- packages/api/src/modules/channel-access/channel-access.queue.ts
- packages/api/src/modules/channel-access/channel-access.controller.ts
- packages/api/src/modules/channel-access/channel-access.controller.spec.ts
- packages/worker/src/main.ts

## Tests / Validation

- `pnpm -C packages/api test`
- `pnpm -C packages/shared test`

## Notes

- Endpoint replay scope limite a SUPERADMIN (P0-15 ajoute Support role).
