# Session UX/UI — 24 janvier 2025

## Objectif
Refonte du design SaaS : page d'accueil marketing + navbar

---

## Décisions validées

### Structure de la page (8 sections)
1. **Navbar** — sticky, responsive, CTA toujours visible
2. **Hero** — headline + 2 CTA
3. **Social Proof** — stats ou logos clients
4. **How it Works** — 4 étapes (Create → Connect → Sell → Access)
5. **Features** — grid 2×2 (Subscriptions, One-time, Auto-access, Multi-platform)
6. **Differentiators** — 3 colonnes (0% commission, Direct payments, EU & GDPR)
7. **Pricing Teaser** — card unique + CTA vers pricing
8. **Final CTA** — fond accent, dernier push conversion
9. **Footer** — navigation + légal

### Copy Hero (validé)
```
Monetize your community.
Keep 100% of your revenue.

Sell subscriptions and one-time access to your
Telegram, Discord, and WhatsApp communities.
EU-based. GDPR-compliant. Zero commission.

[Start monetizing →]  [View pricing]
```

### Direction artistique (validée)
- **Palette** : Prune Élégant (B1)
  - Accent : `#9333EA` (purple-600)
  - Hover : `#7E22CE` (purple-700)
  - Text primary : `#1A1523`
  - Text secondary : `#6F6E77`
  - Surface : `#FDFAFF`
  - Border : `#E9E3EF`
- **Typographie** : Inter
- **Style** : SaaS moderne, sobre, premium (inspiré Stripe/Linear/Vercel)

---

## Livrables produits

| Fichier | Description |
|---------|-------------|
| `homepage-wireframe.excalidraw` | Wireframe desktop (800px) + mobile (375px) |
| `design-tokens.md` | Design system complet (palette, typo, composants) |
| `SESSION.md` | Ce fichier |

---

## Copy complet par section

### Navbar
- Logo : [Nom du produit]
- Liens : Pricing, Login
- CTA : Start free →

### Hero
- H1 : Monetize your community. Keep 100% of your revenue.
- Sub : Sell subscriptions and one-time access to your Telegram, Discord, and WhatsApp communities. EU-based. GDPR-compliant. Zero commission.
- CTA1 : Start monetizing →
- CTA2 : View pricing

### Social Proof
- Option stats : €250K+ processed for European creators
- Option logos : Trusted by 500+ creators across Europe

### How it Works
- Titre : How it works
- Étape 1 : Create — Set your pricing and access rules
- Étape 2 : Connect — Link your Telegram, Discord, or WhatsApp
- Étape 3 : Sell — Share your payment link anywhere
- Étape 4 : Access — Members get instant access automatically

### Features
- Titre : Everything you need to monetize
- Feature 1 : ↻ Subscriptions — Recurring revenue with automatic renewal and billing
- Feature 2 : ⚡ One-time payments — Sell lifetime access or single purchases
- Feature 3 : 🔓 Auto-access — Members get instant access after payment
- Feature 4 : 📱 Multi-platform — Telegram, Discord, WhatsApp. One dashboard.

### Differentiators
- Titre : Why creators choose us
- Point 1 : 0% commission — You keep every euro. Just a flat monthly fee.
- Point 2 : Direct payments — Money goes straight to your Stripe account.
- Point 3 : EU & GDPR — Based in Europe. Fully GDPR-compliant.

### Pricing Teaser
- Titre : Simple, transparent pricing
- Prix : €XX/month
- Features : ✓ 0% commission ✓ Unlimited products ✓ All platforms
- CTA : View full pricing →
- Note : 14-day free trial. No credit card required.

### Final CTA
- Titre : Ready to monetize your community?
- CTA : Start free today →
- Note : No credit card required

### Footer
- Colonnes : Product (Pricing, Features) | Company (About, Contact) | Legal (Privacy, Terms, GDPR)
- Bas : © 2025 [Nom]. Made in Europe 🇪🇺

---

## Prochaines étapes

1. [x] Wireframe Excalidraw
2. [x] Copy complet
3. [x] Direction artistique
4. [x] Config Tailwind (tokens prune)
5. [x] Implémentation Navbar (sticky + responsive)
6. [x] Implémentation Hero
7. [x] Social Proof
8. [x] How it Works
9. [x] Features
10. [x] Differentiators
11. [x] Pricing Teaser
12. [x] Final CTA
13. [x] Footer

---

## Notes techniques

- Stack : Next.js 15 + Tailwind CSS + Radix UI
- Font : Inter via `next/font/google`
- Breakpoint mobile : 768px
- Container : max-w-6xl

---

---

## Fichiers implémentés (24 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/globals.css` | Tokens prune + shadcn compatible |
| `src/components/marketing/navbar.tsx` | Navbar sticky responsive |
| `src/components/marketing/hero.tsx` | Hero avec copy validé |
| `src/components/marketing/index.ts` | Exports |
| `src/app/page.tsx` | Homepage avec Navbar + Hero |

---

## Fichiers implémentés (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/components/marketing/social-proof.tsx` | Stats (€250K+, 500+ creators, 0% commission) |
| `src/components/marketing/how-it-works.tsx` | 4 étapes (Create → Connect → Sell → Access) |
| `src/components/marketing/features.tsx` | Grid 2×2 (Subscriptions, One-time, Auto-access, Multi-platform) |
| `src/components/marketing/differentiators.tsx` | 3 colonnes (0% commission, Direct payments, EU & GDPR) |
| `src/components/marketing/pricing-teaser.tsx` | Card €39/mois + features + CTA |
| `src/components/marketing/final-cta.tsx` | Fond purple + CTA "Start free today" |
| `src/components/marketing/footer.tsx` | Navigation + légal + "Made in Europe 🇪🇺" |
| `src/components/marketing/index.ts` | Exports mis à jour |
| `src/app/page.tsx` | Homepage complète avec toutes les sections |

---

*Landing page complète — Build OK*

---

## Page Pricing (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/pricing/page.tsx` | Page pricing complète |

### Sections implémentées
- **Hero** — Titre + sous-titre
- **Pricing Card** — Plan Pro €39/mois, badge "Most popular", 10 features
- **Comparison** — Stats 0%, €39, EU + exemple calcul économies
- **FAQ** — 6 questions/réponses (commission, trial, cancel, Stripe, platforms, GDPR)
- **Final CTA** — Fond purple + "Start your free trial"

*Page pricing complète — Build OK*

---

## Pages Auth (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/login/page.tsx` | Page login refaite avec design Prune |
| `src/app/register/page.tsx` | Page register créée |

### Login
- Header avec logo linkant vers /
- Card centrée avec titre "Welcome back"
- Champs email + password
- Lien "Forgot password?"
- Lien vers /register
- Footer légal (Terms, Privacy)

### Register
- Même structure que login
- Champs: firstName, lastName, email, password
- Badge "14-day free trial • No credit card required"
- Lien vers /login

*Pages auth complètes — Build OK*

---

## Dashboard UI Refonte (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/dashboard/layout.tsx` | Layout avec bg Prune (#FDFAFF) |
| `src/components/dashboard/sidebar.tsx` | Sidebar refait + trial badge |
| `src/components/dashboard/header.tsx` | Header + menu mobile responsive |
| `src/app/dashboard/page.tsx` | Homepage avec KPIs + Quick Actions + Checklist |

### Layout
- Fond `#FDFAFF` (surface Prune)
- Sidebar caché sur mobile (lg:flex)
- Header avec menu hamburger mobile

### Sidebar
- Logo linkant vers /
- 8 items navigation (anglais)
- Item actif = purple-600
- Footer avec trial badge + "Upgrade now"

### Header
- Mobile: hamburger + logo + avatar
- Desktop: avatar seul
- Dropdown: nom, email, Admin panel (superadmin), Profile, Log out

### Dashboard Homepage
- 4 KPIs cards (Revenue, Subscriptions, Customers, Conversion)
- Quick Actions (Create Product, Connect Channel, Setup Billing)
- Getting Started checklist (5 items avec états completed/pending)

*Dashboard refonte complète — Build OK*

---

## Pages Légales (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/components/marketing/legal-layout.tsx` | Layout partagé pour pages légales |
| `src/app/privacy/page.tsx` | Privacy Policy |
| `src/app/terms/page.tsx` | Terms of Service |
| `src/app/gdpr/page.tsx` | GDPR Compliance |

### Contenu
- **Privacy:** 9 sections (Introduction, Data Collection, Usage, Sharing, Retention, Rights, Security, Changes, Contact)
- **Terms:** 13 sections (Acceptance, Service, Registration, Fees, Acceptable Use, Responsibilities, IP, Liability, Availability, Termination, Changes, Law, Contact)
- **GDPR:** Droits détaillés, tableau de rétention, sub-processors, boutons Quick Actions

*Pages légales complètes — Build OK*

---

## Page Forgot Password (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/forgot-password/page.tsx` | Forgot Password avec 2 états |

### Fonctionnalités
- **État 1:** Formulaire email + bouton "Send reset link"
- **État 2:** Confirmation "Check your email" + lien "try again"
- Lien "Back to login" en haut
- Icônes Mail et Check
- TODO: connecter à l'API /auth/forgot-password

*Page Forgot Password complète — Build OK*

---

## Dashboard Pages Refonte (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/dashboard/products/page.tsx` | Liste produits refaite |
| `src/app/dashboard/billing/page.tsx` | Page Stripe Connect refaite |
| `src/app/dashboard/customers/page.tsx` | Liste clients + recherche |
| `src/app/dashboard/channels/page.tsx` | Liste channels refaite |

### Products
- Table avec colonnes Product, Status, Created, Actions
- Empty state avec icône + CTA
- Badges status (Draft/Active/Archived)
- Dropdown menu (Edit, Duplicate, Archive)

### Billing
- Card Stripe Connect avec status checklist
- Warning "Subscription required" si inactif
- Info box "How payments work"
- Boutons Connect/Update/Open Dashboard

### Customers
- Table avec avatar, nom, email, Telegram tag
- Search bar (nom, email, Telegram)
- Compteur "X customers total"

### Channels
- Cards par channel avec provider badges
- Stats row (Provider, External ID, Created)
- Support multi-provider (Telegram, Discord, WhatsApp)

*4 pages dashboard refondues — Build OK*

---

## Pages About & Contact (25 jan)

| Fichier | Description |
|---------|-------------|
| `src/app/about/page.tsx` | Page About |
| `src/app/contact/page.tsx` | Page Contact avec formulaire |

### About
- Hero avec titre + story
- Stats grid (500+ Creators, €250K+, 0%, EU)
- Values section (Privacy First, Creator-Focused, Simple & Transparent)
- CTA final

### Contact
- Formulaire (name, email, subject, message)
- État confirmation après envoi
- Contact options cards (Email Support, Sales, Response Time)
- Lien vers FAQ

*Pages About & Contact complètes — Build OK*
