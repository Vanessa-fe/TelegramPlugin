# P2-02 — Ops checklist update

## Scope

- Référence backlog: P2-02
- Objectif: Align setup docs with new config

## Acceptance Criteria

- [x] AC1: `docs/setup.md` updated
- [x] AC2: `docs/environment.md` updated

## Dev Agent Record

### Décisions prises

1. Ajout section "Monitoring et observabilité" dans setup.md
2. Lien vers runbook DLQ
3. Documentation endpoints de santé

### Hypothèses

- environment.md déjà à jour avec nouvelles variables
- Port API par défaut = 3001

## Implémentation

### Modifications apportées

**setup.md:**
- Section "Monitoring et observabilité"
  - Endpoints /healthz, /readyz, /metrics
  - Métriques clés à surveiller
  - Lien vers runbook
- MAJ section commercialisation avec lien alertes Prometheus

**environment.md:**
- Déjà à jour (vérifié)
  - PAYMENT_GRACE_PERIOD_DAYS
  - AUDIT_LOG_RETENTION_DAYS
  - PAYMENT_EVENT_RETENTION_DAYS
  - ACCESS_LATENCY_ALERT_MS
  - DATA_EXPORT_DIR

## File List

- docs/setup.md (MAJ)
- docs/environment.md (vérifié, pas de changement)
- docs/stories/P2-02-ops-checklist-update.md

## Tests / Validation

- Vérification des liens internes
- Commandes curl testables

## Notes

- Documentation opérationnelle complète
- Prêt pour déploiement production
