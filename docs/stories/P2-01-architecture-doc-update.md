# P2-01 — Architecture doc update

## Scope

- Référence backlog: P2-01
- Objectif: Document target architecture and boundaries

## Acceptance Criteria

- [x] AC1: `docs/architecture.md` updated with state machine and flows

## Dev Agent Record

### Décisions prises

1. Diagramme ASCII state machine pour ChannelAccess
2. Documentation des transitions avec triggers et actions
3. Détail du flux grace period
4. Section queues et retries

### Hypothèses

- Format ASCII pour compatibilité universelle (pas de Mermaid)
- Lien vers runbook pour les procédures opérationnelles

## Implémentation

### Modifications apportées

1. **Section "État d'accès" enrichie**:
   - Diagramme state machine ASCII
   - Table des transitions (De → Vers, Trigger, Action)
   - Documentation grace period
   - Configuration queues/retries

2. **Flux critiques mis à jour**:
   - Flux "Échec paiement avec grace period" détaillé
   - Flux "Annulation/Refund" séparé

## File List

- docs/architecture.md (MAJ)
- docs/stories/P2-01-architecture-doc-update.md

## Tests / Validation

- Review manuelle du document
- Liens internes vérifiés

## Notes

- Documentation prête pour onboarding nouveaux développeurs
- State machine alignée avec code réel
