# P0-12 — Grant/revoke pipeline latency

## Scope

- Reference backlog: P0-12
- Objective: payment confirmed -> access granted <2s P95; metric recorded; alert threshold defined

## Tasks

- [x] Add tests for latency metric helper
- [x] Record latency on grant/revoke completion + alert threshold
- [x] Prioritize grant jobs
- [x] Update env docs for latency threshold
- [x] Run `pnpm -C packages/api test` and `pnpm -C packages/shared test`

## Dev Agent Record

- Decisions: latency computed from BullMQ job timestamps; alert threshold default 2000ms.
- Assumptions: queue timestamp approximates payment-confirmation start.
- Edge cases: missing job timestamps -> latency null.
- TODO (out of scope): metrics backend integration (Phase 3)

## Implementation

- Summary: shared latency helper; worker logs latency + warns on threshold; grant jobs prioritized.
- Jobs/services impacted: worker, ChannelAccessQueue, shared utils.
- Idempotence/retries/guards: not applicable.

## File List

- packages/shared/src/index.ts
- packages/shared/src/index.js
- packages/shared/src/index.d.ts
- packages/shared/src/index.test.ts
- packages/worker/src/main.ts
- packages/api/src/modules/channel-access/channel-access.queue.ts
- .env.example
- docs/environment.md

## Tests / Validation

- `pnpm -C packages/api test`
- `pnpm -C packages/shared test`

## Notes

- Latency measured from BullMQ job timestamp to completion.
