# Migration init

Créée manuellement via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.

Cette migration initialise l’intégralité du schéma : organisations, utilisateurs, produits, plans, abonnements, accès canaux, événements de paiement, invitations Telegram et journaux d’audit.
