# P1-10 — Metrics and alerting

## Scope

- Référence backlog: P1-10
- Objectif: Visibility on webhook and access reliability

## Acceptance Criteria

- [x] AC1: Metrics for webhook success, job failures, queue lag
- [x] AC2: Alerts for webhook failure rate and latency
- [x] AC3: Endpoint /metrics Prometheus-compatible
- [x] AC4: Documentation des seuils d'alerte

## Dev Agent Record

### Décisions prises

1. **prom-client** pour les métriques Prometheus (standard Node.js)
2. Métriques exposées via `/metrics` endpoint public (pas de auth pour scraping)
3. Compteurs et histogrammes pour webhooks et jobs
4. Seuils d'alerte basés sur NFR existants (latence < 2s P95)

### Hypothèses

- Prometheus scraper externe (Grafana Cloud, Datadog, etc.)
- Pas de push gateway, pull model classique
- Métriques API-side uniquement (worker émet déjà des logs métriques)

### Edge cases identifiés

- Webhook signature failure: comptabilisé comme failure
- Jobs DLQ: comptabilisés comme failures finaux
- Queue lag calculé via BullMQ getWaiting/getActive

### TODO hors scope

- Dashboard Grafana (P2)
- Alertmanager config (infra)
- Worker-side Prometheus (processus séparé)

## Implémentation

### Résumé de l'approche

1. Nouveau `MetricsModule` dans API
2. `MetricsService` singleton avec registres prom-client
3. `MetricsController` expose `/metrics`
4. Instrumentation dans `StripeWebhookService` et `ChannelAccessQueue`
5. Documentation seuils dans `docs/architecture.md`

### Métriques exposées

| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `webhook_requests_total` | Counter | `provider`, `event_type`, `status` | Total webhooks reçus |
| `webhook_duration_seconds` | Histogram | `provider`, `event_type` | Durée traitement webhook |
| `queue_jobs_total` | Counter | `queue`, `status` | Total jobs (completed/failed) |
| `queue_job_duration_seconds` | Histogram | `queue` | Durée traitement job |
| `queue_waiting_jobs` | Gauge | `queue` | Jobs en attente |

### Seuils d'alerte

| Alerte | Condition | Seuil |
|--------|-----------|-------|
| WebhookHighFailureRate | rate(webhook_requests_total{status="error"}[5m]) / rate(webhook_requests_total[5m]) | > 5% |
| WebhookHighLatency | histogram_quantile(0.95, webhook_duration_seconds) | > 2s |
| QueueHighBacklog | queue_waiting_jobs | > 100 |
| JobHighFailureRate | rate(queue_jobs_total{status="failed"}[5m]) / rate(queue_jobs_total[5m]) | > 5% |

## File List

- packages/api/src/modules/metrics/metrics.module.ts
- packages/api/src/modules/metrics/metrics.service.ts
- packages/api/src/modules/metrics/metrics.controller.ts
- packages/api/src/modules/metrics/metrics.service.spec.ts
- packages/api/src/modules/payments/stripe-webhook.service.ts (MAJ)
- packages/api/src/modules/channel-access/channel-access.queue.ts (MAJ)
- packages/api/src/app.module.ts (MAJ)
- packages/api/package.json (MAJ)
- docs/architecture.md (MAJ)

## Tests / Validation

- Tests unitaires MetricsService
- Vérification /metrics retourne format Prometheus
- Vérification compteurs incrémentés sur webhook

## Notes

- Format Prometheus standard pour compatibilité large
- Métriques légères, pas d'impact perf significatif
- Prêt pour intégration Grafana Cloud ou similaire
