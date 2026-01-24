# Design Tokens — Homepage

> Direction artistique validée : **Prune Élégant + Inter**

---

## Palette de couleurs

### Brand (Accent)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `brand-50` | `#FAE8FF` | fuchsia-50 | Backgrounds très légers |
| `brand-100` | `#F5D0FE` | fuchsia-100 | Badges, tags |
| `brand-200` | `#F0ABFC` | fuchsia-200 | Borders accent |
| `brand-500` | `#A855F7` | purple-500 | Liens |
| `brand-600` | `#9333EA` | purple-600 | **CTA principal** |
| `brand-700` | `#7E22CE` | purple-700 | **CTA hover** |
| `brand-800` | `#6B21A8` | purple-800 | Texte sur fond clair |
| `brand-900` | `#581C87` | purple-900 | Headings accent |

### Neutrals

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `text-primary` | `#1A1523` | custom | Headings, texte principal |
| `text-secondary` | `#6F6E77` | custom | Paragraphes, descriptions |
| `text-muted` | `#A1A1AA` | zinc-400 | Placeholders, captions |
| `background` | `#FFFFFF` | white | Fond principal |
| `surface` | `#FDFAFF` | custom | Sections alternées |
| `border` | `#E9E3EF` | custom | Bordures, dividers |
| `border-hover` | `#D8D0E0` | custom | Bordures au hover |

### Feedback

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `success` | `#22C55E` | green-500 | Confirmations |
| `error` | `#EF4444` | red-500 | Erreurs |
| `warning` | `#F59E0B` | amber-500 | Alertes |

---

## Typographie

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Installation Next.js

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Échelle typographique

| Élément | Classe Tailwind | Specs |
|---------|-----------------|-------|
| H1 (Hero) | `text-5xl md:text-6xl font-bold tracking-tight` | 48-60px, -0.02em |
| H2 (Section) | `text-3xl md:text-4xl font-semibold tracking-tight` | 30-36px, -0.02em |
| H3 (Card) | `text-xl font-semibold` | 20px |
| Body | `text-base text-[#6F6E77]` | 16px |
| Body large | `text-lg text-[#6F6E77]` | 18px |
| Small | `text-sm text-[#A1A1AA]` | 14px |
| CTA | `text-sm font-semibold` | 14px, 600 |

---

## Espacements

| Token | Valeur | Usage |
|-------|--------|-------|
| Section padding | `py-20 lg:py-28` | Entre sections |
| Container | `max-w-6xl mx-auto px-4 lg:px-6` | Contenu centré |
| Card padding | `p-6 lg:p-8` | Intérieur cards |
| Stack gap | `space-y-4` | Éléments texte |
| Grid gap | `gap-6 lg:gap-8` | Entre cards |

---

## Composants

### Bouton Primary

```tsx
<button className="
  bg-purple-600 hover:bg-purple-700
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-colors duration-150
  shadow-sm hover:shadow-md
  focus:outline-none focus-visible:ring-2
  focus-visible:ring-purple-500 focus-visible:ring-offset-2
">
  Start monetizing →
</button>
```

### Bouton Secondary

```tsx
<button className="
  bg-white hover:bg-purple-50
  text-[#1A1523] font-semibold
  px-6 py-3 rounded-lg
  border border-[#E9E3EF] hover:border-purple-200
  transition-colors duration-150
  focus:outline-none focus-visible:ring-2
  focus-visible:ring-purple-500 focus-visible:ring-offset-2
">
  View pricing
</button>
```

### Bouton Ghost (Navbar)

```tsx
<a className="
  text-[#6F6E77] hover:text-[#1A1523]
  font-medium
  transition-colors duration-150
">
  Pricing
</a>
```

### Card

```tsx
<div className="
  bg-white
  border border-[#E9E3EF] hover:border-purple-200
  rounded-xl p-6
  transition-colors duration-150
">
  {/* Content */}
</div>
```

### Section alternée

```tsx
<section className="bg-[#FDFAFF] py-20 lg:py-28">
  {/* Content */}
</section>
```

---

## Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom neutrals (prune-tinted)
        'text-primary': '#1A1523',
        'text-secondary': '#6F6E77',
        'surface': '#FDFAFF',
        'border-custom': '#E9E3EF',
        'border-hover': '#D8D0E0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
}
```

---

## Navbar Specs

| Propriété | Valeur |
|-----------|--------|
| Height | `h-16` (64px) desktop, `h-14` (56px) mobile |
| Background | `bg-white/80 backdrop-blur-sm` |
| Border | `border-b border-[#E9E3EF]` |
| Position | `sticky top-0 z-50` |
| Container | `max-w-6xl mx-auto px-4 lg:px-6` |
| Shadow on scroll | `shadow-sm` (via JS après 50px scroll) |

### Breakpoints

| Breakpoint | Comportement |
|------------|--------------|
| `< 768px` | Menu burger, CTA compact visible |
| `>= 768px` | Navigation complète |

---

## Checklist Accessibilité

- [x] Contrast ratio texte principal ≥ 7:1
- [x] Contrast ratio CTA ≥ 4.5:1
- [x] Focus visible sur tous les interactifs
- [x] Touch targets ≥ 44px en mobile
- [x] Font size minimum 14px

---

## Fichiers associés

- Wireframe : `_bmad-output/planning-artifacts/homepage-wireframe.excalidraw`
- Copy : conversation du 2025-01-24

---

*Design system validé — Prêt pour implémentation*
