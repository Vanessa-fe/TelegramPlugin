# Harmonisation i18n — TelegramPlugin

**Livrable** : Structure next-intl + traductions FR/EN
**Date** : 2026-01-29

---

## Contenu du livrable

| Fichier | Description |
|---------|-------------|
| `CHARTE-EDITORIALE.md` | Ton de voix, conventions, glossaire unifié |
| `MIGRATION-GUIDE.md` | Guide pas à pas pour l'intégration |
| `src/i18n/config.ts` | Configuration des locales (FR par défaut) |
| `src/i18n/request.ts` | Détection de locale côté serveur |
| `src/i18n/navigation.ts` | Utilitaires de navigation |
| `src/i18n/messages/fr.json` | **~400 clés** — Traductions françaises |
| `src/i18n/messages/en.json` | **~400 clés** — Traductions anglaises |
| `src/components/locale-switcher.tsx` | Sélecteur de langue |

---

## Structure des traductions

```
{
  "common": { ... },           // Boutons, actions génériques
  "nav": { ... },              // Navigation sidebar
  "auth": {                    // Authentification
    "login": { ... },
    "register": { ... }
  },
  "dashboard": { ... },        // Page d'accueil créateur
  "products": { ... },         // Gestion des offres
  "plans": { ... },            // Formules tarifaires
  "intervals": { ... },        // Intervalles (mois, an, etc.)
  "subscriptionStatus": { ... }, // Statuts d'abonnement
  "accessStatus": { ... },     // Statuts d'accès
  "customers": { ... },        // Gestion clients
  "subscriptions": { ... },    // Gestion abonnés
  "promote": { ... },          // Page promotion
  "channels": { ... },         // Gestion canaux
  "access": { ... },           // Gestion accès
  "payments": { ... },         // Événements de paiement
  "billing": { ... },          // Facturation Stripe
  "checkout": { ... },         // Page de paiement follower
  "checkoutSuccess": { ... },  // Confirmation paiement
  "checkoutCancel": { ... },   // Annulation paiement
  "errors": { ... },           // Messages d'erreur
  "success": { ... },          // Messages de succès
  "footer": { ... }            // Liens footer
}
```

---

## Points clés harmonisés

### Avant → Après

| Problème | Solution |
|----------|----------|
| Auth en anglais | Traduit en FR/EN cohérent |
| Billing en anglais | Traduit en FR/EN cohérent |
| Statuts dupliqués 4x | Centralisés dans `subscriptionStatus` |
| Intervalles dupliqués | Centralisés dans `intervals` |
| Ton incohérent | Charte éditoriale définie |
| Accents manquants | Corrigés (À, É, etc.) |

### Ton adopté

- **Créateur (dashboard)** : Tutoiement, encourageant, simple
- **Follower (checkout)** : Vouvoiement, rassurant, clair
- **Erreurs** : Humaines, avec solution quand possible

---

## Prochaines étapes

1. **Installer** : `pnpm add next-intl`
2. **Copier** : Les fichiers `src/` vers le frontend
3. **Configurer** : Modifier `next.config.ts` et `layout.tsx`
4. **Migrer** : Écran par écran (voir guide)

### Ordre de migration suggéré

1. Navigation & Sidebar
2. Dashboard (onboarding)
3. Billing
4. Checkout & Landing
5. Autres écrans

---

## Questions fréquentes

**Q: Puis-je modifier les traductions ?**
Oui ! Les fichiers JSON sont ta source de vérité. Adapte selon tes besoins.

**Q: Comment ajouter une nouvelle langue ?**
1. Copier `fr.json` → `{locale}.json`
2. Traduire
3. Ajouter la locale dans `config.ts`

**Q: Et les textes dynamiques (prix, dates) ?**
Utiliser les fonctions d'interpolation :
```typescript
t('price', { amount: formatPrice(plan.priceCents) })
```

---

*Livré par Paige, Technical Writer*
