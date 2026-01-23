# P0-13 — Grace period sur echec paiement

## Scope

- Reference backlog: P0-13
- Objective: garder acces pendant la grace, revoquer apres expiration, notifier echec + revoke

## Tasks

- [x] Ajouter tests pour expiration de grace (Scheduler + access revoke)
- [x] Planifier la revocation a expiration de `graceUntil`
- [x] S'assurer des notifications sur echec + revoke
- [x] Run `pnpm -C packages/api test`

## Dev Agent Record

- Decisions: cron toutes les 15 minutes pour traiter `graceUntil` expire; revoke via `handlePaymentFailure` avec nettoyage `graceUntil`.
- Assumptions: `invoice.payment_failed` met le statut en `PAST_DUE`; paiement succeed repasse `ACTIVE`, donc pas de revoke.
- Edge cases: eviter re-notify en filtrant les acces actifs; `graceUntil` remis a null pour eviter reprocessing.
- TODO (out of scope): etat REVOKE_PENDING (P0-10)

## Implementation

- Summary: scheduler ajoute un scan des graces expirees; `handlePaymentFailure` nettoie `graceUntil` et notifie seulement les acces actifs.
- Jobs/services impacted: `SchedulerService`, `ChannelAccessService`.
- Idempotence/retries/guards: revoke idempotent via updateMany + access filter.

## File List

- packages/api/src/modules/scheduler/scheduler.service.ts
- packages/api/src/modules/scheduler/scheduler.service.spec.ts
- packages/api/src/modules/channel-access/channel-access.service.ts
- packages/api/src/modules/channel-access/channel-access.service.spec.ts

## Tests / Validation

- `pnpm -C packages/api test`

## Notes

- Revoke effectif via worker BullMQ.
