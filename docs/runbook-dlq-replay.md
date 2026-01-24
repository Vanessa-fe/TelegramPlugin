# Runbook: DLQ et Replay des Jobs

Ce document décrit les procédures opérationnelles pour gérer les jobs en échec (Dead Letter Queue) et les actions de support manuelles.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des queues](#architecture-des-queues)
3. [Diagnostic](#diagnostic)
4. [Procédures de replay](#procédures-de-replay)
5. [Actions support manuelles](#actions-support-manuelles)
6. [Troubleshooting](#troubleshooting)
7. [Alertes](#alertes)

---

## Vue d'ensemble

### Queues BullMQ

| Queue | Description | Retry Policy |
|-------|-------------|--------------|
| `grant-access` | Jobs de grant d'accès channel | 10 attempts, 5min backoff expo (~42h) |
| `revoke-access` | Jobs de révocation d'accès | 10 attempts, 5min backoff expo (~42h) |
| `grant-access-dlq` | Dead Letter Queue pour grant | Aucun retry (manual) |
| `revoke-access-dlq` | Dead Letter Queue pour revoke | Aucun retry (manual) |

### Flux de retry

```
Job créé → Queue principale → Worker traite
                ↓ (échec)
            Retry 1-10 (backoff exponentiel)
                ↓ (10 échecs)
            Déplacé vers DLQ
                ↓ (investigation)
            Replay manuel via API
```

---

## Architecture des queues

### Format des Job IDs

```
grant:{subscriptionId}:{channelId}
revoke:{subscriptionId}:{reason}
```

Exemples:
- `grant:550e8400-e29b-41d4-a716-446655440000:channel-123`
- `revoke:550e8400-e29b-41d4-a716-446655440000:payment_failed`

### Payload Grant Access

```json
{
  "subscriptionId": "uuid",
  "channelId": "uuid",
  "customerId": "uuid",
  "provider": "stripe" | "telegram_stars"
}
```

### Payload Revoke Access

```json
{
  "subscriptionId": "uuid",
  "reason": "payment_failed" | "canceled" | "manual" | "refund" | "expired"
}
```

---

## Diagnostic

### Prérequis

- Accès Redis CLI ou connexion à `REDIS_URL`
- Token API avec rôle `SUPERADMIN` ou `SUPPORT`

### Commandes Redis CLI

#### Lister les jobs en DLQ

```bash
# Connexion Redis
redis-cli -u $REDIS_URL

# Compter les jobs dans chaque DLQ
LLEN bull:grant-access-dlq:waiting
LLEN bull:revoke-access-dlq:waiting

# Lister les job IDs en DLQ (10 premiers)
LRANGE bull:grant-access-dlq:waiting 0 9
LRANGE bull:revoke-access-dlq:waiting 0 9
```

#### Inspecter un job spécifique

```bash
# Récupérer les données d'un job
HGETALL bull:grant-access-dlq:{jobId}

# Voir le payload
HGET bull:grant-access-dlq:{jobId} data

# Voir le nombre de tentatives
HGET bull:grant-access-dlq:{jobId} attemptsMade

# Voir la raison d'échec
HGET bull:grant-access-dlq:{jobId} failedReason
```

### Vérifier les métriques Prometheus

```bash
# Nombre de jobs en attente (DLQ non-empty = problème)
curl -s http://localhost:3001/metrics | grep queue_waiting_jobs

# Exemple de sortie
# queue_waiting_jobs{queue="grant-access"} 0
# queue_waiting_jobs{queue="revoke-access"} 0
# queue_waiting_jobs{queue="grant-access-dlq"} 2  # ALERTE!
# queue_waiting_jobs{queue="revoke-access-dlq"} 0
```

### Vérifier les logs Worker

```bash
# Chercher les erreurs de job (format Pino JSON)
grep '"level":50' worker.log | jq '.msg, .jobId, .err'

# Filtrer par subscriptionId
grep 'subscriptionId' worker.log | grep '"level":50' | jq '.'
```

---

## Procédures de replay

### Replay via API (recommandé)

#### Endpoint Support

```bash
# Replay un job grant depuis DLQ
curl -X POST https://api.example.com/access/support/replay \
  -H "Authorization: Bearer $SUPPORT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: incident-123" \
  -d '{
    "queue": "grant",
    "jobId": "grant:550e8400-e29b-41d4-a716-446655440000:channel-123"
  }'

# Replay un job revoke depuis DLQ
curl -X POST https://api.example.com/access/support/replay \
  -H "Authorization: Bearer $SUPPORT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: incident-123" \
  -d '{
    "queue": "revoke",
    "jobId": "revoke:550e8400-e29b-41d4-a716-446655440000:payment_failed"
  }'
```

#### Endpoint Admin (SUPERADMIN only)

```bash
curl -X POST https://api.example.com/access/replay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "queue": "grant",
    "jobId": "grant:550e8400-e29b-41d4-a716-446655440000:channel-123"
  }'
```

### Vérification post-replay

1. Vérifier que le job a été retiré du DLQ:
   ```bash
   LLEN bull:grant-access-dlq:waiting
   ```

2. Vérifier que le job est dans la queue principale:
   ```bash
   LLEN bull:grant-access:waiting
   ```

3. Surveiller les logs worker pour le traitement

4. Vérifier le statut de l'accès en base:
   ```sql
   SELECT status, grantedAt, revokedAt
   FROM "ChannelAccess"
   WHERE "subscriptionId" = '550e8400-e29b-41d4-a716-446655440000';
   ```

---

## Actions support manuelles

### Force Grant Access

Utiliser quand un client a payé mais n'a pas reçu l'accès.

```bash
curl -X POST https://api.example.com/access/support/grant \
  -H "Authorization: Bearer $SUPPORT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: ticket-456" \
  -d '{
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Checklist avant force grant:**
- [ ] Vérifier le paiement dans Stripe Dashboard
- [ ] Vérifier le statut de la subscription en base
- [ ] Documenter le ticket support

### Force Revoke Access

Utiliser pour révoquer manuellement un accès (fraude, refund, etc).

```bash
curl -X POST https://api.example.com/access/support/revoke \
  -H "Authorization: Bearer $SUPPORT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: ticket-789" \
  -d '{
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "reason": "refund"
  }'
```

**Raisons valides:**
- `payment_failed` - Échec de paiement
- `canceled` - Annulation client
- `manual` - Action manuelle (mappé vers `canceled`)
- `refund` - Remboursement effectué

---

## Troubleshooting

### Problème: Job échoue en boucle

**Symptômes:** Job retry puis DLQ, replay échoue aussi.

**Investigation:**
1. Inspecter la `failedReason` du job
2. Vérifier les logs worker pour le stack trace
3. Vérifier si le channel Telegram existe encore
4. Vérifier les permissions du bot

**Actions:**
- Si channel supprimé: revoke manuellement l'accès
- Si bot bloqué: contacter le créateur pour réinviter le bot
- Si erreur Telegram API: attendre et retry

### Problème: Accès accordé mais invite non envoyée

**Symptômes:** `ChannelAccess.status = GRANTED` mais client sans lien.

**Investigation:**
```sql
SELECT ca.*, ti.inviteLink, ti.status as invite_status
FROM "ChannelAccess" ca
LEFT JOIN "TelegramInvite" ti ON ti."channelAccessId" = ca.id
WHERE ca."subscriptionId" = '...';
```

**Actions:**
1. Si invite existe et ACTIVE: renvoyer le lien au client
2. Si invite REVOKED: générer nouvelle invite via bot
3. Si pas d'invite: force grant pour retrigger

### Problème: DLQ grandit sans traitement

**Symptômes:** Métrique `queue_waiting_jobs{queue="*-dlq"}` augmente.

**Actions immédiates:**
1. Identifier les jobs en échec (pattern commun?)
2. Résoudre la cause root (API down? Permissions?)
3. Replay batch des jobs

**Replay batch (script):**
```bash
#!/bin/bash
# replay-dlq.sh - Replay tous les jobs grant DLQ

for jobId in $(redis-cli -u $REDIS_URL LRANGE bull:grant-access-dlq:waiting 0 -1); do
  echo "Replaying $jobId..."
  curl -X POST https://api.example.com/access/support/replay \
    -H "Authorization: Bearer $SUPPORT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"queue\": \"grant\", \"jobId\": \"$jobId\"}"
  sleep 1
done
```

---

## Alertes

### Configuration recommandée

| Alerte | Condition | Seuil | Action |
|--------|-----------|-------|--------|
| DLQNonEmpty | `queue_waiting_jobs{queue=~".*-dlq"} > 0` | > 0 | Investiguer immédiatement |
| DLQGrowing | `increase(queue_waiting_jobs{queue=~".*-dlq"}[1h])` | > 5 | Problème systémique |
| QueueBacklog | `queue_waiting_jobs{queue="grant-access"}` | > 100 | Worker surchargé |

### Prometheus AlertManager (exemple)

```yaml
groups:
  - name: dlq-alerts
    rules:
      - alert: DLQNonEmpty
        expr: queue_waiting_jobs{queue=~".*-dlq"} > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "DLQ contient des jobs en échec"
          description: "{{ $labels.queue }} a {{ $value }} jobs en attente de replay"
          runbook: "https://docs.example.com/runbook-dlq-replay"
```

---

## Contacts

| Rôle | Contact | Escalation |
|------|---------|------------|
| Support L1 | support@example.com | Replay DLQ, force grant/revoke |
| Support L2 | oncall@example.com | Investigation root cause |
| Engineering | eng-oncall@example.com | Fix code, deploy hotfix |

---

*Dernière mise à jour: 2026-01-23*
