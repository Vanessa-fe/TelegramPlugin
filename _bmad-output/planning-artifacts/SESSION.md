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
7. [ ] Social Proof
8. [ ] How it Works
9. [ ] Features
10. [ ] Differentiators
11. [ ] Pricing Teaser
12. [ ] Final CTA
13. [ ] Footer

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

*Session terminée — Reprendre avec Social Proof + sections suivantes*
