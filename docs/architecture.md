# Architecture fonctionnelle et technique

## Vue d’ensemble

- **Objectif produit** : SaaS qui vend l’accès à des canaux Telegram (et, à terme, autres messageries) via des abonnements ou achats uniques.
- **Modules principaux** :
  - `Frontend` (Next.js) : dashboard administrateur, portail client, pages publiques.
  - `Backend API` (NestJS) : gestion des utilisateurs, offres, abonnements, webhooks de paiement, orchestration des invitations.
  - `Worker & File d’attente` (BullMQ/Redis) : exécution idempotente des tâches sensibles (envoi/révocation d’invitations, relances).
  - `Bot Telegram` (grammY) : interface avec l’API Telegram pour générer/annuler des liens et gérer les membres des canaux.
  - `Base de données` (PostgreSQL + Prisma) : stockage persistant, migrations.
  - `Observabilité & Sécurité` : logs structurés (Pino), Sentry, métriques basiques, gestion des secrets.

## Stack technique

- **Frontend** : Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query/TanStack Query pour gérer les appels API.
- **Backend** : NestJS (Fastify adapter), TypeScript, Prisma ORM, PostgreSQL, Zod pour la validation, JWT pour l’auth admin, sessions Telegram côté client via widget.
- **Tâches asynchrones** : BullMQ + Redis (mode worker), réessais exponentiels, déduplication via jobId déterministe.
- **Bot** : grammY avec Webhook HTTP (piloté par le backend) ou long-polling en mode worker séparé (configurable).
- **Paiements** : Stripe (Checkout + Billing), webhooks signés ; couche d’abstraction pour intégrer PayPal plus tard.
  - Abonnement SaaS créateur facturé sur le compte Stripe plateforme.
  - Ventes acheteurs traitées en direct charges sur le compte Connect du créateur.
  - Stripe gère fonds, refunds, litiges, reçus ; la plateforme gère logs PaymentEvent et accès.
- **Infra** : Docker Compose dev, déploiement sur Railway/Render/VPS, DB managée (Neon, Supabase ou Railway), reverse proxy (Traefik/Caddy/nginx) si nécessaire.
- **CI/CD** : GitHub Actions (tests, lint, build, déploiement), Prisma migrate dans le pipeline.

## Domaines fonctionnels

- **Gestion des organisations** : chaque client (entreprise/créateur) possède ses produits, plans tarifaires et canaux.
- **Monétisation** : types d’accès (one-shot, abonnement, essai gratuit), codes promo, coupons.
- **Accès Telegram** : génération d’invitations, suivi de leur usage, révocation, suppression utilisateur si paiement échoue.
- **Conformité (GDPR)** : export des données, anonymisation, suppression sur demande.
- **Administration** : logs, analytics simples (MRR, churn, top clients), suivi des événements bot/paiement.

## Modèle de données (premier jet)

- `User` : compte admin interne (staff) et comptes organisation (multi-tenancy léger).
- `Customer` : client final qui achète un accès.
- `Organization` : entité qui possède les produits et canaux.
- `Product` : offre commerciale (ex. canal Telegram Premium).
- `Plan` : déclinaison tarifaire (mensuel, annuel, one-shot, essai).
- `Subscription` : relation client/plan, inclut statut, dates de facturation, métadonnées Stripe.
- `PaymentEvent` : journal des webhooks paiements (idempotence).
- `Channel` : ressource Telegram (ou futur Discord) liée à un produit.
- `ChannelAccess` : trace de l’accès octroyé (invitation, date expiration, statut).
- `TelegramInvite` : lien généré, nombre d’utilisations restant, date d’expiration.
- `AuditLog` : actions critiques (ajout/retrait membre, remboursement, suppression).

## Flux critiques

1. **Onboarding d’une organisation**
   - Admin crée une organisation dans le dashboard.
   - L’organisation connecte Stripe (OAuth) ou configure les clés API.
   - L’organisation ajoute un canal Telegram (bot devient admin) et crée un produit/plan.

1. **Achat client final**
   - Client arrive sur la page de vente (`/client/{slug}`), choisit un plan.
   - Redirection vers Stripe Checkout.
   - Webhook Stripe (payment_intent.succeeded / checkout.session.completed) réceptionné par l’API.
   - Création ou mise à jour du `Customer`, du `Subscription`.
   - Envoi d’un job asynchrone `GrantAccessJob` avec `subscriptionId`.
   - Worker appelle le Bot API pour générer (ou récupérer) un `TelegramInvite`, puis l’envoie au client (email/Telegram bot) ou retourne via portail.

1. **Échec paiement / annulation**
   - Webhook Stripe (invoice.payment_failed, customer.subscription.deleted).
   - Traitement backend : mise à jour `Subscription` au statut `past_due` ou `canceled`.
   - Job asynchrone `RevokeAccessJob` : bot supprime l’utilisateur du canal ou invalide l’invitation.
   - Notifications au client/organisation.

1. **Renouvellement / upgrade**
   - Stripe gère la facturation récurrente.
   - Webhook déclenche mise à jour du `Subscription` et refresh d’expiration côté `ChannelAccess`.

## Structure de code envisagée

```text
packages/
  api/            # NestJS (modules par domaine)
  bot/            # grammY, logique Telegram
  frontend/       # Next.js (app router)
  worker/         # BullMQ processors (peut vivre dans api si simple)
  shared/         # librairies communes (schemas Zod, SDK client)
infra/
  docker/         # Dockerfiles, compose
  terraform/      # (optionnel) IaC futur
docs/
  architecture.md # ce document
```

## Sécurité & conformité

- JWT admin avec rotation des refresh tokens, stockage cookies HttpOnly.
- Limiter l’accès aux API via API Keys par organisation pour automatisations.
- Vérification des signatures webhooks Stripe, stockage des événements avant traitement (idempotence).
- Rate limiting sur endpoints publics, protection CSRF pour les formulaires.
- Politique de sauvegarde PostgreSQL (snapshots quotidiens), secrets en variables d’environnement.

## Observabilité

- Logs JSON via Pino (corrélation par `requestId`).
- Sentry pour backend/bot/frontend.
- Healthchecks : `/healthz`, `/readyz`, exposition Prometheus (metrics de jobs, API).
- Dashboard d’alerte simple (uptime robot ou statuspage).

## Roadmap MVP (résumé)

1. Setup projet monorepo + tooling (TurboRepo ou Nx).
2. Auth admin + onboarding organisation, gestion produits/plans.
3. Intégration Stripe Checkout + webhooks + pipeline d’invitation Telegram.
4. Dashboard analytics basiques (MRR, nombre de clients, logs bot).
5. Docs de déploiement (Docker Compose, instructions Railway/Render).
6. Gestion export/suppression données utilisateur.

## Ouvertures futures

- Support Discord/WhatsApp via interface `ChannelProvider`.
- Ajout d’autres PSP (PayPal, Paddle) en appliquant le même pattern `PaymentProvider`.
- Marketplace de templates de landing pages pour les créateurs.
- Intégration CRM (HubSpot, Notion) et emailing (Customer.io, Mailjet).
