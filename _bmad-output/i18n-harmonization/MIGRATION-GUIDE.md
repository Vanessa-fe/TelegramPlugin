# Guide de migration i18n — TelegramPlugin

**Version** : 1.0
**Date** : 2026-01-29

---

## Vue d'ensemble

Ce guide explique comment intégrer la structure next-intl et migrer progressivement les textes hardcodés vers le système de traduction.

### Contenu livré

```
_bmad-output/i18n-harmonization/
├── CHARTE-EDITORIALE.md          # Ton, conventions, glossaire
├── MIGRATION-GUIDE.md            # Ce guide
└── src/
    ├── i18n/
    │   ├── config.ts             # Configuration des locales
    │   ├── request.ts            # Détection de locale côté serveur
    │   ├── navigation.ts         # Utilitaires de navigation
    │   └── messages/
    │       ├── fr.json           # Traductions françaises
    │       └── en.json           # Traductions anglaises
    └── components/
        └── locale-switcher.tsx   # Sélecteur de langue
```

---

## Phase 1 : Installation de next-intl

### 1.1 Installer la dépendance

```bash
cd packages/frontend
pnpm add next-intl
```

### 1.2 Copier les fichiers de configuration

Copier le contenu du dossier `src/` vers `packages/frontend/src/` :

```bash
# Depuis la racine du projet
cp -r _bmad-output/i18n-harmonization/src/i18n packages/frontend/src/
cp -r _bmad-output/i18n-harmonization/src/components/locale-switcher.tsx packages/frontend/src/components/
```

### 1.3 Configurer Next.js

Modifier `packages/frontend/next.config.ts` :

```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // ... configuration existante
};

export default withNextIntl(nextConfig);
```

### 1.4 Mettre à jour le layout racine

Modifier `packages/frontend/src/app/layout.tsx` :

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## Phase 2 : Migration progressive par écran

### Ordre de migration recommandé

1. **Navigation & Sidebar** (impact visuel immédiat)
2. **Onboarding** (dashboard homepage)
3. **Billing** (actuellement en anglais)
4. **Checkout & Landing** (côté follower)
5. **Autres écrans du dashboard**

### 2.1 Exemple : Migration de la Sidebar

**Avant** (`sidebar.tsx`) :

```typescript
const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mes offres', href: '/dashboard/products', icon: Package },
  // ...
];
```

**Après** :

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function Sidebar() {
  const t = useTranslations('nav');

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('products'), href: '/dashboard/products', icon: Package },
    { name: t('customers'), href: '/dashboard/customers', icon: Users },
    { name: t('subscriptions'), href: '/dashboard/subscriptions', icon: FileText },
    { name: t('promote'), href: '/dashboard/promote', icon: Megaphone },
    { name: t('payments'), href: '/dashboard/payments', icon: DollarSign },
    { name: t('channels'), href: '/dashboard/channels', icon: Hash },
    { name: t('access'), href: '/dashboard/access', icon: Key },
    { name: t('billing'), href: '/dashboard/billing', icon: CreditCard },
  ];

  // ... reste du composant
}
```

### 2.2 Exemple : Migration des statuts (centralisation)

**Avant** (répété dans chaque fichier) :

```typescript
const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif',
  PAST_DUE: 'Impayé',
  // ...
};
```

**Après** :

```typescript
import { useTranslations } from 'next-intl';

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const t = useTranslations('subscriptionStatus');

  return (
    <span className={statusColors[status]}>
      {t(status)}
    </span>
  );
}
```

### 2.3 Exemple : Migration des messages toast

**Avant** :

```typescript
toast.success('Channel ajouté avec succès');
toast.error('Erreur lors du chargement des données');
```

**Après** :

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations();

  // ...
  toast.success(t('channels.success'));
  toast.error(t('errors.loadingData'));
}
```

---

## Phase 3 : Patterns de migration

### 3.1 Composants Client ('use client')

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyClientComponent() {
  const t = useTranslations('dashboard');

  return <h1>{t('title')}</h1>;
}
```

### 3.2 Composants Serveur (Server Components)

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations('dashboard');

  return <h1>{t('title')}</h1>;
}
```

### 3.3 Interpolation de variables

JSON :
```json
{
  "welcome": "Bienvenue {name} !",
  "trialDaysLeft": "{count} jours d'essai restants"
}
```

Usage :
```typescript
t('welcome', { name: user.firstName })
t('trialDaysLeft', { count: 14 })
```

### 3.4 Pluralisation

JSON :
```json
{
  "subscribers": "{count, plural, =0 {Aucun abonné} =1 {1 abonné} other {# abonnés}}"
}
```

Usage :
```typescript
t('subscribers', { count: 5 }) // "5 abonnés"
```

---

## Phase 4 : Ajouter le sélecteur de langue

### 4.1 Dans la sidebar (créateurs)

```typescript
import { LocaleSwitcher } from '@/components/locale-switcher';
import { getLocale } from 'next-intl/server';

export async function Sidebar() {
  const locale = await getLocale();

  return (
    <div>
      {/* Navigation */}
      <LocaleSwitcher currentLocale={locale} />
    </div>
  );
}
```

### 4.2 Dans le footer (landing pages)

```typescript
import { LocaleSwitcher } from '@/components/locale-switcher';

export function Footer({ locale }) {
  return (
    <footer>
      <LocaleSwitcher currentLocale={locale} />
    </footer>
  );
}
```

---

## Checklist de migration par écran

### Navigation & Sidebar

- [ ] Importer `useTranslations`
- [ ] Remplacer les labels hardcodés par `t('nav.xxx')`
- [ ] Migrer le footer de la sidebar (`sidebar.proPlan`, etc.)

### Dashboard (homepage)

- [ ] Titre et sous-titre
- [ ] Labels des stats
- [ ] Quick actions (titre + description)
- [ ] Checklist "Pour commencer"

### Billing

- [ ] Titre et sous-titre
- [ ] Messages d'avertissement SaaS
- [ ] Section Stripe Connect
- [ ] Liste "Comment ça fonctionne"
- [ ] Messages d'erreur/succès

### Checkout

- [ ] Tous les labels de formulaire
- [ ] Messages d'erreur de validation
- [ ] Textes des boutons (états)
- [ ] Messages de confiance

### Subscriptions

- [ ] Titre et sous-titre
- [ ] Empty state
- [ ] Stats
- [ ] Filtres
- [ ] Table headers
- [ ] Status badges (utiliser `subscriptionStatus.xxx`)

### Autres écrans

Répéter le pattern pour : Products, Plans, Customers, Channels, Access, Payments, Promote.

---

## Bonnes pratiques

### Organisation des clés

```
{namespace}.{section}.{element}

Exemples :
- dashboard.stats.revenue
- checkout.form.email
- subscriptionStatus.ACTIVE
```

### Éviter les doublons

Utiliser les namespaces communs :
- `common.*` pour les boutons, actions génériques
- `subscriptionStatus.*` pour les statuts (une seule définition)
- `intervals.*` pour les intervalles de paiement
- `errors.*` pour les messages d'erreur génériques

### Validation des traductions

```bash
# Vérifier que toutes les clés FR ont leur équivalent EN
npx next-intl-cli validate ./src/i18n/messages
```

---

## Support

Pour toute question sur cette migration :
- Consulter la [documentation next-intl](https://next-intl-docs.vercel.app/)
- Référencer la charte éditoriale pour les conventions de ton
