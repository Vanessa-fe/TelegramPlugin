# URLs à Tester - Validation SEO Sublynk

## 🧪 Google Rich Results Test

**Outil:** https://search.google.com/test/rich-results

### URLs à Tester (Copier-Coller)

```
https://sublynk.fr/
```
**Schemas attendus:** Organization, SoftwareApplication, WebSite

---

```
https://sublynk.fr/pricing
```
**Schemas attendus:** BreadcrumbList, Product (avec 3 Offers)

---

```
https://sublynk.fr/faq
```
**Schemas attendus:** FAQPage, BreadcrumbList

---

```
https://sublynk.fr/about
```
**Schemas attendus:** BreadcrumbList

---

```
https://sublynk.fr/blog
```
**Schemas attendus:** BreadcrumbList

---

```
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```
**Schemas attendus:** BlogPosting, BreadcrumbList

---

```
https://sublynk.fr/ressources
```
**Schemas attendus:** BreadcrumbList

---

```
https://sublynk.fr/solutions/abonnement-telegram-payant
```
**Schemas attendus:** BreadcrumbList

---

## 📱 Facebook Sharing Debugger

**Outil:** https://developers.facebook.com/tools/debug/

### URLs à Tester

```
https://sublynk.fr/
https://sublynk.fr/pricing
https://sublynk.fr/faq
https://sublynk.fr/blog
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

**Vérifications:**
- Image OG: 1200x630
- Titre présent
- Description présente
- Type: website/article

---

## 🐦 Twitter Card Validator

**Outil:** https://cards-dev.twitter.com/validator

### URLs à Tester

```
https://sublynk.fr/
https://sublynk.fr/pricing
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

**Vérifications:**
- Card type: summary_large_image
- Image affichée
- Titre et description

---

## 💼 LinkedIn Post Inspector

**Outil:** https://www.linkedin.com/post-inspector/

### URLs à Tester

```
https://sublynk.fr/
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

---

## 🚀 PageSpeed Insights

**Outil:** https://pagespeed.web.dev/

### URLs à Tester

**Homepage:**
```
https://pagespeed.web.dev/analysis?url=https://sublynk.fr/
```

**Pricing:**
```
https://pagespeed.web.dev/analysis?url=https://sublynk.fr/pricing
```

**Blog:**
```
https://pagespeed.web.dev/analysis?url=https://sublynk.fr/blog
```

**Article:**
```
https://pagespeed.web.dev/analysis?url=https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

**Objectifs:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 🗺️ Sitemap & Robots

### Sitemap

```
https://sublynk.fr/sitemap.xml
```

**Vérifications:**
- Format XML valide
- 26+ URLs
- Priority présente (0.3-1.0)
- ChangeFrequency présente
- FR + EN pour chaque page

### Robots.txt

```
https://sublynk.fr/robots.txt
```

**Contenu attendu:**
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /checkout/
Disallow: /en/dashboard/
Disallow: /en/admin/
Disallow: /en/checkout/

Sitemap: https://sublynk.fr/sitemap.xml
```

---

## 🖼️ Images OpenGraph Dynamiques

### URLs Images

**Homepage:**
```
https://sublynk.fr/opengraph-image
```

**Pricing:**
```
https://sublynk.fr/pricing/opengraph-image
```

**FAQ:**
```
https://sublynk.fr/faq/opengraph-image
```

**Vérifications:**
- Taille: 1200x630
- Format: PNG
- Poids: < 1MB
- Branding violet

---

## 📊 Google Search Console

### Actions à Effectuer

1. **Soumettre le sitemap**
   - URL: https://search.google.com/search-console
   - Aller dans Sitemaps
   - Ajouter: `sitemap.xml`
   - Cliquer "Envoyer"

2. **Inspecter les URLs**

Inspecter ces URLs une par une:
```
https://sublynk.fr/
https://sublynk.fr/pricing
https://sublynk.fr/faq
https://sublynk.fr/blog
https://sublynk.fr/ressources
https://sublynk.fr/solutions/abonnement-telegram-payant
```

3. **Vérifier Indexation**
   - Pages → Vue d'ensemble
   - Vérifier que toutes les pages sont "Indexées"

4. **Expérience sur la page**
   - Vérifier Core Web Vitals
   - S'assurer qu'il n'y a pas d'erreurs mobiles

---

## 🔍 Schema Markup Validator

**Outil:** https://validator.schema.org/

### URLs à Tester

```
https://sublynk.fr/
https://sublynk.fr/faq
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

**Vérifications:**
- Aucune erreur
- Aucun warning (ou justifiable)

---

## 📱 Mobile-Friendly Test

**Outil:** https://search.google.com/test/mobile-friendly

### URLs à Tester

```
https://sublynk.fr/
https://sublynk.fr/pricing
https://sublynk.fr/blog/comment-monetiser-canal-telegram
```

**Objectif:** Page mobile-friendly ✅

---

## 🎯 Checklist Rapide

### Tests Critiques (À Faire Maintenant)

- [ ] Rich Results Test - Homepage
- [ ] Rich Results Test - FAQ Page
- [ ] Rich Results Test - Blog Article
- [ ] Sitemap accessible (sublynk.fr/sitemap.xml)
- [ ] Robots.txt accessible (sublynk.fr/robots.txt)
- [ ] Images OG s'affichent correctement
- [ ] Facebook Debugger - Homepage
- [ ] PageSpeed > 90 - Homepage

### Tests Importants (À Faire Cette Semaine)

- [ ] Tous les schemas Rich Results
- [ ] Toutes les URLs PageSpeed
- [ ] Submit sitemap à Search Console
- [ ] Vérifier indexation Search Console
- [ ] Twitter Card Validator
- [ ] LinkedIn Post Inspector
- [ ] Mobile-Friendly Test
- [ ] Schema Markup Validator

### Tests de Suivi (Mensuel)

- [ ] Positions mots-clés (Semrush/Ahrefs)
- [ ] Backlinks nouveaux
- [ ] Core Web Vitals trends
- [ ] Trafic organique (Analytics)
- [ ] CTR Search Console
- [ ] Pages indexées (Search Console)

---

## 📝 Template de Rapport de Test

Quand vous testez, utilisez ce template:

```markdown
## Test du [DATE]

### URL Testée: [URL]

**Outil:** [Nom de l'outil]

**Résultat:**
- ✅ / ❌ Schema détecté: [Type]
- ✅ / ❌ Aucune erreur
- ✅ / ❌ Score: [X/100]

**Problèmes:**
1. [Problème 1]
2. [Problème 2]

**Actions:**
- [ ] Corriger [problème]
- [ ] Retester dans X jours
```

---

## 🔗 Liens Rapides (Bookmarks)

Créez des favoris pour accès rapide:

```
Rich Results:     https://search.google.com/test/rich-results
PageSpeed:        https://pagespeed.web.dev/
Search Console:   https://search.google.com/search-console
FB Debugger:      https://developers.facebook.com/tools/debug/
Twitter Cards:    https://cards-dev.twitter.com/validator
Schema Validator: https://validator.schema.org/
Mobile Test:      https://search.google.com/test/mobile-friendly
```

---

**Dernière mise à jour:** 2026-08-05
**Prochaine révision:** Après tests initiaux
