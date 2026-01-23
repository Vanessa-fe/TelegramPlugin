# ADR 002 - Retention policy baseline for audit logs and payment events

Status: Accepted
Date: 2026-01-22

## Context
- MVP requires audit logs and payment event history for compliance and evidence pack.
- Retention durations must be defined for operations and RGPD expectations.
- Data model includes `AuditLog` and `PaymentEvent`.

## Decision
- `AuditLog` retention: 400 days.
- `PaymentEvent` retention: 730 days.
- Values are configurable via:
  - `AUDIT_LOG_RETENTION_DAYS`
  - `PAYMENT_EVENT_RETENTION_DAYS`

## Consequences
- Cleanup automation is required to enforce retention (Phase 1+).
- Evidence pack can rely on retained data within these windows.

## Out of scope
- Implementing cleanup jobs.
- Legal review or policy publication updates.
