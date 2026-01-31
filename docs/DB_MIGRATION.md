# DB_MIGRATION.md — TelegramPlugin

Runbook de migration PostgreSQL entre providers (Neon ↔ Supabase ↔ autre Postgres).
Objectif : migrer sans casser le code (NestJS/Prisma) ni perdre de données.

---

## TL;DR

- Neon, Supabase, AWS RDS = PostgreSQL standard → le code ne casse pas “juste” en changeant de provider.
- La clé : un dump/restore propre + Prisma migrations clean + mise à jour des envs (api/worker/bot).
- Procédure : `pg_dump` → `pg_restore` → `prisma migrate deploy` → update `DATABASE_URL` → smoke tests.

---

## Pré-requis

### Outils

- `pg_dump` / `pg_restore` (Postgres client tools)
- Accès aux dashboards Neon / Supabase
- Accès aux variables d’env (Fly.io / CI / etc.)
- Prisma installé dans le repo

### Règles Prisma (IMPORTANT)

- Ne jamais modifier une migration existante.
- Dev : `prisma migrate dev`
- Prod : `prisma migrate deploy`

---

## Architecture impactée (TelegramPlugin)

Services qui utilisent `DATABASE_URL` :

- `packages/api`
- `packages/worker`
- `packages/bot`

⚠️ Risque #1 : oublier de mettre à jour une URL dans un service.

---

## Quand migrer ?

### Neon Free → Supabase Pro

À faire quand :

- on lance “vraie prod” mais on veut limiter les coûts
- on veut des backups/restore + stabilité sans payer Neon Launch

### Supabase Pro → Neon Launch

À faire quand :

- traction réelle (plusieurs créateurs / paiements réguliers)
- besoin des features Neon (scaling fin, branches DB, etc.)

---

## Checklist avant migration

- [ ] Choisir une fenêtre calme (faible trafic)
- [ ] Optionnel : mettre l’app en mode “maintenance” / limiter les écritures
- [ ] Vérifier qu’on a toutes les credentials source et target
- [ ] Vérifier qu’on sait où sont les secrets (Fly.io / CI)
- [ ] Faire un plan rollback (voir section rollback)

---

## Procédure standard : Source → Target (Postgres → Postgres)

### 1) Export (dump) depuis la DB source

Définir les variables :

```bash
export SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/dbname"
export DUMP_FILE="db.dump"
```
