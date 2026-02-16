# Sprint: Contenus Marketing Sublynk

> **Date de création:** 2026-02-16
> **Créé par:** John (PM) suite à l'analyse concurrentielle de Mary (BA)
> **Objectif:** Améliorer la conversion du site en ajoutant preuve sociale et différenciation
> **Estimation totale:** ~7-9h de développement frontend

---

## Contexte

Suite à l'analyse concurrentielle de Sublynk vs Sublaunch, LaunchPass et Crevio, plusieurs lacunes ont été identifiées sur le site actuel :

1. **Manque de preuve sociale** — Aucun témoignage client
2. **Différenciation floue** — Les avantages uniques (Telegram Stars, affiliés gratuits) ne sont pas mis en avant
3. **Pas de comparaison concurrents** — Le visiteur doit chercher ailleurs pour comparer

Ces stories adressent ces points avec du contenu prêt à implémenter.

---

## Stories

---

### MKTG-001: Section "Pourquoi Sublynk"

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🔴 Haute |
| **Page** | `/` (Homepage) |
| **Position** | Après le hero, avant les features existantes |
| **Estimation** | 2-3h |

#### User Story

> En tant que visiteur, je veux comprendre rapidement pourquoi choisir Sublynk plutôt qu'un concurrent, afin de prendre une décision éclairée.

#### Critères d'acceptation

- [ ] Section avec titre "Pourquoi choisir Sublynk ?"
- [ ] 5 blocs avec icône + titre + description
- [ ] Design cohérent avec le reste du site (même spacing, couleurs)
- [ ] Responsive mobile (1 colonne) / desktop (2-3 colonnes)
- [ ] Animations hover subtiles (optionnel)

#### Contenu

**Titre de section:** Pourquoi choisir Sublynk ?

**Bloc 1:**
- Icône: `Star` (lucide-react) ou emoji 🌟
- Titre: Paiements Telegram Stars
- Texte: La seule plateforme qui accepte les paiements natifs Telegram. Vos abonnés paient directement dans l'app — zéro friction.

**Bloc 2:**
- Icône: `Users` (lucide-react) ou emoji 🤝
- Titre: Affiliés inclus dès le départ
- Texte: Transformez vos membres en ambassadeurs. Système de parrainage complet avec suivi des commissions, même sur le plan gratuit.

**Bloc 3:**
- Icône: `Globe` (lucide-react) ou emoji 🌍
- Titre: Multi-plateforme, un seul dashboard
- Texte: Telegram, Discord, WhatsApp — gérez tous vos accès payants depuis une interface unique et intuitive.

**Bloc 4:**
- Icône: `MessageCircle` (lucide-react) ou emoji 🇫🇷
- Titre: Support en français
- Texte: Une équipe réactive qui parle votre langue. Pas de chatbot, de vraies réponses.

**Bloc 5:**
- Icône: `Percent` (lucide-react) ou emoji 💰
- Titre: Les frais les plus bas du marché
- Texte: De 1.5% à 6% selon votre plan. Vous gardez plus, nous prenons moins.

#### Notes techniques

- Utiliser les composants shadcn/ui existants (Card ou custom)
- Icônes de lucide-react déjà dans le projet
- Suivre le design system Tailwind existant

---

### MKTG-002: Tableau Comparatif Concurrents

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🔴 Haute |
| **Page** | `/pricing` |
| **Position** | Sous les plans tarifaires |
| **Estimation** | 1-2h |

#### User Story

> En tant que visiteur comparant les solutions, je veux voir un tableau comparatif avec les concurrents, afin de valider que Sublynk est le meilleur choix.

#### Critères d'acceptation

- [ ] Tableau responsive (scroll horizontal sur mobile si nécessaire)
- [ ] Colonne Sublynk mise en évidence (background légèrement différent ou bordure accent)
- [ ] Icônes ✅ / ❌ / 🔜 pour les features booléennes
- [ ] Titre de section au-dessus du tableau
- [ ] Header sticky sur scroll vertical (optionnel)

#### Contenu

**Titre de section:** Sublynk vs la concurrence

| Fonctionnalité | Sublynk | Sublaunch | LaunchPass | Crevio |
|----------------|:-------:|:---------:|:----------:|:------:|
| Telegram Stars | ✅ | ❌ | ❌ | ❌ |
| WhatsApp | ✅ | ✅ | ❌ | ❌ |
| Discord | ✅ | ✅ | ✅ | ✅ |
| Affiliés inclus | ✅ Gratuit | ✅ Payant | ❌ | 🔜 |
| Coupons | ✅ Gratuit | — | — | ✅ |
| Support français | ✅ | ❌ | ❌ | ❌ |
| Frais minimum | **1.5%** | 3% | — | 1% |
| Plan gratuit (frais) | 6% | 15% | — | 5% |

#### Notes techniques

- Composant Table de shadcn/ui ou custom
- Prévoir i18n pour EN (traduire les headers)
- "—" pour données non disponibles/non vérifiées

---

### MKTG-003: Section Témoignages

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🔴 Haute |
| **Page** | `/` (Homepage) |
| **Position** | Avant le CTA final / footer |
| **Estimation** | 2h |

#### User Story

> En tant que visiteur hésitant, je veux lire des témoignages d'utilisateurs existants, afin d'être rassuré sur la fiabilité de la plateforme.

#### Critères d'acceptation

- [ ] 3 cards témoignages minimum
- [ ] Chaque card contient : étoiles (5/5), citation, nom, activité
- [ ] Design card avec ombre légère, coins arrondis
- [ ] Responsive : 1 colonne mobile, 3 colonnes desktop
- [ ] Titre de section

#### Contenu

**Titre de section:** Ils ont choisi Sublynk

**Témoignage 1:**
```
Étoiles: ⭐⭐⭐⭐⭐ (5/5)
Citation: "Telegram Stars = game changer. Mes abonnés russes peuvent enfin payer sans Stripe. Conversion x2."
Nom: Alex K.
Activité: Signaux Crypto
```

**Témoignage 2:**
```
Étoiles: ⭐⭐⭐⭐⭐ (5/5)
Citation: "Support réactif et en français. Réponse en 1h, config webhooks réglée en une après-midi."
Nom: Marine D.
Activité: Coach Fitness
```

**Témoignage 3:**
```
Étoiles: ⭐⭐⭐⭐⭐ (5/5)
Citation: "Affiliés gratuits = 40 nouveaux membres. Premier mois, zéro pub, juste le bouche-à-oreille récompensé."
Nom: Thomas R.
Activité: Communauté Gaming
```

#### Notes techniques

- Créer composant `TestimonialCard` réutilisable
- Prévoir structure pour ajouter facilement d'autres témoignages plus tard
- Avatar optionnel (placeholder ou initiales)

---

### MKTG-004: Bandeau Exclusivité Telegram Stars

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🟡 Moyenne |
| **Page** | `/` (Homepage) |
| **Position** | Sous le hero OU en sticky banner top |
| **Estimation** | 30min |

#### User Story

> En tant que visiteur, je veux voir immédiatement la feature unique de Sublynk, afin de comprendre sa différenciation.

#### Critères d'acceptation

- [ ] Bandeau pleine largeur
- [ ] Background distinctif (gradient purple ou couleur accent)
- [ ] Icône étoile + texte + lien optionnel
- [ ] Responsive (texte sur 2 lignes mobile si nécessaire)

#### Contenu

```
🌟 Exclusivité Sublynk — Acceptez les paiements Telegram Stars
La seule plateforme qui intègre le système de paiement natif de Telegram.
[En savoir plus →]
```

**Lien "En savoir plus":** Ancre vers section "Pourquoi Sublynk" ou page dédiée si existante

#### Notes techniques

- Peut réutiliser le pattern de banner/alert existant
- Animation subtle au hover sur le lien

---

### MKTG-005: FAQ - Nouvelles Questions

| Champ | Valeur |
|-------|--------|
| **Priorité** | 🟡 Moyenne |
| **Page** | `/faq` |
| **Position** | Intégrer dans la FAQ existante |
| **Estimation** | 1h |

#### User Story

> En tant que visiteur avec des questions, je veux trouver des réponses sur les features uniques et la comparaison concurrentielle, afin de lever mes derniers doutes.

#### Critères d'acceptation

- [ ] 4 nouvelles entrées FAQ
- [ ] Même style que les FAQ existantes (accordion)
- [ ] Ancres possibles pour liens directs (`#telegram-stars`, etc.)

#### Contenu

**Question 1:**
```
Q: Qu'est-ce que Telegram Stars ?
R: Telegram Stars est le système de paiement intégré à Telegram. Vos abonnés peuvent payer directement dans l'application sans carte bancaire. Sublynk est la seule plateforme à le supporter.
```

**Question 2:**
```
Q: Puis-je utiliser Sublynk si j'ai déjà des abonnés ailleurs ?
R: Oui ! Vous pouvez importer vos clients existants et leur donner accès manuellement, puis gérer les nouveaux via Sublynk.
```

**Question 3:**
```
Q: Les affiliés sont vraiment gratuits ?
R: Oui, le système d'affiliation complet (liens de parrainage, suivi des commissions, paiements) est inclus dans tous les plans, y compris le plan Starter gratuit.
```

**Question 4:**
```
Q: Quelle est la différence avec Sublaunch ou LaunchPass ?
R: Sublynk offre le support Telegram Stars (exclusif), des frais plus bas (1.5% vs 3% minimum), et un support en français. Consultez notre tableau comparatif sur la page Pricing.
```

#### Notes techniques

- Ajouter au fichier/composant FAQ existant
- Prévoir traduction EN

---

## Récapitulatif

| ID | Story | Priorité | Estimation | Dépendances |
|----|-------|----------|------------|-------------|
| MKTG-001 | Section "Pourquoi Sublynk" | 🔴 Haute | 2-3h | Aucune |
| MKTG-002 | Tableau comparatif | 🔴 Haute | 1-2h | Aucune |
| MKTG-003 | Témoignages | 🔴 Haute | 2h | Aucune |
| MKTG-004 | Bandeau Telegram Stars | 🟡 Moyenne | 30min | MKTG-001 (pour ancre) |
| MKTG-005 | FAQ additions | 🟡 Moyenne | 1h | MKTG-002 (pour lien) |

---

## Definition of Done

- [ ] Code mergé sur `dev`
- [ ] Testé sur mobile et desktop
- [ ] Traductions FR/EN ajoutées
- [ ] Review design validée
- [ ] Déployé sur sublynk-dev.netlify.app

---

## Ressources

- **Analyse concurrentielle source:** Conversation avec Mary (BA) — 2026-02-16
- **Concurrents analysés:**
  - https://sublaunch.com/
  - https://www.launchpass.com/
  - https://crevio.co/
- **Site dev:** https://sublynk-dev.netlify.app/
