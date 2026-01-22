---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
inputDocuments:
  - SESSION.md
  - _bmad/context.md
  - _bmad-output/planning-artifacts/research/market-community-monetization-platforms-research-2026-01-21.md
  - docs/index.md
  - docs/architecture.md
  - docs/environment.md
  - docs/setup.md
  - docs/email-configuration.md
  - docs/project-scan-report.json
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 0
  projectDocs: 6
  other: 2
classification:
  projectType: saas_b2b
  domain: fintech
  complexity: high
  projectContext: brownfield
date: '2026-01-22'
workflowType: 'prd'
workflow: 'edit'
lastEdited: '2026-01-22'
editHistory:
  - date: '2026-01-22'
    changes: 'measurability fixes, compliance matrix, glossary, leakage reduction'
---

# Product Requirements Document - TelegramPlugin

**Author:** Vanessa
**Date:** 2026-01-22

## Executive Summary
- EU-first SaaS for Telegram creators in Europe to monetize subscriptions and digital products with a flat-fee model (19 EUR early adopters, 29 EUR public) and no commission.
- Target users: EU creators/admins managing small to medium Telegram communities; MVP is Telegram-only.
- Payments: Stripe Checkout + Telegram Stars; platform is not merchant of record for creator sales.
- Compliance-first: RGPD workflows, EU data residency, TVA invoices for SaaS subscription; assisted processes, no legal advice.
- Non-negotiable: reliable payment -> access flow with automated grant/revoke and idempotence.

## Glossary
- Access: etat des droits donne a un acheteur apres paiement (grant) et retire apres annulation ou echec (revoke).
- Grace period: delai entre echec renouvellement et retrait acces, par defaut 3 a 7 jours.
- Evidence pack: bundle minimal comprenant log DSAR horodate, factures SaaS, preuve de residence data UE, journal paiements et acces.
- Produit digital simple: un seul asset par offre, soit fichier telechargeable soit lien externe, sans bundle.
- Evenements basiques: paiement reussi ou echoue, grant ou revoke acces, changement statut abonnement.
- Analytics detaillees: retention, churn, conversion, ARPA, revenus par offre et cohorte.
- Non-MoR: la plateforme nest pas merchant of record pour ventes createur, le createur reste vendeur.

## Success Criteria

### User Success
- Temps de setup: < 10 minutes entre inscription et configuration prete
- Delai premiere vente: < 24h pour createur actif
- Taux de conversion Telegram (visiteur -> acheteur): 3 a 5 pour cent

### Business Success
- A 3 mois: 50 a 100 createurs payants, MRR 1000 a 2000 EUR, ARPA 15 a 20 EUR, churn 8 a 10 pour cent
- A 12 mois: 500 a 1000 createurs payants, MRR 15k a 25k EUR, ARPA 20 a 25 EUR, churn < 5 pour cent
- Pricing flat fee sans commission: 19 EUR early adopters, 29 EUR prix public

### Technical Success
- Latence paiement a acces: < 2 s (objectif < 1 s)
- Taux de reussite webhooks Stripe et Telegram: > 99 pour cent
- RGPD: export ou suppression < 30 jours (objectif < 7 jours)
- Data residency: donnees hebergees en Union Europeenne
- TVA: OSS/IOSS pour abonnement SaaS, collecte TVA automatique
- Paiements: aucun custody des fonds clients finaux, PSP gere les fonds

### Measurable Outcomes
- Setup < 10 minutes, premiere vente < 24h, conversion 3 a 5 pour cent
- MRR 1 a 2k a 3 mois, 15 a 25k a 12 mois
- Churn < 10 pour cent early, < 5 pour cent a 12 mois
- Webhooks > 99 pour cent, acces < 2 s, RGPD < 30 jours

## Product Scope & Phasing

### MVP Strategy & Delivery
- **MVP Approach:** problem solving + experience
- **Resource Requirements:** 1 dev fullstack senior ou 1 backend + 1 frontend light, support ops par le fondateur, UI utilitaire
- **Delivery Target:** 6 a 8 semaines pour MVP utilisable, puis iterations courtes

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Alex onboarding, creation offre, publication lien
- Sophie achat, paiement, acces
- Echec paiement + retry + revoke apres grace period
- Admin ops monitoring webhooks et RGPD
- Support incident acces

**Must-Have Capabilities:**
- Onboarding createur rapide (compte, plan, TVA, bot Telegram)
- Paiements Stripe + Telegram Stars, webhooks fiables
- Grant/revoke automatique et idempotent
- Dashboard createur avec revenus mensuels, revenus par offre, abonnes actifs, en grace period, en retard
- Facturation + emails transactionnels (confirmation, echec paiement)
- RGPD base: export, suppression, audit log minimal
- Trial 7 jours, decision CB apres analyse fraude

### Phase 2 (Post-MVP)
- PayPal
- Analytics createur detaillees
- Automatisation conformite V2
- Multi-organisation pour agences

### Phase 3 (Expansion)
- Discord et WhatsApp
- Facturation annuelle
- API publique
- Automations avancees (promotions, coupons)

### Vision (Future)
- Page builder avec blocs et templates definis
- Systeme affiliation
- Multi channel par createur
- AI insights pour optimisation revenus

### Risk Mitigation Strategy
- **Technical Risks:** fiabilite webhooks et grant/revoke -> idempotence stricte, retries, logs, replay manuel, tests E2E
- **Market Risks:** confiance et retention createurs -> setup < 10 minutes, messages EU-first, support early adopters reactif
- **Resource Risks:** charge trop elevee -> scope MVP strict, automatisations ciblees, pas de features hors coeur
- **MVP Priority Note:** fiabilite webhooks + grant/revoke access est priorite absolue; toute feature qui met ce point en risque doit etre reportee

## User Journeys

### Journey 1 - Alex, createur EU (happy path)
- Opening: Alex anime une communaute Telegram de 2k a 10k membres en France. Il veut monetiser sans commission et rester conforme UE.
- Action: Il arrive sur une page publique EU-first, choisit le plan 19 EUR early adopters, cree son compte, renseigne TVA, connecte Stripe et le bot Telegram, verifie permissions, cree une offre abonnement, puis publie le lien.
- Climax: Un membre paye via Stripe ou Telegram Stars. Le webhook confirme, acces accorde en moins de 2 s, invitation envoyee. Alex recoit une notification.
- Resolution: Alex voit ses revenus et abonnes sur un dashboard simple, recoit sa facture TVA, et garde confiance.
- Risks & recovery: bot pas admin -> guide pas a pas; webhook rate -> retry et alerte; invite expire -> regeneration automatique.

### Journey 2 - Sophie, acheteuse (happy path)
- Opening: Sophie suit deja Alex et veut acceder aux contenus premium.
- Action: Elle clique le lien dans le canal public, voit une page simple, choisit paiement Stripe ou Stars, valide 3DS, recoit confirmation et lien prive.
- Climax: Elle rejoint le canal prive et voit le message de bienvenue.
- Resolution: Elle conserve la preuve de paiement et peut retrouver son acces depuis le portail client.
- Risks & recovery: paiement refuse -> message clair et bouton reessayer; lien invalide -> regeneration automatique.

### Journey 3 - Renouvellement rate et revoke access (edge case)
- Opening: Le renouvellement mensuel de Sophie echoue.
- Action: Le webhook marque le paiement en echec, le systeme maintient l acces pendant la grace period, puis retire l acces si non regle. Notification claire avec lien de retry.
- Climax: Sophie reessaie le paiement avec succes, acces restaure automatiquement.
- Resolution: Alex evite les acces fantomes, Sophie comprend la cause et reste abonnee.

### Journey 4 - Admin ops (fondateur)
- Opening: Le fondateur supervise paiements et conformite au quotidien.
- Action: Il suit le taux de reussite des webhooks, les acces accordes et les exceptions, et verifie la TVA collectee. Il traite une demande RGPD (export ou suppression) dans un delai cible.
- Climax: Un incident de webhook apparait, il relance le traitement et observe le retablissement en temps reel.
- Resolution: La plateforme reste fiable et conforme sans operations manuelles lourdes.

### Journey 5 - Support MVP (incident acces)
- Opening: Un ticket arrive: paiement effectue mais acces non debloque.
- Action: Le support cherche par email ou Telegram ID, consulte la timeline des evenements, rejoue le webhook ou force un grant/revoke.
- Climax: L acces est debloque et le client confirme.
- Resolution: Le ticket est resolu rapidement avec un historique clair.

### Journey Requirements Summary
- Pages publiques simples par offre, CTA clairs et EU-first
- Onboarding createur avec choix de plan, infos TVA, et creation offre
- Connexion bot Telegram avec verification permissions
- Paiements Stripe et Telegram Stars (PayPal en phase 2), webhooks idempotents et retry
- Grant/revoke access automatiques, notifications client et createur
- Dashboard createur: revenus mensuels, revenus par offre, abonnes actifs, en grace period, en retard
- Back office ops: monitoring webhooks, jobs, incidents, replay
- Support tooling: recherche par utilisateur, timeline, actions manuelles
- Conformite: RGPD export suppression, data residency UE, facturation TVA

## Domain-Specific Requirements

### Compliance & Regulatory
- PCI DSS scope minimal (SAQ A) via Stripe Checkout/Elements + 3DS; aucune donnee carte stockee par la plateforme
- Telegram Stars: suivre le modele Telegram, pas de donnees carte cote plateforme
- Facturation TVA pour abonnement SaaS: emission facture, gestion TVA UE, gestion n TVA intracom si fourni
- Evidence TVA: stocker preuves minimales de localisation selon exigences UE, sans sur-collecter
- OSS/IOSS: limite a notre abonnement SaaS (non MoR pour les ventes createur au MVP)
- RGPD: DPA, privacy policy, registre de traitement, retention definie, droits acces/effacement/export < 30 jours (cible 7 jours)

### Compliance Matrix (Fintech)

| Requirement | Responsibility | Evidence | Scope |
| --- | --- | --- | --- |
| Traitement carte et 3DS | PSP (Stripe) | Attestation PSP, logs PSP | MVP |
| PCI DSS scope SAQ A | Plateforme (perimetre SAQ A) | SAQ A, politique securite | MVP |
| Paiement Telegram Stars | PSP (Telegram) | Logs Stars, recu PSP | MVP |
| TVA abonnement SaaS | Plateforme | Factures TVA, export OSS | MVP |
| TVA ventes createur | Createur (vendeur) | Preuves localisation PSP, export events | MVP |
| RGPD DSAR (export/suppression) | Plateforme + createur | Log DSAR horodate | MVP |
| Data residency UE | Plateforme | Region hebergement et backups | MVP |
| Audit logs (paiement/acces/RGPD) | Plateforme | Journal audit exportable | MVP |
| Fraud et chargebacks | PSP + plateforme | Radar/chargeback logs, playbook | MVP |
| Audit securite externe | Plateforme | Rapport audit/pentest | Phase 2 |

**Audit Scope**
- MVP: audit log minimal (paiement, acces, RGPD) et export sur demande
- Phase 2: audit securite externe et exigences formelles etendues

**Out of Scope MVP**
- Merchant of record pour ventes createur
- KYC/AML createurs ou acheteurs
- Custody ou settlement des fonds acheteurs

### Technical Constraints
- Data residency UE stricte (hebergement + backups) avec region preferee FR/DE
- Chiffrement en transit (TLS) et au repos (DB + backups)
- Secrets stockes dans un coffre securise avec controle acces et audit; PII minimale (email + Telegram ID)
- Anonymisation ou pseudonymisation selon les cas
- Journalisation pour audit paiements et acces (correlation id, idempotence)

### Integration Requirements
- Stripe (Checkout/Elements) + Telegram Stars en MVP
- PayPal en phase 2 uniquement
- Export donnees fiscales pour createurs (non MoR)

### Risk Mitigations
- Fraude/chargebacks: Stripe Radar + regles simples + logs evenements + playbook contestation
- Acces non autorise: bot verifie identite, liens d invite limites dans le temps, pas de liens perma
- Double grant: idempotence webhooks, state machine acces
- Echecs webhooks: retry sur 24 h, conservation des evenements en echec, replay manuel
- Renouvellement rate: grace period 3 a 7 jours avec acces maintenu, revoke automatique a l issue
- Signalement abuse: mecanisme de blocage createur/offre + escalade support

## Innovation & Novel Patterns

### Detected Innovation Areas
- Automatisation conformite EU RGPD pour createurs, integree aux flux produit
- Guardrails conformite dans paiement, acces, revoke, retention, sans friction
- Insights simples de conformite bases sur checks, pas sur IA

### Market Context & Competitive Landscape
- Concurrents focalises sur monetisation et souvent US centric, peu de guidance RGPD
- Regulations EU se durcissent, createurs veulent solutions pretes a utilisation
- Positionnement EU-first + compliance automation = differenciation actionnable

### Validation Approach
- MVP: workflows guides export et suppression, retention par defaut, privacy notice, evidence pack minimal (DSAR log, invoices, data location)
- Pilote 10 a 20 createurs EU, mesurer: taux activation workflow, temps moyen traitement DSAR, reduction tickets conformite, perception confiance
- Critere go/no go: >50 pour cent activation, DSAR < 7 jours, baisse tickets conformite >30 pour cent

### Risk Mitigation
- Risque: workflows percus comme friction -> integrer dans onboarding, auto config par defaut, terminologie simple
- Risque: sentiment de conseil legal -> disclaimers clairs, responsabilites indiquees, pas de promesse de conseil
- Risque: donnees insufisantes pour preuves TVA -> conserver preuves minimales du PSP, pas de sur collecte
- Risque: erreurs dans export ou suppression -> audit log, tests de bout en bout, replay securise
- Risque: adoption faible -> rendre optionnel au debut, garder version light

## SaaS B2B Specific Requirements

### Project-Type Overview
- SaaS multi tenant par createur (organisation legere)
- Cible: createurs EU, focus Telegram MVP, EU-first compliance
- Page publique + dashboard createur + back office support

### Technical Architecture Considerations
- Isolation des donnees par organisation createur
- RBAC minimal (owner, admin, support interne) avec least privilege
- Journaux d audit minimaux pour actions sensibles
- Traitement idempotent des evenements paiement et acces; jobs critiques executes hors requete utilisateur pour garantir > 99% de reussite

### Tenant Model
- 1 createur = 1 organisation par defaut
- Plusieurs communautes/offres par organisation
- Multi organisation par createur hors MVP (phase 2)

### RBAC Matrix
- Owner: paiements, TVA, RGPD, offres, acces
- Admin: offres, acces, contenu; pas d acces financier
- Support interne: lecture + actions assistees (grant, revoke, replay), pas d acces paiements sensibles

### Subscription Tiers
- MVP: 19 EUR early adopters, 29 EUR prix public
- Mensuel uniquement
- Trial court 7 jours (decision CB requise ou non apres analyse risque fraude)

### Integration List
- Stripe Checkout + webhooks
- Telegram Bot API + Telegram Stars
- Brevo emails transactionnels
- Analytics basiques (events cles)
- TVA: gestion via Stripe + logique plateforme
- Exclusions MVP: PayPal, analytics avancees, Discord/WhatsApp

### Compliance Requirements
- RGPD/TVA + audit log minimal (paiements, acces, revoke, RGPD actions)
- Retention logs techniques definie
- Export donnees createur (config, abonnes, evenements)
- Least privilege pour acces internes
- Pas de KYC obligatoire au MVP

### Implementation Considerations
- Onboarding guide avec etapes de conformite et parametres par defaut; objectif setup < 10 minutes
- Trial: politique CB decidee selon risque fraude; monitoring abus via seuils simples
- Support peut rejouer un evenement paiement et declencher grant/revoke avec audit log

## Functional Requirements

### Comptes et permissions
- FR1 [MVP]: Createur peut creer un compte et une organisation
- FR2 [MVP]: Createur peut gerer identite et TVA de l organisation (raison sociale, adresse)
- FR3 [MVP]: Owner peut inviter et retirer un Admin
- FR4 [MVP]: Systeme applique les permissions par role (Owner, Admin, Support)
- FR5 [Phase 2]: Owner peut creer plusieurs organisations

### Onboarding et configuration
- FR6 [MVP]: Createur peut choisir un plan SaaS et activer un trial
- FR7 [MVP]: Createur peut connecter un compte Stripe pour paiements acheteurs
- FR8 [MVP]: Createur peut connecter un bot Telegram et verifier permissions admin
- FR9 [MVP]: Createur peut activer Telegram Stars comme moyen de paiement
- FR10 [MVP]: Systeme bloque la vente tant que la configuration requise est incomplete

### Offres et pages publiques
- FR11 [MVP]: Createur peut creer une offre abonnement ou produit digital simple (un seul asset par offre: fichier telechargeable ou lien externe)
- FR12 [MVP]: Createur peut definir prix et periodicite de facturation
- FR13 [MVP]: Createur peut lier un ou plusieurs canaux Telegram a une offre
- FR14 [MVP]: Systeme genere une page publique par offre
- FR15 [MVP]: Createur peut suspendre ou archiver une offre
- FR16 [Phase 3]: Createur peut creer promotions ou coupons
- FR17 [Vision]: Createur peut utiliser un page builder avec 3 a 6 blocs (titre, media, description, prix, FAQ, CTA) et 2 a 3 templates

### Paiements et facturation
- FR18 [MVP]: Acheteur peut payer via Stripe
- FR19 [MVP]: Acheteur peut payer via Telegram Stars
- FR20 [Phase 2]: Acheteur peut payer via PayPal
- FR21 [MVP]: Systeme capture identite acheteur (email, Telegram ID)
- FR22 [MVP]: Systeme confirme paiement et cree abonnement ou achat
- FR23 [MVP]: Systeme gere echec paiement et notifie acheteur et createur
- FR24 [MVP]: Systeme applique une grace period par defaut de 3 a 7 jours (configurable) avant retrait acces
- FR25 [MVP]: Systeme emet factures TVA pour abonnement SaaS du createur
- FR26 [MVP]: Createur peut consulter et gerer son abonnement SaaS
- FR27 [Phase 3]: Createur peut choisir facturation annuelle

### Acces et fulfilment
- FR28 [MVP]: Systeme maintient un etat source de verite unique pour l acces (active, pending, revoked) synchronise avec paiements
- FR29 [MVP]: Systeme accorde acces Telegram apres paiement confirme
- FR30 [MVP]: Systeme retire acces apres annulation ou echec apres grace period
- FR31 [MVP]: Systeme evite les acces en double pour un meme paiement
- FR32 [MVP]: Createur peut voir le statut acces par acheteur
- FR33 [MVP]: Acheteur recoit instructions ou lien acces apres achat

### Conformite EU et RGPD
- FR34 [MVP]: Systeme fournit workflows guides RGPD pour createurs
- FR35 [MVP]: Systeme indique que les workflows RGPD sont assistes et ne constituent pas un conseil legal
- FR36 [MVP]: Createur peut declencher export de donnees pour un acheteur
- FR37 [MVP]: Createur peut declencher suppression de donnees pour un acheteur
- FR38 [MVP]: Systeme journalise paiements, acces, actions RGPD
- FR39 [MVP]: Systeme fournit un evidence pack minimal: log DSAR horodate, factures SaaS, preuve residence data UE, journal evenements paiement et acces
- FR40 [Phase 2]: Systeme propose automatisation conformite V2 avec checks sur retention, DSAR SLA, consentement, et guidance basee checklist

### Analytique et reporting
- FR41 [MVP]: Createur peut voir dashboard avec revenus mensuels, revenus par offre, abonnes actifs, en grace period, en retard
- FR42 [MVP]: Createur peut exporter liste abonnes et evenements basiques (paiement reussi/echoue, grant/revoke, changement statut abonnement)
- FR43 [Phase 2]: Createur peut acceder a analytics detaillees (conversion par offre, churn, retention cohorte, ARPA, revenus par canal)

### Support et ops
- FR44 [MVP]: Support peut rechercher un acheteur par email ou Telegram ID
- FR45 [MVP]: Support peut voir timeline paiements et acces
- FR46 [MVP]: Support peut reprocesser un evenement paiement et declencher octroi ou retrait
- FR47 [MVP]: Support peut bloquer une offre ou un createur en cas d abus
- FR48 [MVP]: Toute action manuelle Support (grant, revoke, replay) est journalisee avec horodatage et acteur

### Expansion et vision
- FR49 [Phase 3]: Createur peut gerer Discord et WhatsApp en plus de Telegram
- FR50 [Phase 3]: Createur peut utiliser une API publique pour integrer des outils
- FR51 [Vision]: Createur peut activer un systeme affiliation pour acquisition
- FR52 [Vision]: Createur peut recevoir insights IA avec 3 a 5 recommandations basees sur tendances revenus et churn, sans action automatique

## Non-Functional Requirements

### Performance
- Page publique offre: P95 < 2 s (objectif < 1.5 s)
- Dashboard createur: P95 < 2 s
- Checkout initial (hors PSP): < 2 s
- Paiement confirme -> acces: < 2 s (objectif < 1 s)

### Reliability
- Uptime plateforme: 99.5% MVP, 99.9% apres stabilisation
- Webhooks paiements: succes > 99%
- Traitements critiques (grant/revoke): succes > 99%
- RTO < 1 h, RPO < 15 min
- Monitoring interne: alertes si taux echec webhooks > 1% sur 15 min ou si latence paiement -> acces P95 > 2 s
- Release gate: aucune release ne doit degrader succes paiement -> acces sous 99% ou latence P95 au dessus de 2 s en charge nominale

### Security
- Chiffrement en transit (TLS) et au repos (DB + backups)
- Secrets stockes dans un coffre securise avec controle acces et audit
- Rotation des cles sensibles possible (Stripe, Telegram)
- Audit logs pour actions sensibles (paiement, acces, RGPD, support)
- MFA requis pour comptes admin/support
- Least privilege: acces internes limites aux roles definis, revue des droits tous les 90 jours
- Pentest externe en phase 2

### Scalability
- Lancement: 100 createurs, 1k a 5k acheteurs, 5k a 10k paiements/mois
- 12 mois: 1k createurs, 50k acheteurs, 50k a 100k paiements/mois
- Systeme supporte un pic de 10x le debit horaire moyen avec backlog traite en < 15 min

### Integration
- Traitement webhook: < 5 s
- Retry automatique: >= 24 h avec delais croissants, max 10 tentatives
- Idempotence obligatoire pour tous les webhooks
- Evenements webhook en echec conserves 30 jours et replay manuel possible
- Logs correles: chaque erreur PSP inclut correlation id et id PSP, taux de correlation 100%

### Accessibility
- MVP: contraste texte >= 4.5:1, navigation clavier pages publiques et dashboard principal, focus visible
- Phase 2: audit WCAG 2.1 AA sur pages publiques et dashboard, correction des blockers
