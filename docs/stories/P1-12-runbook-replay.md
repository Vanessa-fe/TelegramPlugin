# P1-12 — Runbook and replay procedure

## Scope

- Référence backlog: P1-12
- Objectif: Operational readiness for incidents

## Acceptance Criteria

- [x] AC1: Runbook doc for replay and DLQ
- [x] AC2: Manual steps verified (documented commands)

## Dev Agent Record

### Décisions prises

1. Runbook créé dans `docs/runbook-dlq-replay.md`
2. Commandes Redis pour diagnostic DLQ
3. Endpoints API pour replay documentés
4. Alertes DLQ non-empty documentées

### Hypothèses

- Accès Redis CLI ou BullMQ Dashboard disponible
- Accès API avec token SUPERADMIN ou SUPPORT
- Logs disponibles dans Pino JSON format

### Edge cases identifiés

- Job DLQ avec payload corrompu
- Job déjà replayed (idempotence)
- Queue principale bloquée pendant replay

### TODO hors scope

- Dashboard BullMQ UI (P2)
- Alerting PagerDuty intégration (infra)

## Implémentation

### Résumé de l'approche

1. Documentation complète des procédures DLQ
2. Commandes Redis pour inspection
3. Endpoints API pour actions support
4. Troubleshooting guide

## File List

- docs/runbook-dlq-replay.md (NEW)
- docs/stories/P1-12-runbook-replay.md
- docs/architecture.md (MAJ - lien vers runbook)

## Tests / Validation

- Vérification des commandes Redis documentées
- Vérification des endpoints API documentés

## Notes

- Runbook prêt pour utilisation support immédiate
- Commandes testables en staging avant prod
