# Charte éditoriale — TelegramPlugin

**Version** : 1.0
**Date** : 2026-01-29

---

## 1. Positionnement & ton

### Qui sont nos utilisateurs ?

**Créateurs** : Influenceurs, formateurs, coachs, créateurs de contenu. Non-techniques, souvent sur mobile, veulent aller vite.

**Followers** : Fans qui veulent accéder au contenu premium. Paiement = moment de confiance.

### Ton de voix

| Caractéristique | Ce qu'on fait | Ce qu'on évite |
|-----------------|---------------|----------------|
| **Simple** | Phrases courtes, vocabulaire courant | Jargon technique, acronymes |
| **Humain** | Tutoiement (créateur), vouvoiement (follower) | Ton corporate, froideur |
| **Rassurant** | Confirmer les actions, expliquer les étapes | Laisser dans le doute |
| **Direct** | Aller à l'essentiel | Tourner autour du pot |

### Exemples

| Éviter | Préférer |
|--------|----------|
| "Votre webhook Stripe a été configuré" | "Ton compte de paiement est prêt" |
| "Action requise sur votre compte" | "Une dernière étape pour recevoir tes paiements" |
| "Subscription PAST_DUE" | "Paiement en retard" |
| "Error 500" | "Un problème est survenu. Réessaie dans quelques instants." |

---

## 2. Conventions linguistiques

### Français (FR)

- **Tutoiement** pour l'interface créateur (dashboard)
- **Vouvoiement** pour l'interface follower (checkout, landing)
- Accents obligatoires : "À", "É", "Ê"
- Pas de point final sur les titres et boutons
- Majuscule uniquement au premier mot (sauf noms propres)

### Anglais (EN)

- Style **international**, pas américain agressif
- Phrases simples, vocabulaire accessible
- Pas de contractions excessives ("you're" OK, "you'll wanna" NON)
- Title Case pour les titres de pages uniquement

---

## 3. Glossaire unifié

### Termes métier

| Terme technique | FR (créateur) | FR (follower) | EN |
|-----------------|---------------|---------------|-----|
| Subscription | Abonnement | Abonnement | Subscription |
| Plan | Formule / Offre | Formule | Plan |
| Product | Offre | — | Product |
| Customer | Client | — | Customer |
| Channel | Canal | Canal privé | Channel |
| Entitlement | Accès | Accès | Access |
| Checkout | Paiement | Paiement | Checkout |
| Billing | Facturation | — | Billing |

### Statuts d'abonnement

| Code | FR | EN |
|------|-----|-----|
| ACTIVE | Actif | Active |
| PAST_DUE | Paiement en retard | Payment overdue |
| CANCELED | Annulé | Canceled |
| INCOMPLETE | En attente | Pending |
| TRIALING | Période d'essai | Trial |
| EXPIRED | Expiré | Expired |

### Intervalles de paiement

| Code | FR | EN |
|------|-----|-----|
| ONE_TIME | Paiement unique | One-time payment |
| DAY | par jour | per day |
| WEEK | par semaine | per week |
| MONTH | par mois | per month |
| QUARTER | par trimestre | per quarter |
| YEAR | par an | per year |

### États Stripe

| État | FR | EN |
|------|-----|-----|
| Non connecté | Compte de paiement non connecté | Payment account not connected |
| Connecté | Prêt à recevoir des paiements | Ready to receive payments |
| Action requise | Une étape reste à compléter | One step remaining |

---

## 4. Patterns de micro-copy

### Boutons d'action

| Type | FR | EN |
|------|-----|-----|
| Principal | Verbe à l'infinitif | Verb (imperative) |
| Exemple | "Créer une offre" | "Create offer" |
| Confirmation | "Confirmer" | "Confirm" |
| Annulation | "Annuler" | "Cancel" |
| Retour | "Retour" | "Back" |

### Messages de confirmation

```
FR: ✓ [Action] effectuée avec succès
EN: ✓ [Action] successful

Exemples:
- "Offre créée avec succès" / "Offer created successfully"
- "Modifications enregistrées" / "Changes saved"
```

### Messages d'erreur

```
FR: Un problème est survenu. [Solution ou action possible]
EN: Something went wrong. [Solution or action]

Exemples:
- "Un problème est survenu. Réessaie dans quelques instants."
- "Something went wrong. Please try again."
```

### États vides

```
Structure:
[Titre] — constat neutre
[Description] — explication + prochaine action
[CTA] — action claire

Exemple FR:
"Pas encore d'abonnés"
"Partage ton lien de vente pour recevoir tes premiers abonnés."
[Promouvoir mon offre]

Exemple EN:
"No subscribers yet"
"Share your sales link to get your first subscribers."
[Promote my offer]
```

---

## 5. Règles spécifiques par écran

### Onboarding (créateur)

- Ton encourageant, célébrer les petites victoires
- Checklist avec états clairs (fait / à faire)
- Pas de pression, pas d'urgence artificielle

### Checkout (follower)

- Vouvoiement
- Rassurer sur la sécurité du paiement
- Clarté sur ce qui est acheté
- Pas de friction inutile

### Billing (créateur)

- Expliquer simplement sans jargon Stripe
- Montrer clairement l'état du compte
- Actions claires pour compléter la configuration

---

## 6. Accessibilité

- Textes des boutons explicites (pas "Cliquez ici")
- Labels de formulaire clairs
- Messages d'erreur associés aux champs concernés
- Pas d'information véhiculée uniquement par la couleur

---

## 7. Mobile-first

- Phrases courtes (max 2 lignes sur mobile)
- Titres concis
- CTAs visibles sans scroll
- Textes d'aide sous les champs (pas de tooltips)
