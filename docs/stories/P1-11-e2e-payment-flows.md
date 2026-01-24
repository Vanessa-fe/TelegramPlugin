# P1-11 — E2E tests for payment flows

## Scope

- Référence backlog: P1-11
- Objectif: Cover critical payment flows end to end

## Acceptance Criteria

- [x] AC1: Stripe success -> grant (déjà couvert dans stripe-webhook.e2e-spec.ts)
- [x] AC2: Stripe payment failed -> grace -> revoke (scheduler.e2e-spec.ts)
- [x] AC3: Telegram Stars payment -> grant (telegram-stars.e2e-spec.ts)

## Dev Agent Record

### Décisions prises

1. Tests E2E Stripe existants déjà complets dans `stripe-webhook.e2e-spec.ts`
2. Ajout test grace period expiry -> scheduler revoke dans `scheduler.e2e-spec.ts`
3. Nouveau fichier `telegram-stars.e2e-spec.ts` pour flux Stars

### Hypothèses

- Mock BullMQ queue (pas de Redis en test)
- Service calls directs pour simuler webhooks
- Prisma test database (DATABASE_URL)

### Edge cases identifiés

- Grace period expiry avec graceUntil dans le passé
- Stars payment avec subscription déjà traitée (idempotence)
- Plusieurs channels par subscription

### TODO hors scope

- Test end-to-end avec vraies API Stripe/Telegram (staging)
- Performance tests (P2)

## Implémentation

### Résumé de l'approche

1. Vérifier tests existants couvrent Stripe success + failure + grace
2. Ajouter test scheduler grace expiry dans scheduler.e2e-spec.ts
3. Créer telegram-stars.e2e-spec.ts avec flux Stars complet

### Tests ajoutés

| Fichier | Test | Description |
|---------|------|-------------|
| scheduler.e2e-spec.ts | grace period expiry -> revoke | Scheduler détecte grace expiré et révoque |
| telegram-stars.e2e-spec.ts | Stars invoice creation | Création invoice avec conversion Stars |
| telegram-stars.e2e-spec.ts | Stars payment success | Paiement Stars -> grant access |
| telegram-stars.e2e-spec.ts | pre-checkout validation | Validation avant paiement |

## File List

- packages/api/test/scheduler.e2e-spec.ts (MAJ)
- packages/api/test/telegram-stars.e2e-spec.ts (NEW)
- docs/stories/P1-11-e2e-payment-flows.md

## Tests / Validation

- pnpm -C packages/api test:e2e
- Tous les flux critiques couverts

## Notes

- Mock queue évite dépendance Redis en CI
- Tests isolation via cleanDatabase() entre chaque test
